import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const repos = await prisma.resumeRepository.findMany({
      where: { resumeId: id },
      include: { repository: true },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ data: repos })
  } catch (error) {
    console.error('GET /api/resumes/[id]/repositories error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json() as {
      repositoryId: string
      hidden?: boolean
      nameOverride?: string | null
      descriptionOverride?: string | null
      sortOrder?: number
    }

    const repo = await prisma.resumeRepository.upsert({
      where: { resumeId_repositoryId: { resumeId: id, repositoryId: body.repositoryId } },
      create: {
        resumeId: id,
        repositoryId: body.repositoryId,
        hidden: body.hidden ?? false,
        nameOverride: body.nameOverride ?? null,
        descriptionOverride: body.descriptionOverride ?? null,
        sortOrder: body.sortOrder ?? 0,
      },
      update: {
        hidden: body.hidden ?? false,
        nameOverride: body.nameOverride ?? null,
        descriptionOverride: body.descriptionOverride ?? null,
        sortOrder: body.sortOrder ?? 0,
      },
      include: { repository: true },
    })

    return NextResponse.json({ data: repo }, { status: 201 })
  } catch (error) {
    console.error('POST /api/resumes/[id]/repositories error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
