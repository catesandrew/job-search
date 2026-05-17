import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Fetch source resume with all nested data
    const source = await prisma.resume.findUnique({
      where: { id },
      include: {
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

    if (!source) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    // Create cloned resume
    const cloned = await prisma.resume.create({
      data: {
        userId: source.userId,
        identityId: source.identityId,
        title: `${source.title} (Copy)`,
        type: source.type,
        templateId: source.templateId,
        fontFamily: source.fontFamily,
        fontSize: source.fontSize,
        lineHeight: source.lineHeight,
        sectionTitleCasing: source.sectionTitleCasing,
        dateFormat: source.dateFormat,
        marginH: source.marginH,
        marginV: source.marginV,
        pageSize: source.pageSize,
        sectionOrder: source.sectionOrder,
      },
    })

    // Clone profile
    if (source.profile) {
      await prisma.profile.create({
        data: {
          resumeId: cloned.id,
          firstName: source.profile.firstName,
          lastName: source.profile.lastName,
          email: source.profile.email,
          phone: source.profile.phone,
          location: source.profile.location,
          linkedin: source.profile.linkedin,
          website: source.profile.website,
          targetTitle: source.profile.targetTitle,
          summary: source.profile.summary,
        },
      })
    }

    // Clone positions with bullets
    for (const position of source.positions) {
      const clonedPosition = await prisma.position.create({
        data: {
          resumeId: cloned.id,
          company: position.company,
          companyDesc: position.companyDesc,
          title: position.title,
          location: position.location,
          startDate: position.startDate,
          endDate: position.endDate,
          current: position.current,
          hidden: position.hidden,
          sortOrder: position.sortOrder,
          sourcePositionId: position.id,
        },
      })

      for (const bullet of position.bullets) {
        await prisma.bullet.create({
          data: {
            positionId: clonedPosition.id,
            content: bullet.content,
            hidden: bullet.hidden,
            sortOrder: bullet.sortOrder,
            sourceBulletId: bullet.id,
          },
        })
      }
    }

    // Clone skill categories
    for (const skill of source.skills) {
      await prisma.skillCategory.create({
        data: {
          resumeId: cloned.id,
          name: skill.name,
          skills: skill.skills,
          sortOrder: skill.sortOrder,
        },
      })
    }

    // Clone education
    for (const edu of source.education) {
      await prisma.education.create({
        data: {
          resumeId: cloned.id,
          institution: edu.institution,
          degree: edu.degree,
          location: edu.location,
          startDate: edu.startDate,
          endDate: edu.endDate,
          current: edu.current,
          achievements: edu.achievements,
        },
      })
    }

    // Clone projects
    for (const project of source.projects) {
      await prisma.project.create({
        data: {
          resumeId: cloned.id,
          name: project.name,
          link: project.link,
          startDate: project.startDate,
          endDate: project.endDate,
          current: project.current,
          achievements: project.achievements,
        },
      })
    }

    // Return cloned resume with all nested data
    const result = await prisma.resume.findUnique({
      where: { id: cloned.id },
      include: {
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

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    console.error('POST /api/resumes/[id]/clone error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
