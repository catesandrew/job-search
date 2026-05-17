import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { CreateApplicationSchema } from '@/lib/validations/application'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const userId = session.user.id

    const where: Record<string, unknown> = { userId }
    if (status) {
      where.status = status
    }
    if (search) {
      where.OR = [
        { company: { contains: search } },
        { role: { contains: search } },
      ]
    }

    const applications = await prisma.application.findMany({
      where,
      include: { linkedResume: { select: { id: true, title: true } } },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ data: applications })
  } catch (error) {
    console.error('GET /api/applications error:', error)
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
    const parsed = CreateApplicationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        ...parsed.data,
      },
      include: { linkedResume: { select: { id: true, title: true } } },
    })

    return NextResponse.json({ data: application }, { status: 201 })
  } catch (error) {
    console.error('POST /api/applications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
