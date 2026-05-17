import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

const VALID_STATUSES = new Set(['WISHLIST', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED'])

function toStatus(s: string): 'WISHLIST' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED' {
  const up = (s ?? '').toUpperCase()
  return VALID_STATUSES.has(up)
    ? (up as 'WISHLIST' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED')
    : 'WISHLIST'
}

// Minimal RFC 4180-compliant CSV parser
function parseCSV(text: string): Record<string, string>[] {
  const lines: string[] = []
  let cur = ''
  let inQuote = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuote && text[i + 1] === '"') { cur += '"'; i++ }
      else inQuote = !inQuote
    } else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (cur.length || lines.length) lines.push(cur)
      cur = ''
      if (ch === '\r' && text[i + 1] === '\n') i++
    } else {
      cur += ch
    }
  }
  if (cur) lines.push(cur)

  if (lines.length < 2) return []

  function splitRow(row: string): string[] {
    const fields: string[] = []
    let field = ''
    let q = false
    for (let i = 0; i < row.length; i++) {
      const ch = row[i]
      if (ch === '"') {
        if (q && row[i + 1] === '"') { field += '"'; i++ }
        else q = !q
      } else if (ch === ',' && !q) {
        fields.push(field); field = ''
      } else {
        field += ch
      }
    }
    fields.push(field)
    return fields
  }

  const headers = splitRow(lines[0])
  return lines.slice(1).map((line) => {
    const values = splitRow(line)
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (values[i] ?? '').trim()]))
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function importApplications(rows: Record<string, string>[], userId: string): Promise<number> {
  let count = 0
  for (const row of rows) {
    if (!row.company || !row.role) continue
    await prisma.application.create({
      data: {
        userId,
        company: row.company,
        role: row.role,
        status: toStatus(row.status ?? ''),
        location: row.location || null,
        remote: row.remote === 'true',
        salaryMin: row.salaryMin ? parseInt(row.salaryMin) || null : null,
        salaryMax: row.salaryMax ? parseInt(row.salaryMax) || null : null,
        salaryFreq: row.salaryFreq || null,
        jobUrl: row.jobUrl || null,
        companyUrl: row.companyUrl || null,
        notes: row.notes || null,
      },
    })
    count++
  }
  return count
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function importResumes(resumes: any[], userId: string): Promise<number> {
  let count = 0
  for (const resume of resumes) {
    if (!resume.title) continue

    const created = await prisma.resume.create({
      data: {
        userId,
        title: resume.title,
        type: resume.type ?? 'BASE',
        templateId: resume.templateId ?? 'harvard',
        fontFamily: resume.fontFamily ?? 'Garamond',
        fontSize: resume.fontSize ?? 'medium',
        lineHeight: resume.lineHeight ?? 'standard',
        sectionTitleCasing: resume.sectionTitleCasing ?? 'capitalized',
        dateFormat: resume.dateFormat ?? 'short',
        marginH: resume.marginH ?? 'standard',
        marginV: resume.marginV ?? 'standard',
        pageSize: resume.pageSize ?? 'letter',
        sectionOrder: resume.sectionOrder ?? undefined,
      },
    })

    if (resume.profile) {
      await prisma.profile.create({
        data: {
          resumeId: created.id,
          firstName: resume.profile.firstName ?? '',
          lastName: resume.profile.lastName ?? '',
          email: resume.profile.email ?? '',
          phone: resume.profile.phone ?? null,
          location: resume.profile.location ?? null,
          linkedin: resume.profile.linkedin ?? null,
          website: resume.profile.website ?? null,
          targetTitle: resume.profile.targetTitle ?? null,
          summary: resume.profile.summary ?? null,
        },
      })
    }

    for (const pos of resume.positions ?? []) {
      const createdPos = await prisma.position.create({
        data: {
          resumeId: created.id,
          company: pos.company ?? '',
          companyDesc: pos.companyDesc ?? null,
          title: pos.title ?? '',
          location: pos.location ?? null,
          startDate: pos.startDate ?? null,
          endDate: pos.endDate ?? null,
          current: !!pos.current,
          hidden: !!pos.hidden,
          sortOrder: pos.sortOrder ?? 0,
        },
      })
      for (const bullet of pos.bullets ?? []) {
        await prisma.bullet.create({
          data: {
            positionId: createdPos.id,
            content: bullet.content ?? '',
            hidden: !!bullet.hidden,
            sortOrder: bullet.sortOrder ?? 0,
          },
        })
      }
    }

    for (const skill of resume.skills ?? []) {
      await prisma.skillCategory.create({
        data: {
          resumeId: created.id,
          name: skill.name ?? '',
          skills: skill.skills ?? '',
          sortOrder: skill.sortOrder ?? 0,
        },
      })
    }

    for (const edu of resume.education ?? []) {
      await prisma.education.create({
        data: {
          resumeId: created.id,
          institution: edu.institution ?? '',
          degree: edu.degree ?? null,
          location: edu.location ?? null,
          startDate: edu.startDate ?? null,
          endDate: edu.endDate ?? null,
          current: !!edu.current,
          achievements: edu.achievements ?? null,
        },
      })
    }

    for (const proj of resume.projects ?? []) {
      await prisma.project.create({
        data: {
          resumeId: created.id,
          name: proj.name ?? '',
          link: proj.link ?? null,
          startDate: proj.startDate ?? null,
          endDate: proj.endDate ?? null,
          current: !!proj.current,
          achievements: proj.achievements ?? null,
        },
      })
    }

    count++
  }
  return count
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const isCSV = file.name.endsWith('.csv') || file.type === 'text/csv'

    let appsImported = 0
    let resumesImported = 0

    if (isCSV) {
      const rows = parseCSV(text)
      appsImported = await importApplications(rows, userId)
    } else {
      let data: Record<string, unknown>
      try {
        data = JSON.parse(text)
      } catch {
        return NextResponse.json({ error: 'Invalid JSON file' }, { status: 400 })
      }

      if (Array.isArray(data.applications)) {
        appsImported = await importApplications(
          data.applications as Record<string, string>[],
          userId
        )
      }
      if (Array.isArray(data.resumes)) {
        resumesImported = await importResumes(data.resumes, userId)
      }
    }

    return NextResponse.json({
      data: { appsImported, resumesImported },
      message: `Imported ${appsImported} application${appsImported !== 1 ? 's' : ''} and ${resumesImported} resume${resumesImported !== 1 ? 's' : ''}`,
    })
  } catch (error) {
    console.error('POST /api/import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
