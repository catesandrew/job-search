import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { UpdateSkillCategorySchema } from '@/lib/validations/resume'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; skillId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, skillId } = await params
    const skill = await prisma.skillCategory.findFirst({
      where: { id: skillId, resumeId: id },
    })
    if (!skill) {
      return NextResponse.json({ error: 'Skill category not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = UpdateSkillCategorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const updated = await prisma.skillCategory.update({
      where: { id: skillId },
      data: parsed.data,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PUT skill error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; skillId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, skillId } = await params
    const skill = await prisma.skillCategory.findFirst({
      where: { id: skillId, resumeId: id },
    })
    if (!skill) {
      return NextResponse.json({ error: 'Skill category not found' }, { status: 404 })
    }

    await prisma.skillCategory.delete({ where: { id: skillId } })

    return NextResponse.json({ data: { id: skillId } })
  } catch (error) {
    console.error('DELETE skill error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
