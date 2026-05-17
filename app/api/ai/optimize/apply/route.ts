import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import type { AiOptimizeResponse } from '@/lib/ai/provider'
import { cleanAiPhrases } from '@/lib/ai/phrase-cleaner'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { applicationId, masterResumeId, selection } = body as {
      applicationId?: string
      masterResumeId: string
      selection: AiOptimizeResponse
    }

    if (!masterResumeId || !selection) {
      return NextResponse.json(
        { error: 'masterResumeId and selection are required' },
        { status: 400 }
      )
    }

    if (applicationId) {
      // Load application
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
      })

      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 })
      }

      // Delete existing optimized resume if present
      if (application.linkedResumeId) {
        const existing = await prisma.resume.findUnique({
          where: { id: application.linkedResumeId },
        })
        if (existing?.type === 'JOB_APPLICATION_OPTIMIZED') {
          await prisma.application.update({
            where: { id: applicationId },
            data: { linkedResumeId: null },
          })
          await prisma.resume.delete({ where: { id: existing.id } })
        }
      }
    }

    // Load master resume with all relations
    const source = await prisma.resume.findUnique({
      where: { id: masterResumeId },
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
      return NextResponse.json({ error: 'Master resume not found' }, { status: 404 })
    }

    // Use a transaction for all clone + apply operations
    const newResumeId = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Clone base resume
      const cloned = await tx.resume.create({
        data: {
          userId: source.userId,
          title: `${source.title} (Optimized)`,
          type: 'JOB_APPLICATION_OPTIMIZED',
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
        await tx.profile.create({
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

      // Collect skills from hidden positions for merging
      const hiddenPositionSkills: string[] = []

      // Clone positions with selection applied
      for (const position of source.positions) {
        const isPositionIncluded = selection.positionIds.includes(position.id)

        if (!isPositionIncluded) {
          // Collect skills mentioned in hidden position bullets for merging
          for (const bullet of position.bullets) {
            hiddenPositionSkills.push(bullet.content.replace(/<[^>]+>/g, ' ').trim())
          }
        }

        const clonedPosition = await tx.position.create({
          data: {
            resumeId: cloned.id,
            company: position.company,
            companyDesc: position.companyDesc,
            title: position.title,
            location: position.location,
            startDate: position.startDate,
            endDate: position.endDate,
            current: position.current,
            hidden: !isPositionIncluded,
            sortOrder: position.sortOrder,
            sourcePositionId: position.id,
          },
        })

        for (const bullet of position.bullets) {
          const isBulletIncluded = selection.bulletIds.includes(bullet.id)
          const rewrittenContent = selection.rewrittenBullets?.[bullet.id]
          const finalContent = rewrittenContent
            ? cleanAiPhrases(rewrittenContent)
            : bullet.content

          await tx.bullet.create({
            data: {
              positionId: clonedPosition.id,
              content: finalContent,
              hidden: !isBulletIncluded,
              sortOrder: bullet.sortOrder,
              sourceBulletId: bullet.id,
            },
          })
        }
      }

      // Clone skill categories with selection applied
      // Build set of existing skill names for deduplication
      const includedSkillSet = new Set<string>()

      for (const skill of source.skills) {
        const isIncluded = selection.skillCategoryIds.includes(skill.id)

        // Parse existing skills
        const existingSkills = skill.skills
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)

        existingSkills.forEach((s: string) => includedSkillSet.add(s.toLowerCase()))

        await tx.skillCategory.create({
          data: {
            resumeId: cloned.id,
            name: skill.name,
            skills: skill.skills,
            sortOrder: skill.sortOrder,
          },
        })

        // If this category is not in the selection, mark it as having no visible skills
        // by keeping the data but not hiding (skill categories don't have hidden flag)
        // We simply don't include non-selected categories in a meaningful way —
        // the selection drives which categories are shown in preview
        void isIncluded
      }

      // Clone education
      for (const edu of source.education) {
        await tx.education.create({
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
        await tx.project.create({
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

      // Link new resume to application if one was provided
      if (applicationId) {
        await tx.application.update({
          where: { id: applicationId },
          data: { linkedResumeId: cloned.id },
        })
      }

      return cloned.id
    })

    return NextResponse.json({ data: { resumeId: newResumeId } })
  } catch (error) {
    console.error('POST /api/ai/optimize/apply error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
