import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { EducationSchema } from '@/lib/validations/resume'
import { z } from 'zod'

const EducationWithLibrarySchema = EducationSchema.extend({
  libraryEducationId: z.string().optional().nullable(),
})

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

    const education = await prisma.education.findMany({
      where: { resumeId: id },
    })

    return NextResponse.json({ data: education })
  } catch (error) {
    console.error('GET education error:', error)
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
    const parsed = EducationWithLibrarySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const education = await prisma.education.create({
      data: {
        resumeId: id,
        ...parsed.data,
      },
      include: { libraryEducation: true },
    })

    return NextResponse.json({ data: education }, { status: 201 })
  } catch (error) {
    console.error('POST education error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
