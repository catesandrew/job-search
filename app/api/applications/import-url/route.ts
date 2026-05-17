import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { getActiveProvider } from '@/lib/ai/provider-registry'
import { Readability } from '@mozilla/readability'
import TurndownService from 'turndown'
import { JSDOM } from 'jsdom'

export interface ExtractedApplication {
  company: string
  role: string
  location?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  salaryFreq?: string | null
  companyUrl?: string | null
  jobDescription?: string | null
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { url } = await req.json() as { url?: string }
    if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

    let parsed: URL
    try {
      parsed = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'URL must be http or https' }, { status: 400 })
    }

    // Fetch with browser-like User-Agent to avoid bot-blocking
    let html: string
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      })
      clearTimeout(timeout)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      html = await response.text()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Fetch failed'
      return NextResponse.json({ error: `Could not fetch URL: ${msg}` }, { status: 422 })
    }

    // Extract main article content with Readability
    const dom = new JSDOM(html, { url })
    let articleHtml: string
    try {
      const reader = new Readability(dom.window.document)
      const article = reader.parse()
      articleHtml = article?.content ?? html
    } catch {
      articleHtml = html
    }

    // Convert to Markdown
    const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-' })
    const markdown = td.turndown(articleHtml)

    // AI extraction
    const provider = await getActiveProvider()
    if (!provider) return NextResponse.json({ error: 'No AI provider configured' }, { status: 503 })

    const prompt = `Extract job posting fields from this markdown. Respond ONLY with valid JSON, no markdown fences.
Format: {"company":"...","role":"...","location":"...","salaryMin":null,"salaryMax":null,"salaryFreq":"yearly","companyUrl":null,"jobDescription":"<full markdown verbatim>"}
Rules: salaryMin/salaryMax as integers (USD annual if yearly), null if not found. salaryFreq is "yearly", "monthly", or "hourly". jobDescription = the FULL markdown text unchanged.

Markdown:
${markdown.slice(0, 8000)}`

    const raw = await provider.generateText(prompt)
    const extracted = safeParseJson<ExtractedApplication>(raw)

    if (!extracted?.company && !extracted?.role) {
      return NextResponse.json({ error: 'Could not extract job details from this page' }, { status: 422 })
    }

    // Always store full markdown as jobDescription
    const result: ExtractedApplication = {
      company: extracted.company ?? '',
      role: extracted.role ?? '',
      location: extracted.location ?? null,
      salaryMin: extracted.salaryMin ?? null,
      salaryMax: extracted.salaryMax ?? null,
      salaryFreq: extracted.salaryFreq ?? null,
      companyUrl: extracted.companyUrl ?? null,
      jobDescription: markdown,
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('POST /api/applications/import-url error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
