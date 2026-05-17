import { getActiveProvider } from './provider-registry'

export interface BulletProposal {
  bulletId: string
  positionId: string
  positionTitle: string
  company: string
  before: string
  after: string
  reason: string
  dimension: string
  paragraphIndex?: number  // which <p> within the bullet to replace; undefined = replace full content
}

export interface ImproveIteration {
  iteration: number
  localScore: number
  aiScore: number | null
  aiDimensions: Record<string, number> | null
  weakestDimension: string
  proposals: BulletProposal[]
  stopReason?: 'threshold_met' | 'no_improvement' | 'max_iterations' | 'no_proposals'
}

export interface PositionInput {
  id: string
  title: string
  company: string
  hidden: boolean
  bullets: { id: string; content: string; hidden: boolean }[]
}

// Priority order — dimension targeted first when scores are equal
export const DIMENSION_PRIORITY = [
  'impact',
  'clarity',
  'keywordAlignment',
  'senioritySignal',
  'brevity',
  'credibility',
  'roleFit',
]

export function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

// Extract text from each <p> in an HTML block; falls back to treating the whole block as one entry
function extractParagraphTexts(html: string): { text: string; index: number }[] {
  const pMatches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
  if (pMatches.length > 0) {
    return pMatches
      .map((m, i) => ({ text: m[1].replace(/<[^>]+>/g, '').trim(), index: i }))
      .filter(p => p.text.length > 0)
  }
  const text = stripHtml(html)
  return text ? [{ text, index: 0 }] : []
}

function dimensionReason(dimension: string): string {
  const map: Record<string, string> = {
    impact: 'Added quantifiable metrics to demonstrate measurable impact',
    clarity: 'Rewritten with strong action verbs for clarity and impact',
    brevity: 'Tightened wording to improve scannability',
    keywordAlignment: 'Aligned with job description keywords for ATS',
    senioritySignal: 'Strengthened to signal seniority and technical depth',
    credibility: 'Enhanced with specific technical achievements',
    roleFit: 'Tailored to better match the target role',
  }
  return map[dimension] ?? 'Improved bullet content'
}

function dimensionGoal(dimension: string, jobDescription?: string): string {
  const jdNote = jobDescription ? '' : ' (no JD provided — use general software engineering standards)'
  const map: Record<string, string> = {
    impact: 'add specific quantifiable metrics (percentages, times, counts, dollar values) to demonstrate measurable business impact — infer plausible numbers if none are present, and flag them as approximate',
    clarity: 'start with a strong action verb and rewrite for maximum clarity, removing filler words and passive voice',
    brevity: 'tighten to under 20 words, cutting redundant phrases while preserving the key achievement',
    keywordAlignment: `maximize ATS keyword coverage and alignment with the job description${jdNote}`,
    senioritySignal: 'demonstrate senior-level ownership, technical leadership, and strategic impact',
    credibility: 'add specific technical context, project scale, and concrete measurable outcomes',
    roleFit: `closely match the language and requirements of the target role${jdNote}`,
    formatting: 'ensure consistent, professional phrasing and parallel structure',
  }
  return map[dimension] ?? `improve overall quality for the "${dimension}" dimension`
}

interface Candidate {
  bullet: {
    id: string          // real DB bullet id
    content: string     // full HTML of the bullet record
    virtualId: string   // id sent to AI: "${id}" or "${id}::${paragraphIndex}"
    text: string        // plain text of this paragraph
    paragraphIndex: number
    isSingleParagraph: boolean
  }
  position: PositionInput
}

export async function buildProposals(
  positions: PositionInput[],
  resumeText: string,
  dimension: string,
  jobDescription?: string,
): Promise<BulletProposal[]> {
  const visiblePositions = positions.filter(p => !p.hidden)

  let candidates: Candidate[] = []
  for (const pos of visiblePositions) {
    for (const b of pos.bullets.filter(b => !b.hidden)) {
      const paragraphs = extractParagraphTexts(b.content)
      const isSingleParagraph = paragraphs.length === 1
      for (const { text, index } of paragraphs) {
        candidates.push({
          bullet: {
            id: b.id,
            content: b.content,
            virtualId: isSingleParagraph ? b.id : `${b.id}::${index}`,
            text,
            paragraphIndex: index,
            isSingleParagraph,
          },
          position: pos,
        })
      }
    }
  }

  // For impact: prefer paragraphs without any numbers (most room to improve)
  if (dimension === 'impact') {
    const noMetrics = candidates.filter(({ bullet }) => !/\d/.test(bullet.text))
    if (noMetrics.length >= 2) candidates = noMetrics
  }

  const targets = candidates.slice(0, 5)
  if (targets.length === 0) return []

  try {
    const provider = await getActiveProvider()
    if (!provider) return []

    const prompt = `You are improving resume bullets. Rewrite each bullet to ${dimensionGoal(dimension, jobDescription)}.
Rules: keep all content truthful; do not invent facts or fabricate metrics you cannot reasonably infer. Respond with ONLY valid JSON — no markdown, no explanation.

Format: [{"id":"<exact id>","after":"rewritten text","reason":"one sentence"}]
${jobDescription ? `\nJob description (first 1200 chars):\n${jobDescription.slice(0, 1200)}\n` : ''}
Resume context (first 800 chars):
${resumeText.slice(0, 800)}

Bullets to improve:
${targets.map(({ bullet }) => `{"id":"${bullet.virtualId}","text":"${bullet.text.replace(/"/g, "'")}"}`).join('\n')}`

    const raw = await provider.generateText(prompt)
    return parseIdBasedProposals(raw, targets, dimension)
  } catch (err) {
    console.error('[buildProposals] error for dimension', dimension, err)
    return []
  }
}

function parseIdBasedProposals(
  raw: string,
  targets: Candidate[],
  dimension: string,
): BulletProposal[] {
  const stripped = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  let parsed: { id: string; after: string; reason?: string }[] | null = null
  try { parsed = JSON.parse(stripped) } catch { /* fall through */ }
  if (!parsed) {
    const m = raw.match(/\[[\s\S]*\]/)
    if (m) { try { parsed = JSON.parse(m[0]) } catch { /* fall through */ } }
  }
  if (!Array.isArray(parsed)) return []

  return parsed.flatMap(p => {
    if (!p.id || !p.after) return []
    const target = targets.find(t => t.bullet.virtualId === p.id)
    if (!target) return []
    const before = target.bullet.text
    const after = p.after.trim()
    if (!after || after === before) return []
    return [{
      bulletId: target.bullet.id,
      positionId: target.position.id,
      positionTitle: target.position.title,
      company: target.position.company,
      before,
      after,
      reason: p.reason ?? dimensionReason(dimension),
      dimension,
      paragraphIndex: target.bullet.isSingleParagraph ? undefined : target.bullet.paragraphIndex,
    }]
  })
}
