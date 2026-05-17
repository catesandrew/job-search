import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { quantifyBullets } from '@/lib/ai/mcp-tools'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { positionTitle, company, bullets } = await req.json() as {
    positionTitle: string
    company: string
    bullets: Array<{ id: string; text: string }>
  }

  if (!bullets?.length) {
    return NextResponse.json({ error: 'bullets required' }, { status: 400 })
  }

  const texts = bullets.map(b => b.text)
  const quantified = await quantifyBullets(texts, positionTitle, company)

  const enhanced = bullets.map((b, i) => ({
    id: b.id,
    text: quantified[i] ?? b.text,
  }))

  return NextResponse.json({ enhanced })
}
