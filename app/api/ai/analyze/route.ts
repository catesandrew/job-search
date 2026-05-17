import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getActiveProvider } from '@/lib/ai/provider-registry'
import { analyzeJobDescriptionFull } from '@/lib/ai/mcp-tools'

// ── Keyword matching helpers ──────────────────────────────────────────────────

function compact(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`´]/g, '')
    .replace(/[^a-z0-9+#./%$€£\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function phraseInText(phrase: string, text: string): boolean {
  const p = compact(phrase)
  if (!p) return false
  // Normalize common variants
  const normalized = p
    .replace(/front end/g, 'frontend')
    .replace(/back end/g, 'backend')
    .replace(/node js/g, 'node.js')
    .replace(/next js/g, 'next.js')
    .replace(/ci cd/g, 'ci/cd')
  const pattern = new RegExp(
    `(?<![a-z0-9+#.])${escapeRegex(normalized)}(?![a-z0-9+#.])`,
    'i'
  )
  return pattern.test(text)
}

function acronymFor(phrase: string): string | null {
  const words = phrase.split(/[^A-Za-z0-9]+/).filter(Boolean)
  if (words.length < 2) return null
  const acr = words.map(w => w[0]).join('').toLowerCase()
  return acr.length >= 2 && acr.length <= 6 ? acr : null
}

function matchesKeyword(keyword: string, resumeText: string): boolean {
  if (phraseInText(keyword, resumeText)) return true
  const acr = acronymFor(keyword)
  return acr ? phraseInText(acr, resumeText) : false
}

// ── Resume → plain text ───────────────────────────────────────────────────────

function resumeToText(resume: {
  profile: { firstName: string; lastName: string; targetTitle: string | null; summary: string | null } | null
  positions: Array<{ title: string; company: string; hidden: boolean; bullets: Array<{ content: string; hidden: boolean }> }>
  skills: Array<{ name: string; skills: string }>
}): string {
  const parts: string[] = []

  if (resume.profile) {
    const p = resume.profile
    parts.push(`${p.firstName} ${p.lastName}`)
    if (p.targetTitle) parts.push(p.targetTitle)
    if (p.summary) parts.push(p.summary)
  }

  for (const pos of resume.positions.filter(p => !p.hidden)) {
    parts.push(`${pos.title} at ${pos.company}`)
    for (const bullet of pos.bullets.filter(b => !b.hidden)) {
      parts.push(bullet.content.replace(/<[^>]+>/g, ' '))
    }
  }

  for (const skill of resume.skills) {
    parts.push(`${skill.name}: ${skill.skills}`)
  }

  return parts.join(' ')
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { resumeId, applicationId } = await request.json() as {
      resumeId: string
      applicationId: string
    }

    if (!resumeId || !applicationId) {
      return NextResponse.json({ error: 'resumeId and applicationId are required' }, { status: 400 })
    }

    const [application, resume] = await Promise.all([
      prisma.application.findUnique({ where: { id: applicationId } }),
      prisma.resume.findUnique({
        where: { id: resumeId },
        include: {
          profile: true,
          positions: {
            include: { bullets: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { sortOrder: 'asc' },
          },
          skills: { orderBy: { sortOrder: 'asc' } },
        },
      }),
    ])

    if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    if (!application.jobDescription) {
      return NextResponse.json({ error: 'Application has no job description' }, { status: 400 })
    }

    const provider = await getActiveProvider()
    if (!provider) {
      return NextResponse.json({ error: 'No AI provider configured' }, { status: 503 })
    }

    // Extract keywords from JD via AI
    const extracted = await provider.analyzeJd({
      resumeText: '',
      jobDescription: application.jobDescription,
    })

    // Match keywords against resume text
    const resumeText = compact(resumeToText(resume as Parameters<typeof resumeToText>[0]))

    const matchedRequired: string[] = []
    const missingRequired: string[] = []
    const matchedPreferred: string[] = []
    const missingPreferred: string[] = []
    const matchedKeywords: string[] = []
    const missingKeywords: string[] = []

    for (const kw of extracted.requiredSkills) {
      if (matchesKeyword(kw, resumeText)) matchedRequired.push(kw)
      else missingRequired.push(kw)
    }
    for (const kw of extracted.preferredSkills) {
      if (matchesKeyword(kw, resumeText)) matchedPreferred.push(kw)
      else missingPreferred.push(kw)
    }
    for (const kw of extracted.keywords) {
      if (matchesKeyword(kw, resumeText)) matchedKeywords.push(kw)
      else missingKeywords.push(kw)
    }

    // Weighted match score: required=3, preferred=1.5, keywords=0.5
    const totalWeight =
      extracted.requiredSkills.length * 3 +
      extracted.preferredSkills.length * 1.5 +
      extracted.keywords.length * 0.5

    const matchedWeight =
      matchedRequired.length * 3 +
      matchedPreferred.length * 1.5 +
      matchedKeywords.length * 0.5

    const matchScore = totalWeight > 0
      ? Math.round((matchedWeight / totalWeight) * 100)
      : 0

    // Parallel red flag analysis — non-blocking, fails gracefully
    const [redFlagsResult] = await Promise.allSettled([
      analyzeJobDescriptionFull(application.jobDescription!),
    ])
    const redFlags = redFlagsResult.status === 'fulfilled'
      ? (redFlagsResult.value.redFlags ?? [])
      : []

    return NextResponse.json({
      data: {
        matchScore,
        matchedRequired,
        missingRequired,
        matchedPreferred,
        missingPreferred,
        matchedKeywords,
        missingKeywords,
        experienceRequirements: extracted.experienceRequirements,
        redFlags,
      },
    })
  } catch (error) {
    console.error('POST /api/ai/analyze error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
