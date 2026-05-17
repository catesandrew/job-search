import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

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
    const experience = await prisma.libraryExperience.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!experience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    const body = await request.json()
    const { company, title, companyDesc, location, startDate, endDate, current, sortOrder } = body

    const updated = await prisma.libraryExperience.update({
      where: { id },
      data: {
        ...(company !== undefined && { company }),
        ...(title !== undefined && { title }),
        ...(companyDesc !== undefined && { companyDesc }),
        ...(location !== undefined && { location }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(current !== undefined && { current }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT /api/library/experiences/[id] error:', error)
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
    const experience = await prisma.libraryExperience.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!experience) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 })
    }

    await prisma.libraryExperience.delete({ where: { id } })

    return NextResponse.json({ data: { id } })
  } catch (error) {
    console.error('DELETE /api/library/experiences/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
