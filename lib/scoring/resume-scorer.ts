import type { Resume, Position, Bullet } from '@/hooks/use-resume'

// ── Constants (ported from resume-scorer-mvp) ────────────────────────────────

const ACTION_VERBS = new Set([
  'achieved', 'accelerated', 'analyzed', 'architected', 'automated', 'built', 'coached',
  'collaborated', 'created', 'cut', 'decreased', 'delivered', 'designed', 'developed',
  'directed', 'drove', 'enabled', 'engineered', 'established', 'executed', 'expanded',
  'generated', 'grew', 'implemented', 'improved', 'increased', 'influenced', 'launched',
  'led', 'managed', 'mentored', 'migrated', 'modernized', 'negotiated', 'optimized',
  'orchestrated', 'owned', 'partnered', 'planned', 'produced', 'reduced', 'resolved',
  'revamped', 'saved', 'scaled', 'shipped', 'simplified', 'spearheaded', 'streamlined',
  'supported', 'transformed', 'trained', 'validated', 'won',
])

const WEAK_PHRASES = [
  'responsible for', 'assisted with', 'helped with', 'worked on', 'participated in',
  'team player', 'detail oriented', 'hard worker', 'self starter', 'go getter',
  'excellent communication', 'results driven', 'synergy', 'go above and beyond',
]

// ── Types ────────────────────────────────────────────────────────────────────

export type CheckStatus = 'pass' | 'warn' | 'fail'
export type CheckCategory = 'content_quality' | 'content_length' | 'field_completion'

export interface CheckResult {
  id: string
  label: string
  category: CheckCategory
  status: CheckStatus
  detail?: string
  recommendation?: string
}

export interface ScoreResult {
  score: number
  checks: CheckResult[]
}

// ── Category weights (mirrors MVP) ───────────────────────────────────────────

const CATEGORY_WEIGHTS: Record<CheckCategory, number> = {
  field_completion: 15,
  content_length: 20,
  content_quality: 35,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripHtml(content: string): string {
  return content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function countWords(text: string): number {
  const stripped = stripHtml(text)
  if (!stripped) return 0
  return stripped.split(/\s+/).filter(Boolean).length
}

function hasMetric(text: string): boolean {
  return /\d/.test(text)
}

function firstWord(text: string): string {
  return stripHtml(text).split(/\s+/)[0]?.toLowerCase().replace(/['".,]/g, '') ?? ''
}

function startsWithActionVerb(text: string): boolean {
  return ACTION_VERBS.has(firstWord(text))
}

function containsWeakPhrase(text: string): string | null {
  const lower = stripHtml(text).toLowerCase()
  return WEAK_PHRASES.find(p => lower.includes(p)) ?? null
}

function metricNearStart(text: string): boolean {
  const words = stripHtml(text).split(/\s+/).slice(0, 15).join(' ')
  return hasMetric(words)
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function computeScore(checks: CheckResult[]): number {
  // Weighted by category, points = pass:1 warn:0.5 fail:0
  const byCategory = new Map<CheckCategory, { earned: number; total: number }>()

  for (const check of checks) {
    const cat = check.category
    if (!byCategory.has(cat)) byCategory.set(cat, { earned: 0, total: 0 })
    const entry = byCategory.get(cat)!
    entry.total += 1
    if (check.status === 'pass') entry.earned += 1
    else if (check.status === 'warn') entry.earned += 0.5
  }

  let weighted = 0
  let totalWeight = 0
  for (const [cat, { earned, total }] of byCategory) {
    const w = CATEGORY_WEIGHTS[cat] ?? 10
    weighted += total > 0 ? (earned / total) * w : 0
    totalWeight += w
  }

  return totalWeight > 0 ? Math.round((weighted / totalWeight) * 100) : 0
}

// ── Main scorer ───────────────────────────────────────────────────────────────

export function scoreResume(resume: Resume): ScoreResult {
  const checks: CheckResult[] = []

  const positions: Position[] = resume.positions ?? []
  const visiblePositions = positions.filter(p => !p.hidden)
  const visibleBullets: Bullet[] = visiblePositions.flatMap(p =>
    (p.bullets ?? []).filter(b => !b.hidden)
  )
  const profile = resume.profile
  const identity = resume.identity

  // For contact field checks, prefer profile values but fall back to linked identity
  const effectiveFirstName = profile?.firstName?.trim() || identity?.firstName?.trim() || ''
  const effectiveLastName = profile?.lastName?.trim() || identity?.lastName?.trim() || ''
  const effectiveEmail = profile?.email?.trim() || identity?.email?.trim() || ''
  const effectiveLocation = profile?.location?.trim() || identity?.location?.trim() || ''
  const effectiveLinkedIn = profile?.linkedin?.trim() || identity?.linkedin?.trim() || ''

  // ── Content Quality ─────────────────────────────────────────────────────────

  // 1. Metrics in bullets
  const positionsWithMetric = visiblePositions.filter(p =>
    (p.bullets ?? []).filter(b => !b.hidden).some(b => hasMetric(stripHtml(b.content)))
  )
  const metricRatio = visiblePositions.length > 0
    ? positionsWithMetric.length / visiblePositions.length
    : 0
  checks.push({
    id: 'hasImpactInAchievements',
    label: 'Bullets contain metrics',
    category: 'content_quality',
    status: metricRatio >= 1 ? 'pass' : metricRatio >= 0.5 ? 'warn' : 'fail',
    detail: visiblePositions.length > 0
      ? `${positionsWithMetric.length}/${visiblePositions.length} positions have bullets with numbers`
      : 'No visible positions',
    recommendation: 'Add measurable outcomes: revenue, cost, time saved, throughput, users, SLA, or volume.',
  })

  // 2. Professional summary
  const summaryText = profile?.summary?.trim() ?? ''
  checks.push({
    id: 'hasProfessionalSummary',
    label: 'Professional summary present',
    category: 'content_quality',
    status: summaryText.length > 0 ? 'pass' : 'fail',
    detail: summaryText.length > 0 ? undefined : 'No summary found',
    recommendation: 'Add a 2–3 line summary tailored to your target role.',
  })

  // 3. Bullets start with capital letter
  const bulletsFailing = visibleBullets.filter(b => {
    const text = stripHtml(b.content)
    return text.length > 0 && !/^[A-Z]/.test(text)
  })
  checks.push({
    id: 'achievementsStartWithCapital',
    label: 'Bullets start with capital letter',
    category: 'content_quality',
    status: bulletsFailing.length === 0 ? 'pass' : 'warn',
    detail: bulletsFailing.length > 0
      ? `${bulletsFailing.length} bullet(s) do not start with a capital letter`
      : undefined,
    recommendation: 'Capitalize the first word of each bullet.',
  })

  // 4. Metrics near start of bullet
  const bulletsWithMetric = visibleBullets.filter(b => hasMetric(stripHtml(b.content)))
  const bulletsMetricFarAway = bulletsWithMetric.filter(b => !metricNearStart(b.content))
  checks.push({
    id: 'impactNearStart',
    label: 'Metrics appear near start of bullet',
    category: 'content_quality',
    status: bulletsWithMetric.length === 0 || bulletsMetricFarAway.length === 0 ? 'pass' : 'warn',
    detail: bulletsMetricFarAway.length > 0
      ? `${bulletsMetricFarAway.length} bullet(s) have metrics after word 15`
      : undefined,
    recommendation: "Move the number close to the start, e.g. 'Reduced cloud spend 22% by…' instead of burying the result at the end.",
  })

  // 5. Action verbs
  const bulletsWithoutActionVerb = visibleBullets.filter(b => !startsWithActionVerb(b.content))
  const actionVerbRatio = visibleBullets.length > 0
    ? (visibleBullets.length - bulletsWithoutActionVerb.length) / visibleBullets.length
    : 1
  checks.push({
    id: 'actionVerbs',
    label: 'Bullets start with strong action verbs',
    category: 'content_quality',
    status: actionVerbRatio >= 0.7 ? 'pass' : actionVerbRatio >= 0.45 ? 'warn' : 'fail',
    detail: visibleBullets.length > 0
      ? `${visibleBullets.length - bulletsWithoutActionVerb.length}/${visibleBullets.length} bullets begin with a strong action verb`
      : undefined,
    recommendation: 'Start bullets with verbs like Built, Reduced, Increased, Led, Automated, Designed, or Shipped.',
  })

  // 6. Weak phrases
  const weakHits = visibleBullets.flatMap(b => {
    const hit = containsWeakPhrase(b.content)
    return hit ? [hit] : []
  })
  const uniqueWeak = [...new Set(weakHits)]
  checks.push({
    id: 'weakPhrases',
    label: 'Avoids generic/weak wording',
    category: 'content_quality',
    status: uniqueWeak.length === 0 ? 'pass' : 'warn',
    detail: uniqueWeak.length > 0
      ? `Detected: ${uniqueWeak.slice(0, 4).join(', ')}`
      : 'No common weak phrases detected',
    recommendation: "Replace phrases like 'responsible for' or 'assisted with' with outcomes and scope.",
  })

  // ── Content Length ──────────────────────────────────────────────────────────

  // 7. Bullets per position (2–5)
  const positionsOutOfRange = visiblePositions.filter(p => {
    const count = (p.bullets ?? []).filter(b => !b.hidden).length
    return count < 2 || count > 5
  })
  checks.push({
    id: 'achievementsPerPosition',
    label: 'Bullets per position (2–5)',
    category: 'content_length',
    status: positionsOutOfRange.length === 0 ? 'pass' : 'fail',
    detail: positionsOutOfRange.length > 0
      ? `${positionsOutOfRange.length} position(s) have fewer than 2 or more than 5 bullets`
      : undefined,
    recommendation: 'Keep 2–5 high-impact bullets per role so recruiters can scan quickly.',
  })

  // 8. Total bullet count (3–20)
  const totalVisible = visibleBullets.length
  checks.push({
    id: 'totalAchievements',
    label: 'Total bullets (3–20)',
    category: 'content_length',
    status: totalVisible >= 3 && totalVisible <= 20 ? 'pass' : 'fail',
    detail: `${totalVisible} visible bullets`,
    recommendation: 'Aim for 3–20 total bullets, prioritizing recent and relevant accomplishments.',
  })

  // 9. Total word count (200–800)
  const totalWords = visibleBullets.reduce((sum, b) => sum + countWords(b.content), 0)
  checks.push({
    id: 'totalWords',
    label: 'Total word count (200–800)',
    category: 'content_length',
    status: totalWords >= 200 && totalWords <= 800 ? 'pass' : 'fail',
    detail: `${totalWords} words`,
    recommendation: 'Trim older/less-relevant details if too long; add quantified bullets and projects if too short.',
  })

  // 10. Bullet length (8–50 words each)
  const bulletsWrongLength = visibleBullets.filter(b => {
    const wc = countWords(b.content)
    return wc < 8 || wc > 50
  })
  checks.push({
    id: 'achievementLength',
    label: 'Bullet length (8–50 words each)',
    category: 'content_length',
    status: bulletsWrongLength.length === 0 ? 'pass' : 'warn',
    detail: bulletsWrongLength.length > 0
      ? `${bulletsWrongLength.length} bullet(s) outside 8–50 word range`
      : undefined,
    recommendation: 'Rewrite bullets as concise impact statements: action + scope + metric/result.',
  })

  // ── Field Completion ────────────────────────────────────────────────────────

  checks.push({
    id: 'hasFirstName',
    label: 'First name present',
    category: 'field_completion',
    status: effectiveFirstName.length > 0 ? 'pass' : 'fail',
    recommendation: 'Add your first name to the profile.',
  })
  checks.push({
    id: 'hasLastName',
    label: 'Last name present',
    category: 'field_completion',
    status: effectiveLastName.length > 0 ? 'pass' : 'fail',
    recommendation: 'Add your last name to the profile.',
  })
  checks.push({
    id: 'hasEmail',
    label: 'Email present',
    category: 'field_completion',
    status: effectiveEmail.length > 0 ? 'pass' : 'fail',
    recommendation: 'Add an email address to the profile.',
  })
  checks.push({
    id: 'hasLocation',
    label: 'Location present',
    category: 'field_completion',
    status: effectiveLocation.length > 0 ? 'pass' : 'fail',
    recommendation: 'Add a city/state or "Remote" to the profile.',
  })
  checks.push({
    id: 'hasLinkedIn',
    label: 'LinkedIn URL present',
    category: 'field_completion',
    status: effectiveLinkedIn.length > 0 ? 'pass' : 'fail',
    recommendation: 'Add your LinkedIn profile URL.',
  })
  checks.push({
    id: 'hasWorkExperience',
    label: 'At least one position',
    category: 'field_completion',
    status: visiblePositions.length > 0 ? 'pass' : 'fail',
    detail: `${visiblePositions.length} visible position(s)`,
    recommendation: 'Add at least one work experience entry.',
  })
  const positionsMissingCompany = visiblePositions.filter(p => !p.company?.trim())
  checks.push({
    id: 'hasCompanyName',
    label: 'All positions have company name',
    category: 'field_completion',
    status: positionsMissingCompany.length === 0 ? 'pass' : 'fail',
    detail: positionsMissingCompany.length > 0
      ? `${positionsMissingCompany.length} position(s) missing company name`
      : undefined,
    recommendation: 'Fill in the company name for all positions.',
  })
  const skillCategories = resume.skills ?? []
  const hasAnySkill = skillCategories.some(sc => sc.skills.trim().length > 0)
  checks.push({
    id: 'hasSkill',
    label: 'At least one skill listed',
    category: 'field_completion',
    status: hasAnySkill ? 'pass' : 'fail',
    recommendation: 'Add a skills section with relevant technologies and competencies.',
  })

  const score = computeScore(checks)
  return { score, checks }
}
