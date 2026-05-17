import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getActiveProvider } from '@/lib/ai/provider-registry'

const RESUME_INCLUDE = {
  profile: true,
  positions: { include: { bullets: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
  skills: { orderBy: { sortOrder: 'asc' } },
  education: true,
} as const

function resumeToJson(resume: {
  profile: {
    firstName: string; lastName: string; email: string | null; phone: string | null
    location: string | null; linkedin: string | null; website: string | null
    targetTitle: string | null; summary: string | null
  } | null
  positions: Array<{
    title: string; company: string; location: string | null; startDate: string | null
    endDate: string | null; current: boolean; hidden: boolean
    bullets: Array<{ content: string; hidden: boolean }>
  }>
  skills: Array<{ name: string; skills: string }>
  education: Array<{ institution: string; degree: string | null; startDate: string | null; endDate: string | null }>
}): string {
  const p = resume.profile
  return JSON.stringify({
    personalInfo: p ? {
      name: `${p.firstName} ${p.lastName}`.trim(),
      title: p.targetTitle ?? '',
      email: p.email ?? '',
      phone: p.phone ?? '',
      location: p.location ?? '',
      website: p.website ?? '',
      linkedin: p.linkedin ?? '',
    } : {},
    summary: p?.summary ?? '',
    workExperience: resume.positions.filter(pos => !pos.hidden).map(pos => ({
      title: pos.title, company: pos.company, location: pos.location ?? '',
      years: pos.current ? `${pos.startDate ?? ''} - Present` : `${pos.startDate ?? ''} - ${pos.endDate ?? ''}`,
      description: pos.bullets.filter(b => !b.hidden).map(b => b.content.replace(/<[^>]+>/g, ' ').trim()),
    })),
    skills: resume.skills.map(s => `${s.name}: ${s.skills}`),
    education: resume.education.map(e => ({ institution: e.institution, degree: e.degree ?? '', years: `${e.startDate ?? ''} - ${e.endDate ?? ''}` })),
  }, null, 2)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const existing = await prisma.coverLetter.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json() as {
      resumeId?: string
      length?: string
      tone?: string
      customPrompt?: string
    }

    const resolvedResumeId = body.resumeId ?? existing.resumeId
    let resume = resolvedResumeId
      ? await prisma.resume.findUnique({ where: { id: resolvedResumeId }, include: RESUME_INCLUDE })
      : null

    if (!resume) {
      resume = await prisma.resume.findFirst({
        where: { userId: session.user.id, type: 'BASE' },
        include: RESUME_INCLUDE,
      })
    }
    if (!resume) return NextResponse.json({ error: 'No resume found' }, { status: 404 })

    const application = existing.applicationId
      ? await prisma.application.findUnique({ where: { id: existing.applicationId } })
      : null

    const provider = await getActiveProvider()
    if (!provider) return NextResponse.json({ error: 'No AI provider configured' }, { status: 503 })

    const length = (body.length ?? existing.length) as 'short' | 'medium' | 'long'
    const tone = (body.tone ?? existing.tone) as 'formal' | 'professional' | 'casual'
    const customPrompt = body.customPrompt !== undefined ? body.customPrompt : (existing.customPrompt ?? undefined)

    const generated = await provider.generateCoverLetter({
      resumeJson: resumeToJson(resume as Parameters<typeof resumeToJson>[0]),
      jobDescription: application?.jobDescription ?? '',
      length,
      tone,
      customPrompt,
    })

    const updated = await prisma.coverLetter.update({
      where: { id },
      data: {
        content: generated.coverLetter,
        outreachMessage: generated.outreachMessage,
        length,
        tone,
        customPrompt: customPrompt ?? null,
        resumeId: resume.id,
      },
      include: {
        resume: {
          select: {
            id: true,
            title: true,
            profile: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        application: { select: { id: true, company: true, role: true, location: true } },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('POST /api/cover-letters/[id]/regenerate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
