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

    const source = await prisma.application.findUnique({
      where: { id },
    })

    if (!source || source.userId !== session.user.id) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const cloned = await prisma.application.create({
      data: {
        userId: source.userId,
        company: source.company,
        companyUrl: source.companyUrl,
        role: source.role,
        location: source.location,
        remote: source.remote,
        status: source.status,
        salaryMin: source.salaryMin,
        salaryMax: source.salaryMax,
        salaryFreq: source.salaryFreq,
        jobUrl: source.jobUrl,
        jobDescription: source.jobDescription,
        notes: source.notes,
        // linkedResumeId intentionally not copied
      },
      include: { linkedResume: { select: { id: true, title: true } } },
    })

    return NextResponse.json({ data: cloned }, { status: 201 })
  } catch (error) {
    console.error('POST /api/applications/[id]/clone error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
