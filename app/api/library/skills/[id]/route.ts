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
    const category = await prisma.skillLibraryCategory.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!category) {
      return NextResponse.json({ error: 'Skill category not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, skills, sortOrder } = body

    if (skills !== undefined) {
      try {
        const arr = JSON.parse(skills)
        if (!Array.isArray(arr)) throw new Error()
      } catch {
        return NextResponse.json({ error: 'skills must be a JSON array string' }, { status: 400 })
      }
    }

    const updated = await prisma.skillLibraryCategory.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(skills !== undefined && { skills }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT /api/library/skills/[id] error:', error)
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
    const category = await prisma.skillLibraryCategory.findFirst({
      where: { id, userId: session.user.id },
    })
    if (!category) {
      return NextResponse.json({ error: 'Skill category not found' }, { status: 404 })
    }

    await prisma.skillLibraryCategory.delete({ where: { id } })

    return NextResponse.json({ data: { id } })
  } catch (error) {
    console.error('DELETE /api/library/skills/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
