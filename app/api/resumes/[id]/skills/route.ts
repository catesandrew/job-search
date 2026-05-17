import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { SkillCategorySchema } from '@/lib/validations/resume'

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
    const resume = await prisma.resume.findUnique({ where: { id } })
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    const skills = await prisma.skillCategory.findMany({
      where: { resumeId: id },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ data: skills })
  } catch (error) {
    console.error('GET skills error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const resume = await prisma.resume.findUnique({ where: { id } })
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = SkillCategorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const skill = await prisma.skillCategory.create({
      data: {
        resumeId: id,
        ...parsed.data,
      },
    })

    return NextResponse.json({ data: skill }, { status: 201 })
  } catch (error) {
    console.error('POST skills error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
