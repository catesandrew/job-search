import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { IdentitySchema } from '@/lib/validations/resume'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const identities = await prisma.identity.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { resumes: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ data: identities })
  } catch (error) {
    console.error('GET /api/identities error:', error)
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
    const parsed = IdentitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const identity = await prisma.identity.create({
      data: { userId: session.user.id, ...parsed.data },
      include: { _count: { select: { resumes: true } } },
    })

    return NextResponse.json({ data: identity }, { status: 201 })
  } catch (error) {
    console.error('POST /api/identities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
