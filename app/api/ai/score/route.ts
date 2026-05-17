import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { scoreResume } from '@/lib/scoring/resume-scorer'
import type { Resume, Position, Bullet, SkillCategory, Profile, Education, Project } from '@/hooks/use-resume'
import type { Identity } from '@/hooks/use-identity'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { resumeId } = body as { resumeId: string }

    if (!resumeId) {
      return NextResponse.json({ error: 'resumeId is required' }, { status: 400 })
    }

    const resume = await prisma.resume.findUnique({
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

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    type DbPos = NonNullable<typeof resume>['positions'][number]
    type DbBullet = DbPos['bullets'][number]
    type DbSkill = NonNullable<typeof resume>['skills'][number]
    type DbEdu = NonNullable<typeof resume>['education'][number]
    type DbProj = NonNullable<typeof resume>['projects'][number]

    // Map Prisma result to the Resume interface used by the scorer
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
        ? ({
            id: resume.identity.id,
            firstName: resume.identity.firstName,
            lastName: resume.identity.lastName,
            email: resume.identity.email,
            location: resume.identity.location,
            linkedin: resume.identity.linkedin,
          } as Identity)
        : null,
      profile: resume.profile
        ? ({
            id: resume.profile.id,
            firstName: resume.profile.firstName,
            lastName: resume.profile.lastName,
            email: resume.profile.email,
            phone: resume.profile.phone,
            location: resume.profile.location,
            linkedin: resume.profile.linkedin,
            website: resume.profile.website,
            targetTitle: resume.profile.targetTitle,
            summary: resume.profile.summary,
          } as Profile)
        : null,
      positions: resume.positions.map(
        (p: DbPos) =>
          ({
            id: p.id,
            company: p.company,
            companyDesc: p.companyDesc,
            title: p.title,
            location: p.location,
            startDate: p.startDate,
            endDate: p.endDate,
            current: p.current,
            hidden: p.hidden,
            sortOrder: p.sortOrder,
            sourcePositionId: p.sourcePositionId,
            bullets: p.bullets.map(
              (b: DbBullet) =>
                ({
                  id: b.id,
                  content: b.content,
                  hidden: b.hidden,
                  sortOrder: b.sortOrder,
                  sourceBulletId: b.sourceBulletId,
                } as Bullet)
            ),
          } as Position)
      ),
      skills: resume.skills.map(
        (s: DbSkill) =>
          ({
            id: s.id,
            name: s.name,
            skills: s.skills,
            sortOrder: s.sortOrder,
          } as SkillCategory)
      ),
      education: resume.education.map(
        (e: DbEdu) =>
          ({
            id: e.id,
            institution: e.institution,
            degree: e.degree,
            location: e.location,
            startDate: e.startDate,
            endDate: e.endDate,
            current: e.current,
            achievements: e.achievements,
          } as Education)
      ),
      projects: resume.projects.map(
        (p: DbProj) =>
          ({
            id: p.id,
            name: p.name,
            link: p.link,
            startDate: p.startDate,
            endDate: p.endDate,
            current: p.current,
            achievements: p.achievements,
          } as Project)
      ),
    }

    const result = scoreResume(resumeForScoring)

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('POST /api/ai/score error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
