import { NextRequest, NextResponse } from 'next/server'
import { getActiveProvider } from '@/lib/ai/provider-registry'

interface BulletInput {
  id: string
  text: string
}

function extractJson(text: string): unknown {
  // Strip markdown code fences if present
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
  return JSON.parse(stripped)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { positionTitle, company, bullets, instructions } = body as {
    positionTitle: string
    company: string
    bullets: BulletInput[]
    instructions?: string
  }

  if (!bullets?.length) {
    return NextResponse.json({ error: 'bullets array is required' }, { status: 400 })
  }

  const provider = await getActiveProvider()
  if (!provider) {
    return NextResponse.json(
      { error: 'No AI provider configured. Add an Anthropic API key in Settings.' },
      { status: 503 }
    )
  }

  const parts = [
    'You are a professional resume writer enhancing achievement bullet points.',
    '',
    `Position: ${positionTitle} at ${company}`,
  ]

  if (instructions?.trim()) {
    parts.push(`Instructions: ${instructions.trim()}`)
  }

  parts.push(
    '',
    'Enhance the following achievement bullet points to be more impactful.',
    'Use strong action verbs, quantify results where possible, and be specific.',
    'Keep each bullet to one concise sentence. Return ONLY a JSON array — no explanation, no code fences.',
    '',
    'Input:',
    JSON.stringify(bullets),
    '',
    'Return the same array structure with enhanced "text" values:',
    '[{"id":"...","text":"Enhanced version..."},...]',
  )

  const response = await provider.generateText(parts.join('\n'))

  let enhanced: BulletInput[]
  try {
    const parsed = extractJson(response)
    if (!Array.isArray(parsed)) throw new Error('Expected array')
    enhanced = parsed as BulletInput[]
  } catch {
    return NextResponse.json(
      { error: `Failed to parse AI response as JSON: ${response.slice(0, 200)}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ enhanced })
}
