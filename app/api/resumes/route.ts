import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { CreateResumeSchema } from '@/lib/validations/resume'

const DEFAULT_SECTION_ORDER = JSON.stringify([
  { name: 'summary', visible: true },
  { name: 'skills', visible: true },
  { name: 'experience', visible: true },
  { name: 'education', visible: true },
  { name: 'projects', visible: true },
])

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const userId = session.user.id

    const where: Record<string, unknown> = { userId }
    if (type) {
      where.type = type
    }

    const resumes = await prisma.resume.findMany({
      where,
      include: {
        profile: true,
        _count: { select: { positions: true, skills: true, applications: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ data: resumes })
  } catch (error) {
    console.error('GET /api/resumes error:', error)
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
    const parsed = CreateResumeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        ...parsed.data,
        sectionOrder: parsed.data.sectionOrder ?? DEFAULT_SECTION_ORDER,
      },
    })

    return NextResponse.json({ data: resume }, { status: 201 })
  } catch (error) {
    console.error('POST /api/resumes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
