import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { simulateRecruiterScreen } from '@/lib/ai/mcp-tools'

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
    for (const b of pos.bullets.filter(b => !b.hidden)) {
      parts.push('• ' + b.content.replace(/<[^>]+>/g, ' '))
    }
  }
  for (const s of resume.skills) parts.push(`${s.name}: ${s.skills}`)
  return parts.join('\n')
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { resumeId, jobDescription } = await req.json() as { resumeId: string; jobDescription?: string }
    if (!resumeId) return NextResponse.json({ error: 'resumeId is required' }, { status: 400 })

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId, userId: session.user.id },
      include: {
        profile: true,
        positions: { include: { bullets: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
        skills: { orderBy: { sortOrder: 'asc' } },
      },
    })
    if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 })

    const text = resumeToText(resume as Parameters<typeof resumeToText>[0])
    console.log('[screen-resume] resume text length:', text.length)
    if (!text.trim()) {
      return NextResponse.json({ error: 'Resume has no visible content to screen' }, { status: 400 })
    }

    const score = await simulateRecruiterScreen(text, jobDescription)
    console.log('[screen-resume] score:', JSON.stringify(score).slice(0, 200))

    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        lastScreenScore: JSON.stringify(score),
        lastScreenAt: new Date(),
      },
    })

    return NextResponse.json({ data: score })
  } catch (error) {
    console.error('POST /api/ai/screen-resume error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
