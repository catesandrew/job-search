import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { UpdateIdentitySchema } from '@/lib/validations/resume'

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
    const identity = await prisma.identity.findUnique({
      where: { id },
      include: { _count: { select: { resumes: true } } },
    })
    if (!identity || identity.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ data: identity })
  } catch (error) {
    console.error('GET /api/identities/[id] error:', error)
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
    const existing = await prisma.identity.findUnique({ where: { id } })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = UpdateIdentitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const identity = await prisma.identity.update({
      where: { id },
      data: parsed.data,
      include: { _count: { select: { resumes: true } } },
    })
    return NextResponse.json({ data: identity })
  } catch (error) {
    console.error('PUT /api/identities/[id] error:', error)
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
    const existing = await prisma.identity.findUnique({
      where: { id },
      include: { _count: { select: { resumes: true } } },
    })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (existing._count.resumes > 0) {
      return NextResponse.json(
        { error: `Cannot delete: linked to ${existing._count.resumes} resume${existing._count.resumes === 1 ? '' : 's'}` },
        { status: 409 }
      )
    }
    await prisma.identity.delete({ where: { id } })
    return NextResponse.json({ data: { id } })
  } catch (error) {
    console.error('DELETE /api/identities/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
