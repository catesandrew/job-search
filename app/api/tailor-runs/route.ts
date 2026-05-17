import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const runs = await prisma.tailorRun.findMany({
      where: { resume: { userId: session.user.id } },
      orderBy: { tailoredAt: 'desc' },
      include: { resume: { select: { id: true, title: true } } },
    })

    return NextResponse.json({ data: runs })
  } catch (error) {
    console.error('GET /api/tailor-runs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
