import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const coverLetters = await prisma.coverLetter.findMany({
      where: { userId: session.user.id },
      include: {
        resume: { select: { id: true, title: true } },
        application: { select: { id: true, company: true, role: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ data: coverLetters })
  } catch (error) {
    console.error('GET /api/cover-letters error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
