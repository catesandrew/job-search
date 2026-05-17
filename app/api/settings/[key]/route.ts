import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { UpdateSettingSchema } from '@/lib/validations/setting'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { key } = await params
    const setting = await prisma.setting.findUnique({ where: { key } })

    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
    }

    return NextResponse.json({ data: setting })
  } catch (error) {
    console.error('GET /api/settings/[key] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { key } = await params
    const existing = await prisma.setting.findUnique({ where: { key } })
    if (!existing) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = UpdateSettingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const setting = await prisma.setting.update({
      where: { key },
      data: { value: parsed.data.value },
    })

    return NextResponse.json({ data: setting })
  } catch (error) {
    console.error('PUT /api/settings/[key] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { key } = await params
    const existing = await prisma.setting.findUnique({ where: { key } })
    if (!existing) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 })
    }

    await prisma.setting.delete({ where: { key } })

    return NextResponse.json({ data: { key } })
  } catch (error) {
    console.error('DELETE /api/settings/[key] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
