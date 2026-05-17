import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { extractCareerFacts } from '@/lib/ai/mcp-tools'

function resumeToText(resume: {
  profile: { firstName: string; lastName: string; targetTitle: string | null; summary: string | null } | null
  positions: Array<{
    title: string; company: string; startDate: string | null; endDate: string | null; hidden: boolean
    bullets: Array<{ content: string; hidden: boolean }>
  }>
  skills: Array<{ name: string; skills: string }>
  education: Array<{ institution: string; degree: string | null }>
}): string {
  const parts: string[] = []
  if (resume.profile) {
    const p = resume.profile
    parts.push(`${p.firstName} ${p.lastName}`)
    if (p.targetTitle) parts.push(p.targetTitle)
    if (p.summary) parts.push(p.summary)
  }
  for (const pos of resume.positions.filter(p => !p.hidden)) {
    const dates = [pos.startDate, pos.endDate ?? 'Present'].filter(Boolean).join(' – ')
    parts.push(`${pos.title} at ${pos.company} (${dates})`)
    for (const b of pos.bullets.filter(b => !b.hidden)) {
      parts.push('• ' + b.content.replace(/<[^>]+>/g, ' '))
    }
  }
  for (const s of resume.skills) parts.push(`${s.name}: ${s.skills}`)
  for (const e of resume.education) {
    if (e.degree) parts.push(`${e.degree} — ${e.institution}`)
  }
  return parts.join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { resumeId } = await req.json() as { resumeId: string }
    if (!resumeId) return NextResponse.json({ error: 'resumeId is required' }, { status: 400 })

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId, userId: session.user.id },
      include: {
        profile: true,
        positions: { include: { bullets: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
        skills: { orderBy: { sortOrder: 'asc' } },
        education: { orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 })

    const text = resumeToText(resume as Parameters<typeof resumeToText>[0])
    const library = await extractCareerFacts(text)

    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        factLibrary: JSON.stringify(library),
        factLibraryAt: new Date(),
      },
    })

    return NextResponse.json({ data: library })
  } catch (error) {
    console.error('POST /api/ai/extract-facts error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
