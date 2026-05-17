import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { UpdateResumeSchema } from '@/lib/validations/resume'

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
    const resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        identity: true,
        profile: true,
        positions: {
          include: { bullets: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
        skills: { orderBy: { sortOrder: 'asc' } },
        education: { include: { libraryEducation: true }, orderBy: { sortOrder: 'asc' } },
        projects: { orderBy: { sortOrder: 'asc' } },
        resumeRepositories: {
          include: { repository: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { applications: true } },
      },
    })

    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    return NextResponse.json({ data: resume })
  } catch (error) {
    console.error('GET /api/resumes/[id] error:', error)
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
    const existing = await prisma.resume.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = UpdateResumeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const resume = await prisma.resume.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ data: resume })
  } catch (error) {
    console.error('PUT /api/resumes/[id] error:', error)
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
    const existing = await prisma.resume.findUnique({
      where: { id },
      include: { _count: { select: { applications: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    if (existing._count.applications > 0) {
      return NextResponse.json(
        { error: `Cannot delete: this resume is linked to ${existing._count.applications} application${existing._count.applications === 1 ? '' : 's'}` },
        { status: 409 }
      )
    }

    await prisma.resume.delete({ where: { id } })

    return NextResponse.json({ data: { id } })
  } catch (error) {
    console.error('DELETE /api/resumes/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
