import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const source = await prisma.libraryExperience.findFirst({
      where: { id, userId: session.user.id },
      include: { bullets: { orderBy: { sortOrder: 'asc' } } },
    })

    if (!source) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    const maxSort = await prisma.libraryExperience.findFirst({
      where: { userId: session.user.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const cloned = await prisma.libraryExperience.create({
      data: {
        userId: source.userId,
        company: source.company,
        companyDesc: source.companyDesc,
        title: source.title,
        location: source.location,
        startDate: source.startDate,
        endDate: source.endDate,
        current: source.current,
        sortOrder: (maxSort?.sortOrder ?? 0) + 10,
        bullets: {
          create: source.bullets.map((b: { content: string; sortOrder: number }) => ({
            content: b.content,
            sortOrder: b.sortOrder,
          })),
        },
      },
      include: { bullets: { orderBy: { sortOrder: 'asc' } } },
    })

    return NextResponse.json({ data: cloned }, { status: 201 })
  } catch (error) {
    console.error('POST /api/library/experiences/[id]/clone error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
