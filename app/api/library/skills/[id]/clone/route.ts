import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const source = await prisma.skillLibraryCategory.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!source) {
      return NextResponse.json({ error: 'Skill category not found' }, { status: 404 })
    }

    const maxSort = await prisma.skillLibraryCategory.findFirst({
      where: { userId: session.user.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const cloned = await prisma.skillLibraryCategory.create({
      data: {
        userId: source.userId,
        name: `${source.name} (Copy)`,
        skills: source.skills,
        sortOrder: (maxSort?.sortOrder ?? 0) + 10,
      },
    })

    return NextResponse.json({ data: cloned }, { status: 201 })
  } catch (error) {
    console.error('POST /api/library/skills/[id]/clone error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
