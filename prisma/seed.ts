import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface ParsedRole {
  company: string
  location: string
  title: string | null
  dates: string | null
  bullets: string[]
}

interface ParsedSkill {
  category: string
  skills: string[]
}

interface ParsedEducation {
  institution: string
  degree: string
  location: string
  year: string
}

interface ParsedResume {
  name: string
  contact: {
    location: string
    email: string
    phone: string
    linkedin: string
  }
  summary: string
  skills: ParsedSkill[]
  roles: ParsedRole[]
  education: ParsedEducation | null
}

function parseResumeMarkdown(markdown: string): ParsedResume {
  const lines = markdown.split(/\r?\n/)

  const result: ParsedResume = {
    name: '',
    contact: { location: '', email: '', phone: '', linkedin: '' },
    summary: '',
    skills: [],
    roles: [],
    education: null,
  }

  let currentSection: string | null = null
  let currentRole: ParsedRole | null = null
  let summaryLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // H1 — name
    if (i === 0 && trimmed.startsWith('# ')) {
      result.name = trimmed.replace(/^#\s+/, '')
      continue
    }

    // Contact line (line 3, index 2)
    if (i === 2 && trimmed) {
      const parts = trimmed.split('|').map((p) => p.trim())
      for (const part of parts) {
        if (part.includes('@')) {
          result.contact.email = part
        } else if (/\d{3}.*\d{4}/.test(part)) {
          result.contact.phone = part
        } else if (part.includes('linkedin')) {
          // Extract URL from markdown link if present
          const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/)
          result.contact.linkedin = linkMatch ? linkMatch[2] : part
        } else if (part.length > 0 && !part.startsWith('[')) {
          result.contact.location = part
        }
      }
      continue
    }

    // H2 — section header
    const sectionMatch = trimmed.match(/^##\s+(.+)$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1]
      currentRole = null
      continue
    }

    // H3 — company header: ### Company — Location
    const roleMatch = trimmed.match(/^###\s+(.+?)\s+[—–-]+\s+(.+)$/)
    if (roleMatch) {
      currentRole = {
        company: roleMatch[1],
        location: roleMatch[2],
        title: null,
        dates: null,
        bullets: [],
      }
      result.roles.push(currentRole)
      continue
    }

    // Title line: **Title** | Dates
    const titleMatch = trimmed.match(/^\*\*(.+?)\*\*\s+\|\s+(.+)$/)
    if (titleMatch && currentRole) {
      currentRole.title = titleMatch[1]
      currentRole.dates = titleMatch[2]
      continue
    }

    // Bullet: - text
    const bulletMatch = trimmed.match(/^-\s+(.+)$/)
    if (bulletMatch) {
      if (currentSection === 'Skills') {
        // Parse skill line: **Category:** skill1, skill2, ...
        const skillMatch = bulletMatch[1].match(/^\*\*(.+?):?\*\*:?\s+(.+)$/)
        if (skillMatch) {
          result.skills.push({
            category: skillMatch[1].replace(/:$/, ''),
            skills: skillMatch[2].split(',').map((s) => s.trim()),
          })
        }
      } else if (currentRole) {
        currentRole.bullets.push(bulletMatch[1])
      }
      continue
    }

    // Education line: **Education:** Institution — Degree, Year
    if (trimmed.startsWith('**Education:**')) {
      const eduText = trimmed.replace(/\*\*/g, '').replace('Education:', '').trim()
      // Pattern: "University of California, Irvine — B.S. Computer Science, 2001"
      const eduMatch = eduText.match(/^(.+?)\s+[—–-]+\s+(.+)$/)
      if (eduMatch) {
        const institution = eduMatch[1]
        const rest = eduMatch[2]
        const yearMatch = rest.match(/,\s*(\d{4})$/)
        const degree = yearMatch ? rest.replace(/,\s*\d{4}$/, '').trim() : rest
        const year = yearMatch ? yearMatch[1] : ''
        result.education = {
          institution,
          degree,
          location: '',
          year,
        }
      }
      continue
    }

    // Summary paragraphs (inside Professional Summary section, non-empty, non-heading, non-separator)
    if (
      currentSection === 'Professional Summary' &&
      trimmed &&
      !trimmed.startsWith('---') &&
      !trimmed.startsWith('#')
    ) {
      summaryLines.push(trimmed)
    }
  }

  result.summary = summaryLines.join(' ')

  return result
}

function parseDates(dateStr: string | null): { startDate: string; endDate: string; current: boolean } {
  if (!dateStr) return { startDate: '', endDate: '', current: false }
  const current = /present/i.test(dateStr)
  const parts = dateStr.split(/\s*[–—-]+\s*/)
  return {
    startDate: parts[0]?.trim() || '',
    endDate: current ? '' : (parts[1]?.trim() || ''),
    current,
  }
}

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@localhost'
  const password = process.env.ADMIN_PASSWORD || 'changeme123'
  const name = process.env.ADMIN_NAME || 'Andrew Cates'

  console.log('Seeding database...')

  // Create admin user
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  })
  console.log(`Admin user: ${user.email} (${user.id})`)

  // Read and parse resume.md
  const resumePath = path.resolve(__dirname, '../../resume.md')
  if (!fs.existsSync(resumePath)) {
    console.warn(`resume.md not found at ${resumePath}, skipping resume seed`)
    return
  }

  const markdown = fs.readFileSync(resumePath, 'utf8')
  const parsed = parseResumeMarkdown(markdown)
  console.log(`Parsed resume: ${parsed.name} — ${parsed.roles.length} roles, ${parsed.skills.length} skill categories`)

  // Delete existing base resumes for this user to avoid duplicates on re-seed
  await prisma.resume.deleteMany({
    where: { userId: user.id, type: 'BASE' },
  })

  // Create base resume
  const defaultSectionOrder = JSON.stringify([
    { name: 'summary', visible: true },
    { name: 'skills', visible: true },
    { name: 'experience', visible: true },
    { name: 'education', visible: true },
    { name: 'projects', visible: true },
  ])

  const resume = await prisma.resume.create({
    data: {
      userId: user.id,
      title: `${parsed.name} — Base Resume`,
      type: 'BASE',
      sectionOrder: defaultSectionOrder,
    },
  })
  console.log(`Resume created: ${resume.id}`)

  // Create profile
  const nameParts = parsed.name.split(' ')
  const firstName = nameParts[0] || ''
  const lastName = nameParts.slice(1).join(' ') || ''

  await prisma.profile.create({
    data: {
      resumeId: resume.id,
      firstName,
      lastName,
      email: parsed.contact.email,
      phone: parsed.contact.phone,
      location: parsed.contact.location,
      linkedin: parsed.contact.linkedin,
      targetTitle: 'Staff Engineer',
      summary: parsed.summary,
    },
  })
  console.log('Profile created')

  // Create positions with bullets
  for (let i = 0; i < parsed.roles.length; i++) {
    const role = parsed.roles[i]
    const dates = parseDates(role.dates)

    const position = await prisma.position.create({
      data: {
        resumeId: resume.id,
        company: role.company,
        title: role.title || '',
        location: role.location,
        startDate: dates.startDate,
        endDate: dates.endDate,
        current: dates.current,
        sortOrder: i,
      },
    })

    for (let j = 0; j < role.bullets.length; j++) {
      await prisma.bullet.create({
        data: {
          positionId: position.id,
          content: role.bullets[j],
          sortOrder: j,
        },
      })
    }
    console.log(`Position: ${role.company} — ${role.title} (${role.bullets.length} bullets)`)
  }

  // Create skill categories
  for (let i = 0; i < parsed.skills.length; i++) {
    const skill = parsed.skills[i]
    await prisma.skillCategory.create({
      data: {
        resumeId: resume.id,
        name: skill.category,
        skills: JSON.stringify(skill.skills),
        sortOrder: i,
      },
    })
  }
  console.log(`${parsed.skills.length} skill categories created`)

  // Create education
  if (parsed.education) {
    await prisma.education.create({
      data: {
        resumeId: resume.id,
        institution: parsed.education.institution,
        degree: parsed.education.degree,
        location: parsed.education.location,
        endDate: parsed.education.year,
      },
    })
    console.log('Education created')
  }

  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
