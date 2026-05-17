import { type NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { getActiveProvider } from '@/lib/ai/provider-registry'

const PROMPTS: Record<string, (name: string, role: string, company: string, jd: string) => string> = {
  cold: (name, role, company, jd) =>
    `Write a concise cold outreach message (3-4 sentences) from ${name} to a contact at ${company} about the ${role} position. Be professional, personalized, and end with a low-friction ask (e.g., a brief chat). Do not use a subject line — write only the message body.${jd ? `\n\nRole context:\n${jd.slice(0, 600)}` : ''}`,

  'follow-up': (name, role, company, jd) =>
    `Write a brief follow-up message (2-3 sentences) from ${name} to ${company} after applying for the ${role} position. Express continued enthusiasm without being pushy. Write only the message body, no subject line.${jd ? `\n\nRole context:\n${jd.slice(0, 400)}` : ''}`,

  'thank-you': (name, role, company) =>
    `Write a warm thank-you message (3-4 sentences) from ${name} to the interviewer(s) at ${company} after interviewing for the ${role} role. Express genuine appreciation and briefly reiterate interest. Write only the message body, no subject line.`,
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { type } = await req.json() as { type: 'cold' | 'follow-up' | 'thank-you' }

  if (!['cold', 'follow-up', 'thank-you'].includes(type)) {
    return NextResponse.json({ error: 'Invalid message type' }, { status: 400 })
  }

  const application = await prisma.application.findUnique({
    where: { id, userId: session.user.id },
  })
  if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  try {
    const provider = await getActiveProvider()
    if (!provider) return NextResponse.json({ error: 'No AI provider configured' }, { status: 503 })

    // Get name from linked resume profile if available
    let name = 'the applicant'
    if (application.linkedResumeId) {
      const resume = await prisma.resume.findUnique({
        where: { id: application.linkedResumeId },
        include: { profile: true },
      })
      if (resume?.profile) {
        name = `${resume.profile.firstName} ${resume.profile.lastName}`.trim()
      }
    }

    const promptFn = PROMPTS[type]
    const prompt = promptFn(name, application.role, application.company, application.jobDescription ?? '')
    const message = await provider.generateText(prompt)

    return NextResponse.json({ data: { message } })
  } catch (err) {
    console.error('POST /api/applications/[id]/message error:', err)
    return NextResponse.json({ error: 'Failed to generate message' }, { status: 500 })
  }
}
