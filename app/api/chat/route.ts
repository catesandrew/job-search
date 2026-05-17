import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export type ChatProvider = 'anthropic' | 'openai' | 'google'

// ── Provider factory ──────────────────────────────────────────────────────────

function getModel(provider: ChatProvider) {
  switch (provider) {
    case 'openai':
      return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })('gpt-4o-mini')
    case 'google':
      return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })('gemini-2.0-flash')
    case 'anthropic':
    default:
      return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })('claude-haiku-4-5')
  }
}

// ── Context builders ──────────────────────────────────────────────────────────

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function buildApplicationContext(id: string, userId: string): Promise<string> {
  const app = await prisma.application.findUnique({
    where: { id, userId },
    include: {
      linkedResume: {
        include: {
          profile: true,
          positions: { include: { bullets: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
          skills: { orderBy: { sortOrder: 'asc' } },
        },
      },
      interviewPrep: true,
    },
  })
  if (!app) return ''

  const lines: string[] = [
    `## Application: ${app.role} at ${app.company}`,
    `Status: ${app.status}`,
    app.location ? `Location: ${app.location}` : '',
    app.salaryMin ? `Target Salary: $${app.salaryMin.toLocaleString()}–$${(app.salaryMax ?? 0).toLocaleString()}` : '',
  ]

  if (app.jobDescription) lines.push(`\n### Job Description\n${app.jobDescription.slice(0, 2000)}`)
  if (app.notes) lines.push(`\n### Notes\n${app.notes}`)

  if (app.companyInsights) {
    try {
      const ins = JSON.parse(app.companyInsights) as { description?: string; culture?: string }
      if (ins.description) lines.push(`\n### About ${app.company}\n${ins.description}`)
      if (ins.culture) lines.push(`Culture: ${ins.culture}`)
    } catch { /* ignore */ }
  }

  if (app.linkedResume) {
    const r = app.linkedResume
    const rLines = [`\n### Linked Resume: ${r.title}`]
    if (r.profile?.summary) rLines.push(r.profile.summary)
    for (const pos of r.positions) {
      if (pos.hidden) continue
      rLines.push(`\n**${pos.title} at ${pos.company}**`)
      for (const b of pos.bullets) {
        if (!b.hidden) rLines.push('• ' + stripHtml(b.content))
      }
    }
    for (const s of r.skills) rLines.push(`${s.name}: ${s.skills}`)
    lines.push(rLines.join('\n'))
  }

  if (app.interviewPrep?.questions) {
    try {
      const qs = JSON.parse(app.interviewPrep.questions) as Array<{ question: string; probability: string }>
      const top = qs.filter(q => q.probability === 'high').slice(0, 5)
      if (top.length > 0) lines.push('\n### High-Priority Interview Questions\n' + top.map(q => `• ${q.question}`).join('\n'))
    } catch { /* ignore */ }
  }

  return lines.filter(Boolean).join('\n')
}

async function buildResumeContext(id: string, userId: string): Promise<string> {
  const resume = await prisma.resume.findUnique({
    where: { id, userId },
    include: {
      profile: true,
      positions: { include: { bullets: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } },
      skills: { orderBy: { sortOrder: 'asc' } },
      education: true,
      projects: true,
    },
  })
  if (!resume) return ''
  const lines = [`## Resume: ${resume.title}`]
  if (resume.profile?.summary) lines.push(`\n### Summary\n${resume.profile.summary}`)
  for (const pos of resume.positions) {
    if (pos.hidden) continue
    lines.push(`\n**${pos.title} at ${pos.company}** (${pos.startDate ?? ''}–${pos.endDate ?? 'Present'})`)
    for (const b of pos.bullets) {
      if (!b.hidden) lines.push('• ' + stripHtml(b.content))
    }
  }
  for (const s of resume.skills) lines.push(`${s.name}: ${s.skills}`)
  for (const e of resume.education) lines.push(`\n**${e.degree} — ${e.institution}**`)
  return lines.join('\n')
}

async function buildLibraryContext(userId: string): Promise<string> {
  const [experiences, skills] = await Promise.all([
    prisma.libraryExperience.findMany({
      where: { userId },
      include: { bullets: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    }),
    prisma.skillLibraryCategory.findMany({ where: { userId }, orderBy: { sortOrder: 'asc' } }),
  ])
  const lines = ['## Experience Library']
  for (const exp of experiences) {
    lines.push(`\n**${exp.title} at ${exp.company}**`)
    for (const b of exp.bullets) lines.push('• ' + stripHtml(b.content))
  }
  if (skills.length > 0) {
    lines.push('\n## Skills Library')
    for (const s of skills) lines.push(`${s.name}: ${s.skills}`)
  }
  return lines.join('\n')
}

async function buildCoverLetterContext(id: string, userId: string): Promise<string> {
  const cl = await prisma.coverLetter.findUnique({ where: { id, userId } })
  if (!cl) return ''
  return `## Cover Letter\n${(cl.content ?? '').slice(0, 3000)}`
}

async function buildGeneralContext(userId: string): Promise<string> {
  const apps = await prisma.application.findMany({
    where: { userId },
    select: { company: true, role: true, status: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })
  if (!apps.length) return ''
  return `## Recent Applications\n${apps.map((a: typeof apps[number]) => `• ${a.role} at ${a.company} (${a.status})`).join('\n')}`
}

async function buildContext(pathname: string, userId: string): Promise<string> {
  const appMatch = pathname.match(/^\/applications\/([^/]+)$/)
  if (appMatch) return buildApplicationContext(appMatch[1], userId)

  const resumeMatch = pathname.match(/^\/resumes\/([^/]+)/)
  if (resumeMatch) return buildResumeContext(resumeMatch[1], userId)

  if (pathname.startsWith('/library')) return buildLibraryContext(userId)

  const clMatch = pathname.match(/^\/cover-letters\/([^/]+)$/)
  if (clMatch) return buildCoverLetterContext(clMatch[1], userId)

  return buildGeneralContext(userId)
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const { messages, pathname, provider = 'anthropic' } = await req.json() as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    pathname: string
    provider?: ChatProvider
  }

  const context = await buildContext(pathname ?? '/', session.user.id)

  const system = `You are an expert career coach and job search assistant embedded in a personal job search dashboard. You help with resume writing, interview preparation, cover letters, salary negotiation, and career strategy.

Be specific, actionable, and reference the user's actual data when available. Keep responses concise — use bullet points and short paragraphs. When drafting text (emails, cover letters, bullet points), provide ready-to-use copy.${context ? `\n\n${context}` : ''}`

  const result = streamText({
    model: getModel(provider),
    system,
    messages,
    maxOutputTokens: 1024,
  })

  return result.toTextStreamResponse()
}
