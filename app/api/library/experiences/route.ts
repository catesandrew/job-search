import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const experiences = await prisma.libraryExperience.findMany({
      where: { userId: session.user.id },
      include: { bullets: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ data: experiences })
  } catch (error) {
    console.error('GET /api/library/experiences error:', error)
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
    const { company, title, companyDesc, location, startDate, endDate, current, sortOrder } = body

    if (!company || typeof company !== 'string' || !title || typeof title !== 'string') {
      return NextResponse.json({ error: 'company and title are required' }, { status: 400 })
    }

    const experience = await prisma.libraryExperience.create({
      data: {
        userId: session.user.id,
        company,
        title,
        ...(companyDesc !== undefined && { companyDesc }),
        ...(location !== undefined && { location }),
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(current !== undefined && { current }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      include: { bullets: true },
    })

    return NextResponse.json({ data: experience }, { status: 201 })
  } catch (error) {
    console.error('POST /api/library/experiences error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
