import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getActiveProvider } from '@/lib/ai/provider-registry'

function resumeToJson(resume: {
  profile: {
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
    location: string | null
    linkedin: string | null
    website: string | null
    targetTitle: string | null
    summary: string | null
  } | null
  positions: Array<{
    title: string
    company: string
    location: string | null
    startDate: string | null
    endDate: string | null
    current: boolean
    hidden: boolean
    bullets: Array<{ content: string; hidden: boolean }>
  }>
  skills: Array<{ name: string; skills: string }>
  education: Array<{
    institution: string
    degree: string | null
    startDate: string | null
    endDate: string | null
  }>
}): string {
  const p = resume.profile
  return JSON.stringify(
    {
      personalInfo: p
        ? {
            name: `${p.firstName} ${p.lastName}`.trim(),
            title: p.targetTitle ?? '',
            email: p.email ?? '',
            phone: p.phone ?? '',
            location: p.location ?? '',
            website: p.website ?? '',
            linkedin: p.linkedin ?? '',
          }
        : {},
      summary: p?.summary ?? '',
      workExperience: resume.positions
        .filter(pos => !pos.hidden)
        .map(pos => ({
          title: pos.title,
          company: pos.company,
          location: pos.location ?? '',
          years: pos.current
            ? `${pos.startDate ?? ''} - Present`
            : `${pos.startDate ?? ''} - ${pos.endDate ?? ''}`,
          description: pos.bullets
            .filter(b => !b.hidden)
            .map(b => b.content.replace(/<[^>]+>/g, ' ').trim()),
        })),
      skills: resume.skills.map(s => `${s.name}: ${s.skills}`),
      education: resume.education.map(e => ({
        institution: e.institution,
        degree: e.degree ?? '',
        years: `${e.startDate ?? ''} - ${e.endDate ?? ''}`,
      })),
    },
    null,
    2
  )
}

const RESUME_INCLUDE = {
  profile: true,
  positions: { include: { bullets: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
  skills: { orderBy: { sortOrder: 'asc' } },
  education: true,
} as const

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { resumeId?: string; applicationId?: string }
    const { resumeId, applicationId } = body

    if (!resumeId && !applicationId) {
      return NextResponse.json(
        { error: 'resumeId or applicationId is required' },
        { status: 400 }
      )
    }

    // Load application if provided
    const application = applicationId
      ? await prisma.application.findUnique({ where: { id: applicationId } })
      : null

    if (applicationId && !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Resolve resume: explicit resumeId > application's linked resume > first BASE
    let resume = null
    const resolvedResumeId = resumeId ?? application?.linkedResumeId

    if (resolvedResumeId) {
      resume = await prisma.resume.findUnique({
        where: { id: resolvedResumeId },
        include: RESUME_INCLUDE,
      })
    }

    if (!resume) {
      resume = await prisma.resume.findFirst({
        where: { userId: session.user.id, type: 'BASE' },
        include: RESUME_INCLUDE,
      })
    }

    if (!resume) {
      return NextResponse.json({ error: 'No resume found' }, { status: 404 })
    }

    const provider = await getActiveProvider()
    if (!provider) {
      return NextResponse.json({ error: 'No AI provider configured' }, { status: 503 })
    }

    const jobDescription = application?.jobDescription ?? ''
    const resumeJson = resumeToJson(resume as Parameters<typeof resumeToJson>[0])
    const generated = await provider.generateCoverLetter({ resumeJson, jobDescription })

    // Derive title
    const title = application
      ? `${application.company} — ${application.role}`
      : 'Cover Letter'

    const coverLetter = await prisma.coverLetter.create({
      data: {
        userId: session.user.id,
        title,
        content: generated.coverLetter,
        outreachMessage: generated.outreachMessage,
        resumeId: resume.id,
        applicationId: application?.id ?? null,
      },
      include: {
        resume: { select: { id: true, title: true } },
        application: { select: { id: true, company: true, role: true } },
      },
    })

    return NextResponse.json({ data: coverLetter })
  } catch (error) {
    console.error('POST /api/ai/cover-letter error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
