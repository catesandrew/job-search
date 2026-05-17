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
import { buildExtractKeywordsPrompt, buildCoverLetterPrompt, buildOutreachPrompt } from './prompts'

const OptimizeResponseSchema = z.object({
  positionIds: z.array(z.string()),
  bulletIds: z.array(z.string()),
  skillCategoryIds: z.array(z.string()),
  rewrittenBullets: z.record(z.string(), z.string()).optional(),
})

type McpContentBlock = { type: 'text'; text: string } | { type: string }

interface McpProviderConfig {
  id: string
  name: string
  preferredTool?: string
}

// Parse MCP Streamable HTTP SSE body — "data: {...}\n\n"
function parseSSE(body: string): unknown {
  for (const line of body.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('data:')) {
      const json = trimmed.slice(5).trim()
      if (json) {
        try { return JSON.parse(json) } catch { /* try next line */ }
      }
    }
  }
  return null
}

const MCP_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/event-stream',
}

export class McpBridgeProvider implements AiProvider {
  readonly id: string
  readonly name: string
  private readonly preferredTool?: string

  constructor(config: McpProviderConfig, private readonly bridgeUrl?: string) {
    this.id = config.id
    this.name = config.name
    this.preferredTool = config.preferredTool
  }

  private getUrl(): string | undefined {
    return this.bridgeUrl
  }

  // Initialize a session and return the session ID
  private async initSession(url: string): Promise<string | null> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: MCP_HEADERS,
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'resume-app', version: '1.0.0' },
          },
        }),
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) return null
      const sessionId = res.headers.get('mcp-session-id')
      if (!sessionId) return null

      // Acknowledge initialization
      await fetch(url, {
        method: 'POST',
        headers: { ...MCP_HEADERS, 'Mcp-Session-Id': sessionId },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
        signal: AbortSignal.timeout(3000),
      }).catch(() => {})

      return sessionId
    } catch {
      return null
    }
  }

  // Send a JSON-RPC request over an established session
  private async mcpRequest(url: string, sessionId: string, method: string, params?: unknown): Promise<unknown> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...MCP_HEADERS, 'Mcp-Session-Id': sessionId },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, ...(params ? { params } : {}) }),
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) throw new Error(`MCP returned ${res.status}`)
    return parseSSE(await res.text())
  }

  // List tools from an established session
  private async listTools(url: string, sessionId: string): Promise<string[]> {
    try {
      const data = await this.mcpRequest(url, sessionId, 'tools/list') as {
        result?: { tools?: Array<{ name: string }> }
      }
      return (data?.result?.tools ?? []).map(t => t.name)
    } catch {
      return []
    }
  }

  // Call a tool and extract text content from the SSE response
  private async callTool(url: string, sessionId: string, toolName: string, args: Record<string, string>): Promise<string | null> {
    try {
      const data = await this.mcpRequest(url, sessionId, 'tools/call', { name: toolName, arguments: args }) as {
        result?: { content?: McpContentBlock[]; output?: string; text?: string }
      }
      const result = data?.result
      if (!result) return null
      if (Array.isArray(result.content)) {
        const block = result.content.find((c): c is { type: 'text'; text: string } => c.type === 'text')
        if (block?.text) return block.text.trim()
      }
      if (result.output) return String(result.output).trim()
      if (result.text) return String(result.text).trim()
    } catch {
      return null
    }
    return null
  }

  // Public: call a specific named tool by name (for resume specialist tools)
  async callNamedTool(toolName: string, args: Record<string, string>): Promise<string | null> {
    const url = this.getUrl()
    if (!url) return null
    const sessionId = await this.initSession(url)
    if (!sessionId) return null
    return this.callTool(url, sessionId, toolName, args)
  }

  async isAvailable(): Promise<boolean> {
    const url = this.getUrl()
    if (!url) return false
    const sessionId = await this.initSession(url)
    return sessionId !== null
  }

  async generateText(prompt: string): Promise<string> {
    const url = this.getUrl()
    if (!url) throw new Error(`${this.name} URL not configured. Set it in Settings.`)

    const sessionId = await this.initSession(url)
    if (!sessionId) throw new Error(`${this.name}: failed to establish MCP session at ${url}`)

    let toolName = this.preferredTool
    if (!toolName) {
      const tools = await this.listTools(url, sessionId)
      const preferred = ['ask', 'generate', 'query', 'claude', 'codex', 'chat']
      toolName = tools.find(t => preferred.includes(t)) ?? tools[0]
    }

    if (!toolName) throw new Error(`${this.name}: no usable tool found`)

    const result = await this.callTool(url, sessionId, toolName, { prompt })
    if (result) return result

    throw new Error(`${this.name}: tool "${toolName}" returned no text content`)
  }

  async analyzeJd(req: AiAnalyzeRequest): Promise<AiAnalyzeResponse> {
    const text = await this.generateText(buildExtractKeywordsPrompt(req.jobDescription))
    try {
      const parsed = JSON.parse(text) as {
        required_skills?: string[]
        preferred_skills?: string[]
        keywords?: string[]
        experience_requirements?: string[]
      }
      return {
        requiredSkills: parsed.required_skills ?? [],
        preferredSkills: parsed.preferred_skills ?? [],
        keywords: parsed.keywords ?? [],
        experienceRequirements: parsed.experience_requirements ?? [],
      }
    } catch {
      throw new Error(`Failed to parse keyword extraction response: ${text.slice(0, 200)}`)
    }
  }

  async generateCoverLetter(req: AiCoverLetterRequest): Promise<AiCoverLetterResponse> {
    const [coverLetter, outreachMessage] = await Promise.all([
      this.generateText(buildCoverLetterPrompt(req.resumeJson, req.jobDescription, { length: req.length, tone: req.tone, customPrompt: req.customPrompt })),
      this.generateText(buildOutreachPrompt(req.resumeJson, req.jobDescription)),
    ])
    return { coverLetter, outreachMessage }
  }

  async optimize(req: AiOptimizeRequest): Promise<AiOptimizeResponse> {
    const positionList = req.masterResume.positions
      .map(p =>
        `Position ID: ${p.id}\nTitle: ${p.title} at ${p.company}\nBullets:\n${p.bullets.map(b => `  - ${b.id}: ${b.content}`).join('\n')}`
      )
      .join('\n\n')

    const skillList = req.masterResume.skills
      .map(s => `Category ID: ${s.id} — ${s.name}: ${s.skills}`)
      .join('\n')

    const prompt = `You are a resume optimizer. Select the most relevant positions, bullets, and skill categories for the job description below. Respond with ONLY valid JSON — no markdown, no explanation.

Format:
{"positionIds":["id1","id2"],"bulletIds":["b1","b2"],"skillCategoryIds":["s1"],"rewrittenBullets":{"bulletId":"improved bullet text"}}

Rules:
- Select 2-4 most relevant positions (use exact IDs from the list)
- Select the best matching bullets from those positions (use exact IDs)
- Optionally rewrite 1-3 bullets to better align with the job description (keep content truthful)
- Include relevant skill category IDs

Job Description:
${req.jobDescription.slice(0, 2000)}

Master Resume Positions:
${positionList}

Skill Categories:
${skillList}`

    const raw = await this.generateText(prompt)

    // Strip markdown fences if present
    const stripped = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    let parsed: unknown = null
    try { parsed = JSON.parse(stripped) } catch { /* fall through */ }
    if (!parsed) {
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) { try { parsed = JSON.parse(match[0]) } catch { /* fall through */ } }
    }

    const result = OptimizeResponseSchema.safeParse(parsed)
    if (result.success) return result.data

    console.error('[optimize] failed to parse response (first 300):', raw.slice(0, 300))
    return { positionIds: [], bulletIds: [], skillCategoryIds: [] }
  }
}
