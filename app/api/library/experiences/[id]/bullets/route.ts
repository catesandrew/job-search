import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const experience = await prisma.libraryExperience.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!experience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    const bullets = await prisma.libraryBullet.findMany({
      where: { experienceId: id },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ data: bullets })
  } catch (error) {
    console.error('GET /api/library/experiences/[id]/bullets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const experience = await prisma.libraryExperience.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!experience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    const body = await request.json()
    const { content, sortOrder } = body

    const bullet = await prisma.libraryBullet.create({
      data: {
        experienceId: id,
        content,
        sortOrder,
      },
    })

    return NextResponse.json({ data: bullet }, { status: 201 })
  } catch (error) {
    console.error('POST /api/library/experiences/[id]/bullets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
