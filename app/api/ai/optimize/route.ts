import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getActiveProvider } from '@/lib/ai/provider-registry'
import type { AiOptimizeRequest } from '@/lib/ai/provider'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { applicationId, jobTitle, resumeId } = body as {
      applicationId?: string
      jobTitle?: string
      resumeId?: string
    }

    if (!applicationId && !jobTitle) {
      return NextResponse.json({ error: 'applicationId or jobTitle is required' }, { status: 400 })
    }

    let jobDescription: string
    let linkedResumeId: string | null = null

    if (applicationId) {
      // Load application with job description
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
      })

      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 })
      }

      if (!application.jobDescription) {
        return NextResponse.json(
          { error: 'Application has no job description' },
          { status: 400 }
        )
      }

      jobDescription = application.jobDescription
      linkedResumeId = application.linkedResumeId
    } else {
      jobDescription = `Optimize this resume for the following role: "${jobTitle}". Select the most relevant positions, bullets, and skills for a ${jobTitle} position. Prioritize leadership, technical depth, and impact.`
    }

    // Load master resume
    const targetResumeId = resumeId ?? linkedResumeId
    let masterResume = null

    if (targetResumeId) {
      masterResume = await prisma.resume.findUnique({
        where: { id: targetResumeId },
        include: {
          positions: {
            include: { bullets: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { sortOrder: 'asc' },
          },
          skills: { orderBy: { sortOrder: 'asc' } },
        },
      })
    }

    // Fall back to first BASE resume for this user
    if (!masterResume) {
      masterResume = await prisma.resume.findFirst({
        where: { userId: session.user.id, type: 'BASE' },
        include: {
          positions: {
            include: { bullets: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { sortOrder: 'asc' },
          },
          skills: { orderBy: { sortOrder: 'asc' } },
        },
      })
    }

    if (!masterResume) {
      return NextResponse.json({ error: 'No base resume found' }, { status: 404 })
    }

    const provider = await getActiveProvider()
    if (!provider) {
      return NextResponse.json(
        { error: 'No AI provider configured' },
        { status: 503 }
      )
    }

    type MasterPos = { id: string; company: string; title: string; hidden: boolean; bullets: { id: string; content: string }[] }
    type MasterSkill = { id: string; name: string; skills: string }

    const req: AiOptimizeRequest = {
      masterResume: {
        positions: (masterResume.positions as MasterPos[]).map(p => ({
          id: p.id,
          company: p.company,
          title: p.title,
          hidden: p.hidden,
          bullets: p.bullets.map(b => ({ id: b.id, content: b.content })),
        })),
        skills: (masterResume.skills as MasterSkill[]).map(s => ({
          id: s.id,
          name: s.name,
          skills: s.skills,
        })),
      },
      jobDescription,
    }

    const selection = await provider.optimize(req)

    return NextResponse.json({
      data: { selection, masterResumeId: masterResume.id },
    })
  } catch (error) {
    console.error('POST /api/ai/optimize error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
