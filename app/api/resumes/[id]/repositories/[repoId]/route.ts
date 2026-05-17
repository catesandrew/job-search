import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; repoId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { repoId } = await params
    const body = await request.json() as Record<string, unknown>

    const updated = await prisma.resumeRepository.update({
      where: { id: repoId },
      data: body,
      include: { repository: true },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT /api/resumes/[id]/repositories/[repoId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; repoId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { repoId } = await params
    await prisma.resumeRepository.delete({ where: { id: repoId } })
    return NextResponse.json({ data: { id: repoId } })
  } catch (error) {
    console.error('DELETE /api/resumes/[id]/repositories/[repoId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
