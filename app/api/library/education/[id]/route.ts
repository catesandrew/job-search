import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { UpdateLibraryEducationSchema } from '@/lib/validations/resume'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const entry = await prisma.libraryEducation.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!entry) {
      return NextResponse.json({ error: 'Education not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = UpdateLibraryEducationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await prisma.libraryEducation.update({
      where: { id },
      data: parsed.data,
      include: { _count: { select: { educations: true } } },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT /api/library/education/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const entry = await prisma.libraryEducation.findFirst({
      where: { id, userId: session.user.id },
      include: { _count: { select: { educations: true } } },
    })
    if (!entry) {
      return NextResponse.json({ error: 'Education not found' }, { status: 404 })
    }

    if (entry._count.educations > 0) {
      return NextResponse.json(
        { error: `Cannot delete: linked to ${entry._count.educations} resume${entry._count.educations === 1 ? '' : 's'}` },
        { status: 409 }
      )
    }

    await prisma.libraryEducation.delete({ where: { id } })

    return NextResponse.json({ data: { id } })
  } catch (error) {
    console.error('DELETE /api/library/education/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
