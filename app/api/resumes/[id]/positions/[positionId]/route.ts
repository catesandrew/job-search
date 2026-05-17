import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { UpdatePositionSchema } from '@/lib/validations/resume'

export async function PUT(
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
    const parsed = UpdatePositionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await prisma.position.update({
      where: { id: positionId },
      data: parsed.data,
      include: { bullets: { orderBy: { sortOrder: 'asc' } } },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT /api/resumes/[id]/positions/[positionId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    await prisma.position.delete({ where: { id: positionId } })

    return NextResponse.json({ data: { id: positionId } })
  } catch (error) {
    console.error('DELETE /api/resumes/[id]/positions/[positionId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
