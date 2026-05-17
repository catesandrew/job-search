import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { BulletSchema } from '@/lib/validations/resume'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; positionId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, positionId } = await params
    const position = await prisma.position.findFirst({
      where: { id: positionId, resumeId: id },
    })
    if (!position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 })
    }

    const bullets = await prisma.bullet.findMany({
      where: { positionId },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ data: bullets })
  } catch (error) {
    console.error('GET bullets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; positionId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, positionId } = await params
    const position = await prisma.position.findFirst({
      where: { id: positionId, resumeId: id },
    })
    if (!position) {
      return NextResponse.json({ error: 'Position not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = BulletSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const bullet = await prisma.bullet.create({
      data: {
        positionId,
        ...parsed.data,
      },
    })

    return NextResponse.json({ data: bullet }, { status: 201 })
  } catch (error) {
    console.error('POST bullets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
