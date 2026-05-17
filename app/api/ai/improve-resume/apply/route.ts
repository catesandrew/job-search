import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { scoreResume } from '@/lib/scoring/resume-scorer'
import { stripHtml } from '@/lib/ai/resume-improver'
import type { BulletProposal } from '@/lib/ai/resume-improver'
import type { Resume, Position, Bullet, SkillCategory, Profile, Education, Project } from '@/hooks/use-resume'
import type { Identity } from '@/hooks/use-identity'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { resumeId, proposals } = await req.json() as {
      resumeId: string
      proposals: BulletProposal[]
    }

    if (!resumeId) return NextResponse.json({ error: 'resumeId required' }, { status: 400 })
    if (!Array.isArray(proposals) || proposals.length === 0) {
      return NextResponse.json({ error: 'proposals array required' }, { status: 400 })
    }

    // Verify ownership
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId, userId: session.user.id },
      select: { id: true },
    })
    if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 })

    // Apply each proposal — surgical paragraph-level replacement when paragraphIndex is set
    let updatedCount = 0
    for (const proposal of proposals) {
      const bullet = await prisma.bullet.findFirst({
        where: { id: proposal.bulletId, position: { resumeId } },
        select: { id: true, content: true },
      })
      if (!bullet) continue

      let newContent: string
      if (proposal.paragraphIndex !== undefined && proposal.paragraphIndex >= 0) {
        // Replace only the specific paragraph, preserving all others
        let i = 0
        newContent = bullet.content.replace(/<p[^>]*>[\s\S]*?<\/p>/gi, (match: string) => {
          if (i++ === proposal.paragraphIndex) return `<p>${proposal.after}</p>`
          return match
        })
      } else {
        // Single-paragraph bullet: replace entire content
        const hasPTags = bullet.content.includes('<p>')
        newContent = hasPTags ? `<p>${proposal.after}</p>` : proposal.after
      }

      await prisma.bullet.update({
        where: { id: proposal.bulletId },
        data: { content: newContent },
      })
      updatedCount++
    }

    // Re-fetch and re-score for the response
    const updated = await prisma.resume.findUnique({
      where: { id: resumeId },
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
    if (!updated) return NextResponse.json({ updatedCount, newLocalScore: 0 })

    type DbPos = typeof updated.positions[number]
    type DbBullet = DbPos['bullets'][number]
    type DbSkill = typeof updated.skills[number]
    type DbEdu = typeof updated.education[number]
    type DbProj = typeof updated.projects[number]

    const resumeForScoring: Resume = {
      id: updated.id,
      userId: updated.userId,
      title: updated.title,
      type: updated.type as Resume['type'],
      templateId: updated.templateId,
      fontFamily: updated.fontFamily,
      fontSize: updated.fontSize,
      lineHeight: updated.lineHeight,
      sectionTitleCasing: updated.sectionTitleCasing,
      dateFormat: updated.dateFormat,
      marginH: updated.marginH,
      marginV: updated.marginV,
      pageSize: updated.pageSize,
      sectionOrder: JSON.parse(updated.sectionOrder) as Resume['sectionOrder'],
      score: updated.score,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      identity: updated.identity
        ? ({ id: updated.identity.id, firstName: updated.identity.firstName, lastName: updated.identity.lastName, email: updated.identity.email, location: updated.identity.location, linkedin: updated.identity.linkedin } as Identity)
        : null,
      profile: updated.profile
        ? ({ id: updated.profile.id, firstName: updated.profile.firstName, lastName: updated.profile.lastName, email: updated.profile.email, phone: updated.profile.phone, location: updated.profile.location, linkedin: updated.profile.linkedin, website: updated.profile.website, targetTitle: updated.profile.targetTitle, summary: updated.profile.summary } as Profile)
        : null,
      positions: updated.positions.map((p: DbPos) => ({
        id: p.id, company: p.company, companyDesc: p.companyDesc, title: p.title,
        location: p.location, startDate: p.startDate, endDate: p.endDate,
        current: p.current, hidden: p.hidden, sortOrder: p.sortOrder,
        sourcePositionId: p.sourcePositionId,
        bullets: p.bullets.map((b: DbBullet) => ({ id: b.id, content: stripHtml(b.content), hidden: b.hidden, sortOrder: b.sortOrder, sourceBulletId: b.sourceBulletId } as Bullet)),
      } as Position)),
      skills: updated.skills.map((s: DbSkill) => ({ id: s.id, name: s.name, skills: s.skills, sortOrder: s.sortOrder } as SkillCategory)),
      education: updated.education.map((e: DbEdu) => ({ id: e.id, institution: e.institution, degree: e.degree, location: e.location, startDate: e.startDate, endDate: e.endDate, current: e.current, achievements: e.achievements } as Education)),
      projects: updated.projects.map((p: DbProj) => ({ id: p.id, name: p.name, link: p.link, startDate: p.startDate, endDate: p.endDate, current: p.current, achievements: p.achievements } as Project)),
    }

    const { score: newLocalScore } = scoreResume(resumeForScoring)

    // Persist new score
    await prisma.resume.update({
      where: { id: resumeId },
      data: { score: newLocalScore },
    })

    return NextResponse.json({ data: { updatedCount, newLocalScore } })
  } catch (error) {
    console.error('POST /api/ai/improve-resume/apply error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
