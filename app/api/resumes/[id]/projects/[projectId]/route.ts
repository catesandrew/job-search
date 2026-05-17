import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { UpdateProjectSchema } from '@/lib/validations/resume'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, projectId } = await params
    const project = await prisma.project.findFirst({
      where: { id: projectId, resumeId: id },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = UpdateProjectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: parsed.data,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT project error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, projectId } = await params
    const project = await prisma.project.findFirst({
      where: { id: projectId, resumeId: id },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await prisma.project.delete({ where: { id: projectId } })

    return NextResponse.json({ data: { id: projectId } })
  } catch (error) {
    console.error('DELETE project error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
