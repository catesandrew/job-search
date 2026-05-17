import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { listProviders } from '@/lib/ai/provider-registry'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [providers, selectedSetting] = await Promise.all([
      listProviders(),
      prisma.setting.findUnique({ where: { key: 'ai_provider' } }),
    ])

    const selectedId = selectedSetting?.value ?? null

    const data = providers.map(p => ({
      ...p,
      selected: p.id === selectedId,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/ai/providers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
