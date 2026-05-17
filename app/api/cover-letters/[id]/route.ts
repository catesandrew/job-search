import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

async function getOwned(id: string, userId: string) {
  return prisma.coverLetter.findFirst({ where: { id, userId } })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const letter = await prisma.coverLetter.findFirst({
      where: { id, userId: session.user.id },
      include: {
        resume: {
          select: {
            id: true,
            title: true,
            profile: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        application: { select: { id: true, company: true, role: true, location: true } },
      },
    })

    if (!letter) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: letter })
  } catch (error) {
    console.error('GET /api/cover-letters/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const owned = await getOwned(id, session.user.id)
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json() as {
      title?: string
      content?: string
      outreachMessage?: string
      length?: string
      tone?: string
      customPrompt?: string
      resumeId?: string | null
    }
    const updated = await prisma.coverLetter.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.outreachMessage !== undefined && { outreachMessage: body.outreachMessage }),
        ...(body.length !== undefined && { length: body.length }),
        ...(body.tone !== undefined && { tone: body.tone }),
        ...(body.customPrompt !== undefined && { customPrompt: body.customPrompt }),
        ...(body.resumeId !== undefined && { resumeId: body.resumeId }),
      },
      include: {
        resume: {
          select: {
            id: true,
            title: true,
            profile: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
        },
        application: { select: { id: true, company: true, role: true, location: true } },
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PATCH /api/cover-letters/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const owned = await getOwned(id, session.user.id)
    if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.coverLetter.delete({ where: { id } })
    return NextResponse.json({ data: null })
  } catch (error) {
    console.error('DELETE /api/cover-letters/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
