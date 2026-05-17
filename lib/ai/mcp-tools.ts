/**
 * Typed wrappers for the 18 resume-specialist MCP tools added to mcp-agent-bridge.
 * Each function takes structured inputs, calls the named tool via the active provider's
 * MCP bridge, and returns parsed output.
 *
 * Falls back to generateText (prompt-based) if the named tool is not available.
 */

import { getActiveProvider } from './provider-registry'
import { McpBridgeProvider } from './mcp-bridge-provider'

// ── Low-level named-tool caller ───────────────────────────────────────────────

export async function callNamedMcpTool(
  toolName: string,
  args: Record<string, string>,
  fallbackPrompt?: string,
): Promise<string> {
  const provider = await getActiveProvider()
  if (!provider) throw new Error('No AI provider configured')
  if (provider instanceof McpBridgeProvider) {
    const result = await provider.callNamedTool(toolName, args)
    if (result) return result
  }

  // Fallback: use explicit prompt if provided, otherwise generic
  const prompt = fallbackPrompt
    ? fallbackPrompt.replace(/\{\{(\w+)\}\}/g, (_, key) => args[key] ?? '')
    : `You are acting as the "${toolName}" tool. Given the following inputs, produce the expected output.\n\nInputs:\n${JSON.stringify(args, null, 2)}`
  return provider.generateText(prompt)
}

// ── Tool interfaces ───────────────────────────────────────────────────────────

export interface CareerFact {
  id: string
  claim: string
  sourceText: string
  confidence: number // 0–1
  category: 'achievement' | 'skill' | 'responsibility' | 'metric' | 'credential'
}

export interface FactLibrary {
  facts: CareerFact[]
  extractedAt: string
}

export interface ScreenScore {
  overall: number // 0–100
  dimensions: {
    roleFit: number
    clarity: number
    senioritySignal: number
    impact: number
    credibility: number
    keywordAlignment: number
    formatting: number
    brevity: number
  }
  feedback: Array<{ dimension: string; score: number; note: string }>
  passedFirstScreen: boolean
}

export interface InterviewQuestion {
  question: string
  probability: 'high' | 'medium' | 'low'
  category: 'behavioral' | 'technical' | 'situational' | 'culture'
  starFramework: { situation: string; task: string; action: string; result: string }
  suggestedAnswer: string
  source?: 'provided' | 'generated'
}

export interface TailoredResume {
  content: string
  changeLog: Array<{ field: string; before: string; after: string; factId?: string }>
  keywordCoverage: Array<{ keyword: string; present: boolean; location?: string }>
  evidenceMap: Array<{ claim: string; factId: string; confidence: number }>
}

export interface JdAnalysis {
  requiredSkills: string[]
  preferredSkills: string[]
  keywords: string[]
  experienceRequirements: string[]
  redFlags: string[]
  matchScore?: number
}

// ── Tool wrappers ─────────────────────────────────────────────────────────────

export async function extractCareerFacts(resumeText: string): Promise<FactLibrary> {
  const now = new Date().toISOString()
  const raw = await callNamedMcpTool(
    'career_fact_extractor',
    { source_material: resumeText },
    `Extract verifiable career facts from this resume text. Respond with ONLY valid JSON — no markdown, no explanation.

Format:
{"facts":[{"id":"f1","claim":"one-sentence verifiable claim","sourceText":"exact text from resume","confidence":0.9,"category":"achievement"}],"extractedAt":"${now}"}

Valid categories: achievement, skill, responsibility, metric, credential
Extract at least 10-20 facts covering metrics, achievements, skills, and credentials.

Resume:
{{source_material}}`,
  )
  const parsed = safeParseJson<FactLibrary>(raw)
  if (parsed?.facts) return parsed
  return { facts: [], extractedAt: new Date().toISOString() }
}

export async function simulateRecruiterScreen(
  resumeText: string,
  jobDescription?: string,
): Promise<ScreenScore> {
  // The recruiter_first_screen_simulation MCP tool returns narrative prose, not JSON.
  // Use generateText directly with a strict JSON prompt (same pattern as tailor-from-library).
  const provider = await getActiveProvider()
  if (!provider) throw new Error('No AI provider configured')

  const prompt = `You are a senior recruiter doing a 30-second resume screen. Score this resume across 8 dimensions (0-100). Respond with ONLY valid JSON — no markdown, no explanation.

Format:
{"overall":75,"dimensions":{"roleFit":80,"clarity":70,"senioritySignal":75,"impact":80,"credibility":70,"keywordAlignment":75,"formatting":85,"brevity":70},"feedback":[{"dimension":"roleFit","score":80,"note":"one sentence note"}],"passedFirstScreen":true}

passedFirstScreen is true if overall >= 65.${jobDescription ? `\n\nJob description:\n${jobDescription.slice(0, 1500)}` : ''}

Resume:
${resumeText}`

  const raw = await provider.generateText(prompt)
  console.log('[simulateRecruiterScreen] raw (first 300):', raw.slice(0, 300))
  const parsed = safeParseJson<ScreenScore>(raw)
  console.log('[simulateRecruiterScreen] parsed overall:', parsed?.overall)
  if (parsed?.overall !== undefined) return parsed
  return {
    overall: 0,
    dimensions: { roleFit: 0, clarity: 0, senioritySignal: 0, impact: 0, credibility: 0, keywordAlignment: 0, formatting: 0, brevity: 0 },
    feedback: [],
    passedFirstScreen: false,
  }
}

export async function generateInterviewPrep(
  resumeText: string,
  jobDescription: string,
  company: string,
  role: string,
  libraryText?: string,
  predefinedQuestions?: string[],
): Promise<InterviewQuestion[]> {
  const provider = await getActiveProvider()
  if (!provider) throw new Error('No AI provider configured')

  const experienceSection = [resumeText, libraryText].filter(Boolean).join('\n\n---\n\n')
  const hasPredefined = predefinedQuestions && predefinedQuestions.length > 0
  const additionalCount = hasPredefined ? Math.max(4, 8 - predefinedQuestions.length) : 8

  const prompt = `Generate interview questions for a ${role} role at ${company}. Respond with ONLY valid JSON — no markdown, no explanation.

Format: {"questions":[{"question":"exact question text","probability":"high","category":"behavioral","starFramework":{"situation":"context","task":"what was needed","action":"what you did","result":"outcome"},"suggestedAnswer":"2-3 sentence answer","source":"provided"}]}

Rules:
- Probability: high, medium, or low. Category: behavioral, technical, situational, or culture.
- For STAR fields and suggestedAnswer: use SPECIFIC examples from the candidate's experience below. Reference real projects, companies, metrics, and outcomes. Do NOT use generic placeholders.
- If the experience section is empty, use plausible examples clearly marked as approximate.${hasPredefined ? `

REQUIRED — answer these exact questions first (copy question text verbatim, set "source":"provided"):
${predefinedQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Then add ${additionalCount} more likely questions for this role (set "source":"generated").` : `\nGenerate 8-10 questions total (set "source":"generated" on all).`}${experienceSection ? `\n\nCandidate experience:\n${experienceSection.slice(0, 4000)}` : ''}

Job description:
${jobDescription.slice(0, 2000)}`

  const raw = await provider.generateText(prompt)
  const parsed = safeParseJson<{ questions: InterviewQuestion[] } | InterviewQuestion[]>(raw)
  if (Array.isArray(parsed)) return parsed
  if (parsed && 'questions' in parsed) return parsed.questions
  return []
}

export async function analyzeJobDescriptionFull(
  jobDescription: string,
  resumeText?: string,
): Promise<JdAnalysis> {
  const args: Record<string, string> = { job_description: jobDescription }
  if (resumeText) args.resume = resumeText
  const raw = await callNamedMcpTool('job_description_analyzer', args)
  const parsed = safeParseJson<JdAnalysis>(raw)
  return parsed ?? {
    requiredSkills: [],
    preferredSkills: [],
    keywords: [],
    experienceRequirements: [],
    redFlags: [],
  }
}

export async function tailorResume(
  resumeText: string,
  jobDescription: string,
  factLibrary?: FactLibrary,
): Promise<TailoredResume> {
  // resume_tailor also requires company_name and role_title which aren't available here;
  // those missing fields cause the MCP tool to fall back to the generateText prompt.
  const args: Record<string, string> = {
    resume: resumeText,
    job_description: jobDescription,
  }
  if (factLibrary) args.additional_context = `Fact library: ${JSON.stringify(factLibrary)}`
  const raw = await callNamedMcpTool('resume_tailor', args)
  const parsed = safeParseJson<TailoredResume>(raw)
  return parsed ?? { content: raw, changeLog: [], keywordCoverage: [], evidenceMap: [] }
}

export async function optimizeTechResume(
  resumeText: string,
  jobDescription?: string,
  factLibrary?: FactLibrary,
): Promise<TailoredResume> {
  const args: Record<string, string> = {
    resume: resumeText,
    role_type: 'software_engineer',
  }
  if (jobDescription) args.job_description = jobDescription
  if (factLibrary) args.additional_context = `Fact library: ${JSON.stringify(factLibrary)}`
  const raw = await callNamedMcpTool('tech_resume_optimizer', args)
  const parsed = safeParseJson<TailoredResume>(raw)
  return parsed ?? { content: raw, changeLog: [], keywordCoverage: [], evidenceMap: [] }
}

export async function optimizeAts(resumeText: string, jobDescription?: string): Promise<string> {
  const args: Record<string, string> = { resume: resumeText }
  if (jobDescription) args.job_description = jobDescription
  return callNamedMcpTool('resume_ats_optimizer', args)
}

export async function writeBulletsXYZ(
  bullets: string[],
  positionTitle: string,
  company: string,
  factLibrary?: FactLibrary,
): Promise<string[]> {
  const args: Record<string, string> = {
    bullets: bullets.join('\n'),
    role_context: `${positionTitle} at ${company}`,
  }
  if (factLibrary) args.additional_context = `Fact library: ${JSON.stringify(factLibrary)}`
  const raw = await callNamedMcpTool('resume_bullet_writer', args)
  const parsed = safeParseJson<string[]>(raw)
  if (Array.isArray(parsed)) return parsed
  const prose = extractBulletsFromProse(raw, bullets.length)
  return prose.length > 0 ? prose : []
}

export async function quantifyBullets(
  bullets: string[],
  positionTitle: string,
  company: string,
): Promise<string[]> {
  const raw = await callNamedMcpTool('resume_quantifier', {
    bullets: bullets.join('\n'),
    role_context: `${positionTitle} at ${company}`,
  })
  const parsed = safeParseJson<string[]>(raw)
  if (Array.isArray(parsed)) return parsed
  const prose = extractBulletsFromProse(raw, bullets.length)
  return prose.length > 0 ? prose : []
}

export async function optimizeLinkedIn(resumeText: string, targetRole?: string): Promise<string> {
  const args: Record<string, string> = { current_profile: resumeText }
  if (targetRole) args.target_role = targetRole
  return callNamedMcpTool('linkedin_profile_optimizer', args)
}

// ── Prose bullet extractor ────────────────────────────────────────────────────

function extractBulletsFromProse(text: string, expectedCount: number): string[] {
  const lines = text.split('\n')
  const bullets = lines
    .map(l => l.trim())
    .filter(l => /^[-•*]\s+/.test(l))
    .map(l => l.replace(/^[-•*]\s+/, '').trim())
    .filter(l => l.length > 0)
  // Return up to expectedCount results; if none found, return empty
  return bullets.slice(0, expectedCount)
}

// ── JSON helper ───────────────────────────────────────────────────────────────

function safeParseJson<T>(text: string): T | null {
  // Pass 1: strip markdown fences and try direct parse
  try {
    const stripped = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    return JSON.parse(stripped) as T
  } catch { /* fall through */ }

  // Pass 2: extract first {...} block (handles prose + JSON responses)
  try {
    const objMatch = text.match(/\{[\s\S]*\}/)
    if (objMatch) return JSON.parse(objMatch[0]) as T
  } catch { /* fall through */ }

  // Pass 3: extract first [...] block
  try {
    const arrMatch = text.match(/\[[\s\S]*\]/)
    if (arrMatch) return JSON.parse(arrMatch[0]) as T
  } catch { /* fall through */ }

  console.error('[safeParseJson] failed to parse AI response (first 500 chars):', text.slice(0, 500))
  return null
}
