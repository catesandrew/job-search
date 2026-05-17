import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bulletId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, bulletId } = await params
    const experience = await prisma.libraryExperience.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!experience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    const bullet = await prisma.libraryBullet.findFirst({
      where: { id: bulletId, experienceId: id },
    })
    if (!bullet) {
      return NextResponse.json({ error: 'Bullet not found' }, { status: 404 })
    }

    const body = await request.json()
    const { content, sortOrder } = body

    const updated = await prisma.libraryBullet.update({
      where: { id: bulletId },
      data: {
        ...(content !== undefined && { content }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT /api/library/experiences/[id]/bullets/[bulletId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; bulletId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, bulletId } = await params
    const experience = await prisma.libraryExperience.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!experience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    const bullet = await prisma.libraryBullet.findFirst({
      where: { id: bulletId, experienceId: id },
    })
    if (!bullet) {
      return NextResponse.json({ error: 'Bullet not found' }, { status: 404 })
    }

    await prisma.libraryBullet.delete({ where: { id: bulletId } })

    return NextResponse.json({ data: { id: bulletId } })
  } catch (error) {
    console.error('DELETE /api/library/experiences/[id]/bullets/[bulletId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
