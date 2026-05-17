import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'
import { getActiveProvider } from '@/lib/ai/provider-registry'

type SkillCat = { name: string; skills: string }
type ExpWithBullets = { company: string; title: string; location: string | null; startDate: string | null; endDate: string | null; current: boolean; bullets: Array<{ content: string }> }
type RepoRow = { id: string; name: string; description: string | null; language: string | null; stars: number }

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: resumeId } = await params

    // 2. Fetch resume - verify ownership + grab fact library
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId, userId: session.user.id },
      select: { id: true, factLibrary: true },
    })
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    let factLibraryJson: string | null = null
    if (resume.factLibrary) {
      try {
        const lib = JSON.parse(resume.factLibrary) as { facts: unknown[] }
        if (lib.facts?.length > 0) factLibraryJson = resume.factLibrary
      } catch { /* skip malformed */ }
    }

    // 3. Find linked application with JD
    // Applications reference this resume via linkedResumeId
    const application = await prisma.application.findFirst({
      where: { linkedResumeId: resumeId, userId: session.user.id },
      select: { id: true, jobDescription: true, company: true, role: true },
    })
    if (!application?.jobDescription) {
      return NextResponse.json(
        { error: 'No linked application with job description found' },
        { status: 400 }
      )
    }

    // 4. Fetch user's library + repositories
    const [skillCategories, experiences, repositories] = await Promise.all([
      prisma.skillLibraryCategory.findMany({
        where: { userId: session.user.id },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.libraryExperience.findMany({
        where: { userId: session.user.id },
        orderBy: { sortOrder: 'asc' },
        include: { bullets: { orderBy: { sortOrder: 'asc' } } },
      }),
      prisma.repository.findMany({
        where: { userId: session.user.id, excluded: false },
        orderBy: { stars: 'desc' },
        select: { id: true, name: true, description: true, language: true, stars: true },
      }),
    ])

    if (skillCategories.length === 0 && experiences.length === 0) {
      return NextResponse.json(
        { error: 'Library is empty. Add skills and experiences to your library first.' },
        { status: 400 }
      )
    }

    // 5. Build prompt and call AI
    const provider = await getActiveProvider()
    if (!provider) {
      return NextResponse.json({ error: 'No AI provider configured' }, { status: 503 })
    }

    const librarySkillsJson = JSON.stringify(
      (skillCategories as SkillCat[]).map((c) => {
        let parsed: string[] = []
        try { parsed = JSON.parse(c.skills || '[]') } catch { /* skip malformed */ }
        return { name: c.name, skills: parsed }
      })
    )

    const libraryExpJson = JSON.stringify(
      (experiences as ExpWithBullets[]).map((e) => ({
        company: e.company,
        title: e.title,
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate,
        current: e.current,
        bullets: e.bullets.map((b) => b.content),
      }))
    )

    const libraryReposJson = repositories.length > 0
      ? JSON.stringify(
          (repositories as RepoRow[]).map((r) => ({
            name: r.name,
            description: r.description,
            language: r.language,
            stars: r.stars,
          }))
        )
      : null

    const prompt = `You are a resume tailoring assistant. Given a job description and a master career library, select and tailor content for a resume. Respond ONLY with valid JSON — no markdown, no explanation.${factLibraryJson ? '\n\nIMPORTANT: A verified fact library is provided below. Ground your bullets in these verified facts — prefer phrasing that aligns with high-confidence facts (confidence ≥ 0.85).' : ''}

Job: ${application.role} at ${application.company}

Job Description:
${application.jobDescription.slice(0, 2000)}

Skills Library (all skills I have):
${librarySkillsJson}

Experience Library (all experience I have with every achievement):
${libraryExpJson}
${factLibraryJson ? `\nVerified Fact Library (ground bullets in these confirmed claims):
${factLibraryJson}` : ''}${libraryReposJson ? `\nRepositories Library (GitHub repos I can showcase):\n${libraryReposJson}` : ''}

Instructions:
- Write a professional summary (3-4 sentences) tailored to this specific role. Highlight seniority, relevant technical strengths, and what makes this candidate compelling for the position.
- Select 2-4 most relevant skill categories; within each, keep only skills relevant to this specific role.
- Select 3-5 experiences as your primary selections: choose the most relevant to the role, with 3-5 impactful bullets each.
- Additionally, always include any high-prestige or well-known brand employers (e.g. Netflix, Walmart Labs, MySpace, Disney) from the library even if less directly relevant — include 1-2 of their strongest bullets that best complement the role.
- Reword bullets slightly to match the role's language — preserve all metrics, facts, and specifics.
- Keep experience titles and company names exactly as in the library.${libraryReposJson ? '\n- From the repositories library, select 2-4 repos most relevant to this role. Return their exact names in the "repositories" array.' : ''}

Respond with this exact JSON structure:
{
  "summary": "string",
  "skills": [{ "name": "string", "skills": ["string"] }],
  "experience": [{
    "company": "string",
    "title": "string",
    "location": "string or null",
    "startDate": "string or null",
    "endDate": "string or null",
    "current": false,
    "bullets": ["string"]
  }]${libraryReposJson ? ',\n  "repositories": ["repo-name-1", "repo-name-2"]' : ''}
}`

    const raw = await provider.generateText(prompt)

    // Parse JSON (strip markdown fences if present)
    let tailored: {
      summary?: string
      skills: Array<{ name: string; skills: string[] }>
      experience: Array<{
        company: string
        title: string
        location?: string | null
        startDate?: string | null
        endDate?: string | null
        current: boolean
        bullets: string[]
      }>
      repositories?: string[]
    }
    try {
      const stripped = raw
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/, '')
        .trim()
      tailored = JSON.parse(stripped)
    } catch {
      return NextResponse.json(
        { error: 'AI returned invalid JSON. Please try again.' },
        { status: 502 }
      )
    }

    // 6. Validate AI response structure before touching the database
    if (!Array.isArray(tailored.skills) || !Array.isArray(tailored.experience)) {
      return NextResponse.json({ error: 'AI returned unexpected structure. Please try again.' }, { status: 502 })
    }
    for (const exp of tailored.experience) {
      if (!exp.company || !exp.title || !Array.isArray(exp.bullets)) {
        return NextResponse.json({ error: 'AI returned malformed experience data. Please try again.' }, { status: 502 })
      }
    }

    // 7. Atomically replace skills + experience on resume, and save summary to profile
    type TxClient = Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>
    await prisma.$transaction(async (tx: TxClient) => {
      // Save summary to profile (upsert — create minimal profile if none exists)
      if (tailored.summary) {
        await tx.profile.upsert({
          where: { resumeId },
          update: { summary: tailored.summary },
          create: { resumeId, firstName: '', lastName: '', email: '', summary: tailored.summary },
        })
      }

      // Delete existing skill categories
      await tx.skillCategory.deleteMany({ where: { resumeId } })

      // Create new skill categories from LLM output
      for (let i = 0; i < tailored.skills.length; i++) {
        const cat = tailored.skills[i]
        await tx.skillCategory.create({
          data: {
            resumeId,
            name: cat.name,
            skills: JSON.stringify(cat.skills),
            sortOrder: i,
          },
        })
      }

      // Explicitly delete bullets first to be safe across DB engines, then positions
      const positionIds = (await tx.position.findMany({ where: { resumeId }, select: { id: true } })).map((p: { id: string }) => p.id)
      if (positionIds.length > 0) {
        await tx.bullet.deleteMany({ where: { positionId: { in: positionIds } } })
      }
      await tx.position.deleteMany({ where: { resumeId } })

      // Create new positions + bullets from LLM output
      for (let i = 0; i < tailored.experience.length; i++) {
        const exp = tailored.experience[i]
        const position = await tx.position.create({
          data: {
            resumeId,
            company: exp.company,
            title: exp.title,
            location: exp.location ?? null,
            startDate: exp.startDate ?? null,
            endDate: exp.endDate ?? null,
            current: exp.current ?? false,
            hidden: false,
            sortOrder: i,
          },
        })
        if (exp.bullets.length > 0) {
          const bulletsHtml = `<ul>${exp.bullets.map((b: string) => `<li><p>${b}</p></li>`).join('')}</ul>`
          await tx.bullet.create({
            data: {
              positionId: position.id,
              content: bulletsHtml,
              hidden: false,
              sortOrder: 0,
            },
          })
        }
      }

      // Update repository visibility based on AI selection
      if (repositories.length > 0) {
        const selectedNames = new Set(
          Array.isArray(tailored.repositories)
            ? tailored.repositories.map((n: string) => n.toLowerCase())
            : []
        )
        for (let i = 0; i < (repositories as RepoRow[]).length; i++) {
          const repo = (repositories as RepoRow[])[i]
          const isSelected = selectedNames.has(repo.name.toLowerCase())
          await tx.resumeRepository.upsert({
            where: { resumeId_repositoryId: { resumeId, repositoryId: repo.id } },
            update: { hidden: !isSelected, sortOrder: isSelected ? i : 999 },
            create: { resumeId, repositoryId: repo.id, hidden: !isSelected, sortOrder: i },
          })
        }
      }
    })

    // 8. Record the tailor run for history tracking
    const runResult = {
      summaryGenerated: !!tailored.summary,
      skillCount: tailored.skills.length,
      positionCount: tailored.experience.length,
      repositoryCount: tailored.repositories?.length ?? 0,
    }
    await prisma.tailorRun.create({
      data: {
        resumeId,
        applicationId: application.id,
        company: application.company,
        role: application.role,
        ...runResult,
      },
    })

    return NextResponse.json({ data: runResult })
  } catch (error) {
    console.error('POST /api/resumes/[id]/tailor-from-library error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
