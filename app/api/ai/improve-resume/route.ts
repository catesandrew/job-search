import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { scoreResume } from '@/lib/scoring/resume-scorer'
import type { CheckResult } from '@/lib/scoring/resume-scorer'
import { simulateRecruiterScreen } from '@/lib/ai/mcp-tools'
import { buildProposals, DIMENSION_PRIORITY, stripHtml } from '@/lib/ai/resume-improver'
import type { PositionInput, ImproveIteration } from '@/lib/ai/resume-improver'
import type { Resume, Position, Bullet, SkillCategory, Profile, Education, Project } from '@/hooks/use-resume'
import type { Identity } from '@/hooks/use-identity'

function resumeToText(
  positions: PositionInput[],
  profile: { firstName: string; lastName: string; targetTitle?: string | null; summary?: string | null } | null,
): string {
  const parts: string[] = []
  if (profile) {
    parts.push(`${profile.firstName} ${profile.lastName}`)
    if (profile.targetTitle) parts.push(profile.targetTitle)
    if (profile.summary) parts.push(stripHtml(profile.summary))
  }
  for (const pos of positions.filter(p => !p.hidden)) {
    parts.push(`${pos.title} at ${pos.company}`)
    for (const b of pos.bullets.filter(b => !b.hidden)) {
      parts.push('• ' + stripHtml(b.content))
    }
  }
  return parts.join('\n')
}

function getWeakestLocalDimension(checks: CheckResult[]): string {
  const failCount: Record<string, number> = {}
  for (const check of checks) {
    if (check.status !== 'pass') {
      if (check.id === 'hasImpactInAchievements') {
        failCount['impact'] = (failCount['impact'] ?? 0) + (check.status === 'fail' ? 2 : 1)
      } else if (check.id === 'actionVerbsRatio' || check.id === 'weakPhrases') {
        failCount['clarity'] = (failCount['clarity'] ?? 0) + 1
      } else if (check.id === 'bulletLength') {
        failCount['brevity'] = (failCount['brevity'] ?? 0) + 1
      } else if (check.id === 'hasProfessionalSummary') {
        failCount['clarity'] = (failCount['clarity'] ?? 0) + 1
      }
    }
  }
  const sorted = Object.entries(failCount).sort(([, a], [, b]) => b - a)
  return sorted[0]?.[0] ?? 'impact'
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      resumeId: string
      applicationId?: string
      targetScore?: number
      iteration?: number
      runAiScreen?: boolean
    }
    const { resumeId, applicationId, targetScore = 75, iteration = 1, runAiScreen = true } = body

    if (!resumeId) return NextResponse.json({ error: 'resumeId required' }, { status: 400 })

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId, userId: session.user.id },
      include: {
        identity: true,
        profile: true,
        positions: {
          include: { bullets: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
        skills: { orderBy: { sortOrder: 'asc' } },
        education: true,
        projects: true,
      },
    })
    if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 })

    let jobDescription: string | undefined
    if (applicationId) {
      const app = await prisma.application.findUnique({ where: { id: applicationId } })
      if (app?.jobDescription) jobDescription = app.jobDescription
    }

    const positions: PositionInput[] = resume.positions.map(p => ({
      id: p.id,
      title: p.title,
      company: p.company,
      hidden: p.hidden,
      bullets: p.bullets.map(b => ({ id: b.id, content: b.content, hidden: b.hidden })),
    }))

    const resumeText = resumeToText(positions, resume.profile)
    if (!resumeText.trim()) {
      return NextResponse.json({ error: 'Resume has no visible content' }, { status: 400 })
    }

    // Map to Resume type for local scorer (same pattern as /api/ai/score)
    type DbPos = typeof resume.positions[number]
    type DbBullet = DbPos['bullets'][number]
    type DbSkill = typeof resume.skills[number]
    type DbEdu = typeof resume.education[number]
    type DbProj = typeof resume.projects[number]

    const resumeForScoring: Resume = {
      id: resume.id,
      userId: resume.userId,
      title: resume.title,
      type: resume.type as Resume['type'],
      templateId: resume.templateId,
      fontFamily: resume.fontFamily,
      fontSize: resume.fontSize,
      lineHeight: resume.lineHeight,
      sectionTitleCasing: resume.sectionTitleCasing,
      dateFormat: resume.dateFormat,
      marginH: resume.marginH,
      marginV: resume.marginV,
      pageSize: resume.pageSize,
      sectionOrder: JSON.parse(resume.sectionOrder) as Resume['sectionOrder'],
      score: resume.score,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
      identity: resume.identity
        ? ({ id: resume.identity.id, firstName: resume.identity.firstName, lastName: resume.identity.lastName, email: resume.identity.email, location: resume.identity.location, linkedin: resume.identity.linkedin } as Identity)
        : null,
      profile: resume.profile
        ? ({ id: resume.profile.id, firstName: resume.profile.firstName, lastName: resume.profile.lastName, email: resume.profile.email, phone: resume.profile.phone, location: resume.profile.location, linkedin: resume.profile.linkedin, website: resume.profile.website, targetTitle: resume.profile.targetTitle, summary: resume.profile.summary } as Profile)
        : null,
      positions: resume.positions.map((p: DbPos) => ({
        id: p.id, company: p.company, companyDesc: p.companyDesc, title: p.title,
        location: p.location, startDate: p.startDate, endDate: p.endDate,
        current: p.current, hidden: p.hidden, sortOrder: p.sortOrder,
        sourcePositionId: p.sourcePositionId,
        bullets: p.bullets.map((b: DbBullet) => ({ id: b.id, content: b.content, hidden: b.hidden, sortOrder: b.sortOrder, sourceBulletId: b.sourceBulletId } as Bullet)),
      } as Position)),
      skills: resume.skills.map((s: DbSkill) => ({ id: s.id, name: s.name, skills: s.skills, sortOrder: s.sortOrder } as SkillCategory)),
      education: resume.education.map((e: DbEdu) => ({ id: e.id, institution: e.institution, degree: e.degree, location: e.location, startDate: e.startDate, endDate: e.endDate, current: e.current, achievements: e.achievements } as Education)),
      projects: resume.projects.map((p: DbProj) => ({ id: p.id, name: p.name, link: p.link, startDate: p.startDate, endDate: p.endDate, current: p.current, achievements: p.achievements } as Project)),
    }

    const scoreResult = scoreResume(resumeForScoring)
    const localScore = scoreResult.score

    if (localScore >= targetScore) {
      const result: ImproveIteration = {
        iteration, localScore, aiScore: null, aiDimensions: null,
        weakestDimension: 'none', proposals: [], stopReason: 'threshold_met',
      }
      return NextResponse.json({ data: result })
    }

    let aiScore: number | null = null
    let aiDimensions: Record<string, number> | null = null
    let weakestDimension = getWeakestLocalDimension(scoreResult.checks)

    // Run AI screen on odd iterations (1, 3, 5…) to avoid calling it every time
    if (runAiScreen && iteration % 2 === 1) {
      try {
        const screen = await simulateRecruiterScreen(resumeText, jobDescription)
        aiScore = screen.overall
        aiDimensions = screen.dimensions as Record<string, number>
        const sorted = DIMENSION_PRIORITY
          .filter(d => d in screen.dimensions)
          .sort((a, b) => (aiDimensions![a] ?? 100) - (aiDimensions![b] ?? 100))
        if (sorted.length > 0) weakestDimension = sorted[0]
      } catch (err) {
        console.warn('[improve-resume] AI screen failed, using local dimension:', err)
      }
    }

    // Build proposals for weakest dimension; fall back through priority list if empty
    let proposals = await buildProposals(positions, resumeText, weakestDimension, jobDescription)
    if (proposals.length === 0) {
      for (const fallback of DIMENSION_PRIORITY.filter(d => d !== weakestDimension)) {
        proposals = await buildProposals(positions, resumeText, fallback, jobDescription)
        if (proposals.length > 0) { weakestDimension = fallback; break }
      }
    }

    const result: ImproveIteration = {
      iteration, localScore, aiScore, aiDimensions, weakestDimension, proposals,
      stopReason: proposals.length === 0 ? 'no_proposals' : undefined,
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('POST /api/ai/improve-resume error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
