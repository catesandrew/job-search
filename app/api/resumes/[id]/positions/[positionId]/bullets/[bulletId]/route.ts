import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { UpdateBulletSchema } from '@/lib/validations/resume'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; positionId: string; bulletId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { positionId, bulletId } = await params
    const bullet = await prisma.bullet.findFirst({
      where: { id: bulletId, positionId },
    })
    if (!bullet) {
      return NextResponse.json({ error: 'Bullet not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = UpdateBulletSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await prisma.bullet.update({
      where: { id: bulletId },
      data: parsed.data,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT bullet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; positionId: string; bulletId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { positionId, bulletId } = await params
    const bullet = await prisma.bullet.findFirst({
      where: { id: bulletId, positionId },
    })
    if (!bullet) {
      return NextResponse.json({ error: 'Bullet not found' }, { status: 404 })
    }

    await prisma.bullet.delete({ where: { id: bulletId } })

    return NextResponse.json({ data: { id: bulletId } })
  } catch (error) {
    console.error('DELETE bullet error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
