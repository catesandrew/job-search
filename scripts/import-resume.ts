#!/usr/bin/env ts-node
/**
 * Import a resume from an extracted text file into the database.
 *
 * Usage:
 *   npx ts-node scripts/import-resume.ts --email catesandrew@gmail.com --file ../generated/extracted/andrew-cates-resume.txt
 *   npx ts-node scripts/import-resume.ts --email catesandrew@gmail.com --file ../generated/extracted/andrew-cates-resume.txt --title "My Resume"
 *   npx ts-node scripts/import-resume.ts --email catesandrew@gmail.com --file ../generated/extracted/andrew-cates-resume.txt --overwrite
 */

import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'
import { PrismaClient, Prisma } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '../.env') })

const prisma = new PrismaClient()

// ── CLI args ─────────────────────────────────────────────────────────────────

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`)
  return idx !== -1 ? process.argv[idx + 1] : undefined
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`)
}

const email = arg('email')
const file = arg('file')
const titleOverride = arg('title')
const overwrite = flag('overwrite')

if (!email || !file) {
  console.error('Usage: npx ts-node scripts/import-resume.ts --email <email> --file <path> [--title <title>] [--overwrite]')
  process.exit(1)
}

// ── AI extraction ─────────────────────────────────────────────────────────────

interface ParsedResume {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  location: string | null
  linkedin: string | null
  website: string | null
  targetTitle: string | null
  summary: string | null
  positions: Array<{
    company: string
    title: string
    location: string | null
    startDate: string | null
    endDate: string | null
    current: boolean
    bullets: string[]
  }>
  skills: Array<{
    name: string
    skills: string
  }>
  education: Array<{
    institution: string
    degree: string | null
    startDate: string | null
    endDate: string | null
  }>
}

async function parseResumeText(text: string): Promise<ParsedResume> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const prompt = `Extract all resume data from the following text into this exact JSON format. Return ONLY the JSON object, no markdown, no prose.

{
  "firstName": "string",
  "lastName": "string",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null (city, state)",
  "linkedin": "string or null (full URL or handle)",
  "website": "string or null",
  "targetTitle": "string or null (most recent/prominent title)",
  "summary": "string or null",
  "positions": [
    {
      "company": "string",
      "title": "string",
      "location": "string or null",
      "startDate": "string or null (e.g. Jan 2020)",
      "endDate": "string or null (null if current)",
      "current": boolean,
      "bullets": ["string", ...]
    }
  ],
  "skills": [
    {
      "name": "string (category name e.g. Languages, Frameworks, Tools)",
      "skills": "string (comma-separated list)"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string or null",
      "startDate": "string or null",
      "endDate": "string or null"
    }
  ]
}

Rules:
- Extract ALL work experience positions in order (most recent first)
- For skills: if no categories exist, group them logically (Languages, Frameworks, Tools, etc.)
- Keep bullet points as-is from the text
- If a position has no end date and appears to be ongoing, set current: true and endDate: null
- Return valid JSON only

Resume text:
${text}`

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (response.choices[0].message.content ?? '').trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '')
  return JSON.parse(raw) as ParsedResume
}

// ── Import ────────────────────────────────────────────────────────────────────

async function main() {
  // Resolve paths
  const filePath = path.resolve(process.cwd(), file!)
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    process.exit(1)
  }

  // Find user
  const user = await prisma.user.findUnique({ where: { email: email! } })
  if (!user) {
    console.error(`User not found: ${email}`)
    const users = await prisma.user.findMany({ select: { email: true, name: true } })
    console.log('Available users:', users)
    process.exit(1)
  }
  console.log(`✓ User found: ${user.name} (${user.email})`)

  // Read file
  const text = fs.readFileSync(filePath, 'utf-8')
  const fileName = path.basename(filePath, path.extname(filePath))
  const title = titleOverride ?? (fileName
    .replace(/^andrew-cates-/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim() || 'Imported Resume')

  // Check for existing resume with same title
  if (!overwrite) {
    const existing = await prisma.resume.findFirst({ where: { userId: user.id, title } })
    if (existing) {
      console.error(`Resume "${title}" already exists. Use --overwrite to replace it, or --title to use a different title.`)
      process.exit(1)
    }
  }

  // Parse with AI
  console.log(`⏳ Parsing resume with AI…`)
  const parsed = await parseResumeText(text)
  console.log(`✓ Parsed: ${parsed.firstName} ${parsed.lastName}, ${parsed.positions.length} positions, ${parsed.skills.length} skill groups`)

  // Delete existing if overwriting
  if (overwrite) {
    const existing = await prisma.resume.findFirst({ where: { userId: user.id, title } })
    if (existing) {
      await prisma.resume.delete({ where: { id: existing.id } })
      console.log(`✓ Deleted existing resume "${title}"`)
    }
  }

  // Create resume + all relations in a transaction
  const resume = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const r = await tx.resume.create({
      data: {
        userId: user.id,
        title,
        type: 'BASE',
      },
    })

    // Profile
    await tx.profile.create({
      data: {
        resumeId: r.id,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email || user.email,
        phone: parsed.phone,
        location: parsed.location,
        linkedin: parsed.linkedin,
        website: parsed.website,
        targetTitle: parsed.targetTitle,
        summary: parsed.summary,
      },
    })

    // Positions + bullets
    for (let pi = 0; pi < parsed.positions.length; pi++) {
      const pos = parsed.positions[pi]
      const position = await tx.position.create({
        data: {
          resumeId: r.id,
          company: pos.company,
          title: pos.title,
          location: pos.location,
          startDate: pos.startDate,
          endDate: pos.endDate,
          current: pos.current,
          hidden: false,
          sortOrder: pi,
        },
      })

      for (let bi = 0; bi < pos.bullets.length; bi++) {
        await tx.bullet.create({
          data: {
            positionId: position.id,
            content: pos.bullets[bi],
            hidden: false,
            sortOrder: bi,
          },
        })
      }
    }

    // Skills
    for (let si = 0; si < parsed.skills.length; si++) {
      await tx.skillCategory.create({
        data: {
          resumeId: r.id,
          name: parsed.skills[si].name,
          skills: parsed.skills[si].skills,
          sortOrder: si,
        },
      })
    }

    // Education
    for (let ei = 0; ei < parsed.education.length; ei++) {
      const edu = parsed.education[ei]
      await tx.education.create({
        data: {
          resumeId: r.id,
          institution: edu.institution,
          degree: edu.degree,
          startDate: edu.startDate,
          endDate: edu.endDate,
          sortOrder: ei,
        },
      })
    }

    return r
  })

  console.log(`✓ Created resume "${title}" (id: ${resume.id})`)
  console.log(`  → http://localhost:3000/resumes/${resume.id}`)
}

main()
  .catch(err => { console.error('Error:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
