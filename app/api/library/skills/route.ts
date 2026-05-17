import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await prisma.skillLibraryCategory.findMany({
      where: { userId: session.user.id },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ data: categories })
  } catch (error) {
    console.error('GET /api/library/skills error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, skills, sortOrder } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (skills !== undefined) {
      try {
        const arr = JSON.parse(skills)
        if (!Array.isArray(arr)) throw new Error()
      } catch {
        return NextResponse.json({ error: 'skills must be a JSON array string' }, { status: 400 })
      }
    }

    const category = await prisma.skillLibraryCategory.create({
      data: {
        userId: session.user.id,
        name,
        skills,
        sortOrder,
      },
    })

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error) {
    console.error('POST /api/library/skills error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
