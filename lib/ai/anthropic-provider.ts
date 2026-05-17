import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type {
  AiProvider,
  AiOptimizeRequest,
  AiOptimizeResponse,
  AiAnalyzeRequest,
  AiAnalyzeResponse,
  AiCoverLetterRequest,
  AiCoverLetterResponse,
} from './provider'
import {
  buildOptimizePrompt,
  buildExtractKeywordsPrompt,
  buildCoverLetterPrompt,
  buildOutreachPrompt,
} from './prompts'

const OptimizeResponseSchema = z.object({
  positionIds: z.array(z.string()),
  bulletIds: z.array(z.string()),
  skillCategoryIds: z.array(z.string()),
  rewrittenBullets: z.record(z.string(), z.string()).optional(),
})

const AnalyzeResponseSchema = z.object({
  required_skills: z.array(z.string()).default([]),
  preferred_skills: z.array(z.string()).default([]),
  experience_requirements: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
})

export class AnthropicProvider implements AiProvider {
  readonly id = 'anthropic'
  readonly name = 'Anthropic (Claude)'

  constructor(private readonly apiKey?: string) {}

  private getApiKey(): string | undefined {
    return this.apiKey ?? process.env.ANTHROPIC_API_KEY
  }

  private createClient(): Anthropic {
    const key = this.getApiKey()
    if (!key) throw new Error('Anthropic API key not configured')
    return new Anthropic({ apiKey: key })
  }

  async isAvailable(): Promise<boolean> {
    const key = this.getApiKey()
    if (!key) return false
    try {
      new Anthropic({ apiKey: key })
      return true
    } catch {
      return false
    }
  }

  async generateText(prompt: string): Promise<string> {
    const client = this.createClient()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type from Anthropic API')
    return content.text.trim()
  }

  async optimize(req: AiOptimizeRequest): Promise<AiOptimizeResponse> {
    const client = this.createClient()
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: buildOptimizePrompt(req) }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type from Anthropic API')

    let parsed: unknown
    try {
      parsed = JSON.parse(content.text.trim())
    } catch {
      throw new Error(`Failed to parse AI response as JSON: ${content.text.slice(0, 200)}`)
    }

    const result = OptimizeResponseSchema.safeParse(parsed)
    if (!result.success) {
      throw new Error(`AI response did not match expected schema: ${result.error.message}`)
    }
    return result.data
  }

  async analyzeJd(req: AiAnalyzeRequest): Promise<AiAnalyzeResponse> {
    const client = this.createClient()
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildExtractKeywordsPrompt(req.jobDescription) }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type from Anthropic API')

    let parsed: unknown
    try {
      parsed = JSON.parse(content.text.trim())
    } catch {
      throw new Error(`Failed to parse keyword extraction response: ${content.text.slice(0, 200)}`)
    }

    const result = AnalyzeResponseSchema.safeParse(parsed)
    if (!result.success) {
      throw new Error(`Keyword extraction response did not match schema: ${result.error.message}`)
    }

    return {
      requiredSkills: result.data.required_skills,
      preferredSkills: result.data.preferred_skills,
      keywords: result.data.keywords,
      experienceRequirements: result.data.experience_requirements,
    }
  }

  async generateCoverLetter(req: AiCoverLetterRequest): Promise<AiCoverLetterResponse> {
    const client = this.createClient()

    const [coverMsg, outreachMsg] = await Promise.all([
      client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        messages: [{ role: 'user', content: buildCoverLetterPrompt(req.resumeJson, req.jobDescription, { length: req.length, tone: req.tone, customPrompt: req.customPrompt }) }],
      }),
      client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 256,
        messages: [{ role: 'user', content: buildOutreachPrompt(req.resumeJson, req.jobDescription) }],
      }),
    ])

    const coverContent = coverMsg.content[0]
    const outreachContent = outreachMsg.content[0]
    if (coverContent.type !== 'text' || outreachContent.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API')
    }

    return {
      coverLetter: coverContent.text.trim(),
      outreachMessage: outreachContent.text.trim(),
    }
  }
}
