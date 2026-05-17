import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { UpdateEducationSchema } from '@/lib/validations/resume'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; educationId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, educationId } = await params
    const education = await prisma.education.findFirst({
      where: { id: educationId, resumeId: id },
    })
    if (!education) {
      return NextResponse.json({ error: 'Education not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = UpdateEducationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await prisma.education.update({
      where: { id: educationId },
      data: parsed.data,
      include: { libraryEducation: true },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT education error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; educationId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, educationId } = await params
    const education = await prisma.education.findFirst({
      where: { id: educationId, resumeId: id },
    })
    if (!education) {
      return NextResponse.json({ error: 'Education not found' }, { status: 404 })
    }

    await prisma.education.delete({ where: { id: educationId } })

    return NextResponse.json({ data: { id: educationId } })
  } catch (error) {
    console.error('DELETE education error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
