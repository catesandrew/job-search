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

    const source = await prisma.identity.findUnique({
      where: { id },
    })

    if (!source || source.userId !== session.user.id) {
      return NextResponse.json({ error: 'Identity not found' }, { status: 404 })
    }

    const cloned = await prisma.identity.create({
      data: {
        userId: source.userId,
        label: `${source.label} (Copy)`,
        firstName: source.firstName,
        lastName: source.lastName,
        email: source.email,
        phone: source.phone,
        location: source.location,
        linkedin: source.linkedin,
        website: source.website,
      },
      include: { _count: { select: { resumes: true } } },
    })

    return NextResponse.json({ data: cloned }, { status: 201 })
  } catch (error) {
    console.error('POST /api/identities/[id]/clone error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
