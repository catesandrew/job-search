import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { generateInterviewPrep } from '@/lib/ai/mcp-tools'

function resumeToText(resume: {
  profile: { firstName: string; lastName: string; summary: string | null } | null
  positions: Array<{ title: string; company: string; hidden: boolean; bullets: Array<{ content: string; hidden: boolean }> }>
  skills: Array<{ name: string; skills: string }>
}): string {
  const parts: string[] = []
  if (resume.profile?.summary) parts.push(resume.profile.summary)
  for (const pos of resume.positions.filter(p => !p.hidden)) {
    parts.push(`${pos.title} at ${pos.company}`)
    for (const b of pos.bullets.filter(b => !b.hidden)) {
      parts.push('• ' + b.content.replace(/<[^>]+>/g, ' '))
    }
  }
  for (const s of resume.skills) parts.push(`${s.name}: ${s.skills}`)
  return parts.join('\n')
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const prep = await prisma.interviewPrep.findUnique({ where: { applicationId: id } })
  if (!prep) return NextResponse.json({ data: null })

  return NextResponse.json({
    data: {
      applicationId: prep.applicationId,
      questions: JSON.parse(prep.questions),
      generatedAt: prep.generatedAt,
    },
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const application = await prisma.application.findUnique({
    where: { id, userId: session.user.id },
  })
  if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (!application.jobDescription) {
    return NextResponse.json({ error: 'Application has no job description' }, { status: 400 })
  }

  try {
    // Use linked resume if available
    let resumeText = ''
    if (application.linkedResumeId) {
      const resume = await prisma.resume.findUnique({
        where: { id: application.linkedResumeId },
        include: {
          profile: true,
          positions: { include: { bullets: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
          skills: { orderBy: { sortOrder: 'asc' } },
        },
      })
      if (resume) resumeText = resumeToText(resume as Parameters<typeof resumeToText>[0])
    }

    // Pull full experience library for richer STAR answers
    const libraryExperiences = await prisma.libraryExperience.findMany({
      where: { userId: session.user.id },
      include: { bullets: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    })
    const libraryText = libraryExperiences.map((exp: typeof libraryExperiences[number]) => {
      const header = `${exp.title} at ${exp.company}`
      const bullets = exp.bullets.map((b: typeof exp.bullets[number]) => '• ' + b.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).join('\n')
      return bullets ? `${header}\n${bullets}` : header
    }).join('\n\n')

    let predefinedQuestions: string[] = []
    try {
      const parsed = JSON.parse(application.interviewQuestions ?? '[]')
      if (Array.isArray(parsed)) predefinedQuestions = parsed.filter((q: unknown) => typeof q === 'string')
    } catch { /* ignore */ }

    const questions = await generateInterviewPrep(
      resumeText,
      application.jobDescription,
      application.company,
      application.role,
      libraryText || undefined,
      predefinedQuestions.length > 0 ? predefinedQuestions : undefined,
    )

    const prep = await prisma.interviewPrep.upsert({
      where: { applicationId: id },
      create: { applicationId: id, questions: JSON.stringify(questions) },
      update: { questions: JSON.stringify(questions), generatedAt: new Date() },
    })

    return NextResponse.json({
      data: {
        applicationId: prep.applicationId,
        questions,
        generatedAt: prep.generatedAt,
      },
    })
  } catch (err) {
    console.error('POST /api/applications/[id]/interview-prep error:', err)
    return NextResponse.json({ error: 'Failed to generate interview prep' }, { status: 500 })
  }
}
