import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { UpdateApplicationSchema } from '@/lib/validations/application'

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
    const application = await prisma.application.findUnique({
      where: { id },
      include: { linkedResume: { select: { id: true, title: true } } },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json({ data: application })
  } catch (error) {
    console.error('GET /api/applications/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const existing = await prisma.application.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = UpdateApplicationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const application = await prisma.application.update({
      where: { id },
      data: parsed.data,
      include: { linkedResume: { select: { id: true, title: true } } },
    })

    return NextResponse.json({ data: application })
  } catch (error) {
    console.error('PUT /api/applications/[id] error:', error)
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
    const existing = await prisma.application.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    await prisma.application.delete({ where: { id } })

    return NextResponse.json({ data: { id } })
  } catch (error) {
    console.error('DELETE /api/applications/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
