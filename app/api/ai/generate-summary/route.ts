import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActiveProvider } from '@/lib/ai/provider-registry'
type PositionWithBullets = {
  title: string; company: string; startDate: string | null; endDate: string | null; current: boolean
  bullets: Array<{ content: string }>
}
type SkillCategoryModel = { name: string; skills: string }

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { resumeId, keywords, customPrompt, enhanceExisting } = body

  if (!resumeId) {
    return NextResponse.json({ error: 'resumeId is required' }, { status: 400 })
  }

  const provider = await getActiveProvider()
  if (!provider) {
    return NextResponse.json(
      { error: 'No AI provider configured. Add an Anthropic API key in Settings.' },
      { status: 503 }
    )
  }

  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: {
      profile: true,
      identity: true,
      positions: {
        where: { hidden: false },
        orderBy: { sortOrder: 'asc' },
        include: {
          bullets: {
            where: { hidden: false },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
      skills: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!resume) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
  }

  const contact = resume.identity ?? resume.profile
  const name = contact ? `${contact.firstName} ${contact.lastName}`.trim() : ''
  const targetTitle = resume.profile?.targetTitle ?? resume.title

  const experienceParts = resume.positions.map((pos: PositionWithBullets) => {
    const dateRange = `${pos.startDate ?? ''} – ${pos.current ? 'Present' : (pos.endDate ?? '')}`
    const bulletLines = pos.bullets
      .map(b => `  • ${b.content.replace(/<[^>]+>/g, '').trim()}`)
      .join('\n')
    return `${pos.title} at ${pos.company} (${dateRange})\n${bulletLines}`
  })

  const skillsParts = resume.skills.map((cat: SkillCategoryModel) => {
    let list: string[] = []
    try { list = JSON.parse(cat.skills) } catch { list = [] }
    return `${cat.name}: ${list.join(', ')}`
  })

  const parts: string[] = [
    'You are a professional resume writer. Generate a compelling professional summary.',
    '',
    ...(name ? [`Candidate: ${name}`] : []),
    `Target Role: ${targetTitle}`,
  ]

  if (experienceParts.length > 0) {
    parts.push('', 'Experience:', ...experienceParts)
  }

  if (skillsParts.length > 0) {
    parts.push('', 'Skills:', ...skillsParts)
  }

  if (keywords?.trim()) {
    parts.push('', `Keywords to emphasize: ${(keywords as string).trim()}`)
  }

  if (enhanceExisting && resume.profile?.summary) {
    const plain = resume.profile.summary.replace(/<[^>]+>/g, '').trim()
    if (plain) {
      parts.push('', 'Current summary to improve:', plain, '', 'Enhance and rewrite the above summary.')
    }
  }

  if (customPrompt?.trim()) {
    parts.push('', `Additional instructions: ${(customPrompt as string).trim()}`)
  }

  parts.push(
    '',
    'Write a 2-4 sentence professional summary using markdown. You may use **bold** to emphasize key terms or technologies. Return only the summary — no HTML, no preamble, no heading.'
  )

  const summary = await provider.generateText(parts.join('\n'))
  return NextResponse.json({ summary })
}
