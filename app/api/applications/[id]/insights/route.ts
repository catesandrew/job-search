import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getActiveProvider } from '@/lib/ai/provider-registry'
import { Readability } from '@mozilla/readability'
import TurndownService from 'turndown'
import { JSDOM } from 'jsdom'

export interface CompanyInsightItem {
  text: string
}

export interface CompanyInsights {
  description: string
  recentAnnouncements: CompanyInsightItem[]
  fundingRounds: CompanyInsightItem[]
  businessFinancials: CompanyInsightItem[]
  culture: string
  similarCompanies: Array<{ name: string }>
  generatedAt: string
}

function safeParseJson<T>(text: string): T | null {
  try {
    const stripped = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
    return JSON.parse(stripped) as T
  } catch { /* fall through */ }
  try {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0]) as T
  } catch { /* fall through */ }
  return null
}

async function fetchCompanyMarkdown(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    clearTimeout(timeout)
    if (!response.ok) return null
    const html = await response.text()
    const dom = new JSDOM(html, { url })
    const reader = new Readability(dom.window.document)
    const article = reader.parse()
    const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' })
    return td.turndown(article?.content ?? html).slice(0, 4000)
  } catch {
    return null
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const application = await prisma.application.findUnique({
    where: { id, userId: session.user.id },
    select: { companyInsights: true },
  })
  if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!application.companyInsights) return NextResponse.json({ data: null })
  return NextResponse.json({ data: JSON.parse(application.companyInsights) as CompanyInsights })
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const application = await prisma.application.findUnique({
    where: { id, userId: session.user.id },
    select: { id: true, company: true, companyUrl: true, role: true, jobDescription: true },
  })
  if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const provider = await getActiveProvider()
  if (!provider) return NextResponse.json({ error: 'No AI provider configured' }, { status: 503 })

  // Fetch company website if available
  let websiteContext = ''
  if (application.companyUrl) {
    const markdown = await fetchCompanyMarkdown(application.companyUrl)
    if (markdown) websiteContext = `\n\nCompany website content:\n${markdown}`
  }

  const prompt = `Generate company insights for ${application.company} (hiring for: ${application.role}). Use your training knowledge. Respond with ONLY valid JSON — no markdown, no explanation.

Format:
{
  "description": "2-3 sentence overview of what the company does, its mission, and its market position",
  "recentAnnouncements": [{"text":"one sentence describing a recent company announcement or news item"}],
  "fundingRounds": [{"text":"one sentence about a funding round or investment"}],
  "businessFinancials": [{"text":"one sentence about revenue, growth, or business metrics"}],
  "culture": "2-3 sentence description of the company culture and values",
  "similarCompanies": [{"name":"Company Name"}]
}

Rules:
- description: what the company does, its stage, key products/services
- recentAnnouncements: 2-4 items (product launches, partnerships, expansions, org changes)
- fundingRounds: 1-3 items if applicable (startup/growth stage), omit array items if public company with no notable rounds
- businessFinancials: 1-3 items (revenue, users, growth metrics, market position)
- culture: focus on engineering culture, team size, remote policy, values
- similarCompanies: 4-6 competitors or companies in the same space
- If you have limited knowledge about this company, provide what you know and clearly note uncertainty${websiteContext}${application.jobDescription ? `\n\nJob description context:\n${application.jobDescription.slice(0, 1000)}` : ''}`

  const raw = await provider.generateText(prompt)
  const parsed = safeParseJson<Omit<CompanyInsights, 'generatedAt'>>(raw)

  if (!parsed) {
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 422 })
  }

  const insights: CompanyInsights = {
    description: parsed.description ?? '',
    recentAnnouncements: parsed.recentAnnouncements ?? [],
    fundingRounds: parsed.fundingRounds ?? [],
    businessFinancials: parsed.businessFinancials ?? [],
    culture: parsed.culture ?? '',
    similarCompanies: parsed.similarCompanies ?? [],
    generatedAt: new Date().toISOString(),
  }

  await prisma.application.update({
    where: { id },
    data: { companyInsights: JSON.stringify(insights) },
  })

  return NextResponse.json({ data: insights })
}
