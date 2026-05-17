import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { UpdateProfileSchema } from '@/lib/validations/resume'

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

    const profile = await prisma.profile.findUnique({
      where: { resumeId: id },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ data: profile })
  } catch (error) {
    console.error('GET /api/resumes/[id]/profile error:', error)
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
    const resume = await prisma.resume.findUnique({ where: { id } })
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = UpdateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const profile = await prisma.profile.upsert({
      where: { resumeId: id },
      update: parsed.data,
      create: {
        resumeId: id,
        firstName: '',
        lastName: '',
        email: '',
        ...parsed.data,
      },
    })

    return NextResponse.json({ data: profile })
  } catch (error) {
    console.error('PUT /api/resumes/[id]/profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
