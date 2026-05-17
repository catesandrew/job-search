import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const repos = await prisma.repository.findMany({
      where: { userId: session.user.id },
      orderBy: [{ excluded: 'asc' }, { stars: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json({ data: repos })
  } catch (error) {
    console.error('GET /api/repositories error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
