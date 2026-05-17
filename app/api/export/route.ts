import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/lib/session'

function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value).replace(/\r?\n/g, ' ')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'all'      // all | applications | resumes
    const format = searchParams.get('format') ?? 'json'  // json | csv
    const userId = session.user.id

    // ── CSV export (applications only) ─────────────────────────────────────
    if (format === 'csv') {
      const apps = await prisma.application.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })

      const headers = [
        'company', 'role', 'status', 'location', 'remote',
        'salaryMin', 'salaryMax', 'salaryFreq',
        'jobUrl', 'companyUrl', 'notes', 'createdAt',
      ]

      const rows = apps.map((a) => {
        const row: Record<string, unknown> = a
        return headers.map((h) => escapeCSVField(row[h])).join(',')
      })

      const csv = [headers.join(','), ...rows].join('\n')

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="applications.csv"',
        },
      })
    }

    // ── JSON export ─────────────────────────────────────────────────────────
    const [applications, resumes] = await Promise.all([
      type !== 'resumes'
        ? prisma.application.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
        : Promise.resolve([]),

      type !== 'applications'
        ? prisma.resume.findMany({
            where: { userId },
            include: {
              profile: true,
              positions: {
                include: { bullets: { orderBy: { sortOrder: 'asc' } } },
                orderBy: { sortOrder: 'asc' },
              },
              skills: { orderBy: { sortOrder: 'asc' } },
              education: true,
              projects: true,
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ])

    const payload: Record<string, unknown> = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
    }
    if (type !== 'resumes') payload.applications = applications
    if (type !== 'applications') payload.resumes = resumes

    const filename =
      type === 'all' ? 'jobsearch-backup' : type === 'resumes' ? 'resumes' : 'applications'

    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    })
  } catch (error) {
    console.error('GET /api/export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
