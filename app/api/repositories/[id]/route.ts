import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const repo = await prisma.repository.findFirst({ where: { id, userId: session.user.id } })
    if (!repo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json() as { excluded?: boolean }
    const updated = await prisma.repository.update({
      where: { id },
      data: { excluded: body.excluded ?? !repo.excluded },
    })
    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PATCH /api/repositories/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
