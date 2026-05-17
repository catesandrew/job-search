import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { LibraryEducationSchema } from '@/lib/validations/resume'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const entries = await prisma.libraryEducation.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { educations: true } } },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ data: entries })
  } catch (error) {
    console.error('GET /api/library/education error:', error)
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
    const parsed = LibraryEducationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const maxSort = await prisma.libraryEducation.findFirst({
      where: { userId: session.user.id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const entry = await prisma.libraryEducation.create({
      data: {
        userId: session.user.id,
        ...parsed.data,
        sortOrder: parsed.data.sortOrder ?? (maxSort?.sortOrder ?? -1) + 1,
      },
      include: { _count: { select: { educations: true } } },
    })

    return NextResponse.json({ data: entry }, { status: 201 })
  } catch (error) {
    console.error('POST /api/library/education error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
