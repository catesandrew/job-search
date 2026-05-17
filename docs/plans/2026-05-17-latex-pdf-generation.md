# LaTeX PDF Generation via Tectonic

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Puppeteer-based PDF generation with Tectonic-compiled LaTeX, producing professional-quality PDFs when running in Docker; fall back to Puppeteer on edge/serverless.

**Architecture:** A new `lib/pdf/latex-resume.ts` converts `Resume` data to a `.tex` string. `lib/pdf/tectonic.ts` writes that to a temp file, shells out to `tectonic`, reads back the PDF buffer, and cleans up. `generate-pdf.ts` probes for the `tectonic` binary at runtime and routes to the LaTeX path when available, otherwise keeps the existing Puppeteer path.

**Tech Stack:** Tectonic (XeLaTeX/pdfLaTeX engine), `escape-latex` npm package, Node `child_process.execFile`, `os.tmpdir()`, existing `Resume` type from `@/hooks/use-resume`.

---

## Task 1: Install `escape-latex`

**Files:**
- Modify: `package.json` (via npm)

**Step 1: Install**
```bash
cd /Volumes/dev-ssd/repos/personal/job-search
npm install escape-latex
npm install --save-dev @types/escape-latex   # types may not exist — skip if 404
```

**Step 2: Verify**
```bash
node -e "const e = require('escape-latex'); console.log(e('50% & <test>'))"
# Expected: 50\% \& <test>   (< > are safe in text mode)
```

**Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: add escape-latex dependency"
```

---

## Task 2: HTML → LaTeX converter utility

**Files:**
- Create: `lib/pdf/html-to-latex.ts`

**Step 1: Write the file**

```ts
// lib/pdf/html-to-latex.ts
import escapeLatex from 'escape-latex'

/**
 * Convert a fragment of rich-text HTML (from the resume editor) to LaTeX.
 * Handles <strong>, <em>, <a>, <br>, <p>, <ul>, <li>. All plain text is escaped.
 */
export function htmlToLatex(html: string): string {
  if (!html) return ''

  return html
    // Block elements → newlines first so we can escape inner text cleanly
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '')
    .replace(/<\/?ul[^>]*>/gi, '')
    // Inline markup — extract inner content, escape it, then wrap
    .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, (_, inner) =>
      `\\textbf{${escapeLatex(stripTags(inner))}}`)
    .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, (_, inner) =>
      `\\textbf{${escapeLatex(stripTags(inner))}}`)
    .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, (_, inner) =>
      `\\textit{${escapeLatex(stripTags(inner))}}`)
    .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, (_, inner) =>
      `\\textit{${escapeLatex(stripTags(inner))}}`)
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) =>
      `\\href{${href}}{${escapeLatex(stripTags(inner))}}`)
    // Strip any remaining tags, then escape plain text
    .replace(/<[^>]+>/g, '')
    .split('\n')
    .map(line => escapeLatex(line.trim()))
    .filter(line => line.length > 0)
    .join('\n')
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim()
}
```

**Step 2: Quick smoke test in node REPL**
```bash
node -e "
const { htmlToLatex } = require('./lib/pdf/html-to-latex.ts')
// Won't work raw — just verify it compiles in next build later
"
```
(Compilation verified in Task 6 type-check step.)

**Step 3: Commit**
```bash
git add lib/pdf/html-to-latex.ts
git commit -m "feat(pdf): add html-to-latex converter utility"
```

---

## Task 3: LaTeX resume template

**Files:**
- Create: `lib/pdf/latex-resume.ts`

This generates a complete `.tex` document from a `Resume` object. Uses `pdfLaTeX`-compatible packages only (`mathpazo`, `geometry`, `hyperref`, `enumitem`, `titlesec`, `microtype`) — no system fonts required; Tectonic auto-downloads from CTAN.

**Step 1: Write the file**

```ts
// lib/pdf/latex-resume.ts
import escapeLatex from 'escape-latex'
import type { Resume } from '@/hooks/use-resume'
import { htmlToLatex } from './html-to-latex'

function e(s: string | null | undefined): string {
  return escapeLatex(s ?? '')
}

function parseSkills(raw: string): string[] {
  try { return JSON.parse(raw) } catch { return raw.split(',').map(s => s.trim()) }
}

function formatDate(d: string | null | undefined, current: boolean): string {
  if (current) return 'Present'
  return e(d ?? '')
}

export function generateLatexResume(resume: Resume): string {
  const profile = resume.identity ?? resume.profile
  const name = profile ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() : e(resume.title)

  const contactParts = [
    profile?.email,
    profile?.phone,
    profile?.location,
    profile?.linkedin,
    profile?.website,
  ].filter(Boolean).map(e)
  const contactLine = contactParts.join(' $\\cdot$ ')

  const sectionOrder = (resume.sectionOrder ?? []).filter(s => s.visible)
  const positions = (resume.positions ?? []).filter(p => !p.hidden).sort((a, b) => a.sortOrder - b.sortOrder)
  const skills = (resume.skills ?? []).sort((a, b) => a.sortOrder - b.sortOrder)
  const education = (resume.education ?? []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const projects = (resume.projects ?? []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  const sectionBodies: Record<string, string> = {
    summary: renderSummary(resume),
    skills: renderSkills(skills),
    experience: renderExperience(positions),
    education: renderEducation(education),
    projects: renderProjects(projects),
  }

  const body = sectionOrder
    .map(s => sectionBodies[s.name.toLowerCase()])
    .filter(Boolean)
    .join('\n')

  return `\\documentclass[10pt,letterpaper]{article}
\\usepackage[top=0.5in,bottom=0.5in,left=0.75in,right=0.75in]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{mathpazo}
\\usepackage[hidelinks]{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{microtype}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}
\\setlength{\\itemsep}{0pt}

\\titleformat{\\section}{\\normalsize\\bfseries\\uppercase}{}{0em}{}[\\vspace{-4pt}\\rule{\\linewidth}{0.4pt}]
\\titlespacing{\\section}{0pt}{10pt}{4pt}

\\begin{document}

\\begin{center}
  {\\Large\\textbf{${name}}}\\\\[3pt]
  {\\small ${contactLine}}
\\end{center}

\\vspace{4pt}
${body}
\\end{document}
`
}

function renderSummary(resume: Resume): string {
  const summary = resume.profile?.summary
  if (!summary) return ''
  return `
\\section{Summary}
${htmlToLatex(summary)}
`
}

function renderSkills(skills: Resume['skills']): string {
  if (!skills?.length) return ''
  const lines = skills.map(s => `\\textbf{${e(s.name)}:} ${parseSkills(s.skills).map(e).join(', ')}`).join('\\\\[2pt]\n')
  return `
\\section{Skills}
${lines}
`
}

function renderExperience(positions: Resume['positions']): string {
  if (!positions?.length) return ''
  const items = positions.map(p => {
    const visibleBullets = (p.bullets ?? []).filter(b => !b.hidden).sort((a, b) => a.sortOrder - b.sortOrder)
    const bulletList = visibleBullets.length
      ? `\\begin{itemize}[leftmargin=1.2em,itemsep=1pt,parsep=0pt,topsep=2pt]\n${visibleBullets.map(b => `  \\item ${htmlToLatex(b.content)}`).join('\n')}\n\\end{itemize}`
      : ''
    return `\\textbf{${e(p.company)}} \\hfill ${e(p.location ?? '')}\\\\
\\textit{${e(p.title ?? '')}} \\hfill ${e(p.startDate ?? '')} -- ${formatDate(p.endDate, p.current ?? false)}\\\\[2pt]
${bulletList}`
  }).join('\n\\vspace{4pt}\n')

  return `
\\section{Experience}
${items}
`
}

function renderEducation(education: Resume['education']): string {
  if (!education?.length) return ''
  const items = education.map(edu => `\\textbf{${e(edu.institution)}} \\hfill ${formatDate(edu.endDate, edu.current ?? false)}\\\\
${edu.degree ? `${e(edu.degree)}\\\\` : ''}`).join('\n\\vspace{4pt}\n')

  return `
\\section{Education}
${items}
`
}

function renderProjects(projects: Resume['projects']): string {
  if (!projects?.length) return ''
  const items = projects.map(p => `\\textbf{${e(p.name)}}${p.link ? ` --- \\href{${p.link}}{${e(p.link)}}` : ''} \\hfill ${formatDate(p.endDate, p.current ?? false)}\\\\
${p.achievements ? htmlToLatex(p.achievements) : ''}`).join('\n\\vspace{4pt}\n')

  return `
\\section{Projects}
${items}
`
}
```

**Step 2: Commit**
```bash
git add lib/pdf/latex-resume.ts lib/pdf/html-to-latex.ts
git commit -m "feat(pdf): add LaTeX resume template generator"
```

---

## Task 4: Tectonic shell-out wrapper

**Files:**
- Create: `lib/pdf/tectonic.ts`

**Step 1: Write the file**

```ts
// lib/pdf/tectonic.ts
import { execFile, execFileSync } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'

const execFileAsync = promisify(execFile)

/** Returns true if the `tectonic` binary is on PATH. */
export async function isTectonicAvailable(): Promise<boolean> {
  try {
    execFileSync('tectonic', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Compile a LaTeX source string to PDF using Tectonic.
 * Writes to a temp file, runs tectonic, reads back the PDF, cleans up.
 */
export async function compileTex(source: string): Promise<Buffer> {
  const id = randomUUID()
  const texPath = join(tmpdir(), `resume-${id}.tex`)
  const pdfPath = join(tmpdir(), `resume-${id}.pdf`)

  await writeFile(texPath, source, 'utf8')

  try {
    await execFileAsync('tectonic', [
      '-X', 'compile',
      '--engine', 'pdflatex',
      '--outfmt', 'pdf',
      '--outdir', tmpdir(),
      '--untrusted',
      texPath,
    ])

    const pdf = await readFile(pdfPath)
    return pdf
  } finally {
    await Promise.allSettled([unlink(texPath), unlink(pdfPath)])
  }
}
```

**Step 2: Commit**
```bash
git add lib/pdf/tectonic.ts
git commit -m "feat(pdf): add tectonic shell-out wrapper"
```

---

## Task 5: Wire into `generate-pdf.ts`

**Files:**
- Modify: `lib/pdf/generate-pdf.ts`

**Step 1: Replace the function body**

```ts
// lib/pdf/generate-pdf.ts
import React from 'react'
import type { Resume } from '@/hooks/use-resume'
import { HarvardTemplate } from '@/components/resumes/preview/templates/harvard'
import { NeueTemplate } from '@/components/resumes/preview/templates/neue'
import { OxfordTemplate } from '@/components/resumes/preview/templates/oxford'
import { BauhausTemplate } from '@/components/resumes/preview/templates/bauhaus'
import { ChicagoTemplate } from '@/components/resumes/preview/templates/chicago'
import { MillerTemplate } from '@/components/resumes/preview/templates/miller'
import { generateLatexResume } from './latex-resume'
import { isTectonicAvailable, compileTex } from './tectonic'

function getTemplateElement(resume: Resume): React.ReactElement {
  switch (resume.templateId) {
    case 'neue':    return React.createElement(NeueTemplate,    { resume, scale: 1 })
    case 'oxford':  return React.createElement(OxfordTemplate,  { resume, scale: 1 })
    case 'bauhaus': return React.createElement(BauhausTemplate, { resume, scale: 1 })
    case 'chicago': return React.createElement(ChicagoTemplate, { resume, scale: 1 })
    case 'miller':  return React.createElement(MillerTemplate,  { resume, scale: 1 })
    default:        return React.createElement(HarvardTemplate, { resume, scale: 1 })
  }
}

export async function generateResumePdf(resume: Resume): Promise<Buffer> {
  // Use LaTeX/Tectonic when available (Docker), otherwise fall back to Puppeteer
  if (await isTectonicAvailable()) {
    const source = generateLatexResume(resume)
    return compileTex(source)
  }

  // Puppeteer fallback (edge / serverless)
  const { renderToStaticMarkup } = await import('react-dom/server')
  const bodyHtml = renderToStaticMarkup(getTemplateElement(resume))

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; }
    body > div { box-shadow: none !important; }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`

  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.default.launch({ headless: true })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 816, height: 1056 })
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({
      width: '816px',
      height: '1056px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
```

**Step 2: Type-check**
```bash
npx tsc --noEmit 2>&1
# Expected: no output (no errors)
```

**Step 3: Commit**
```bash
git add lib/pdf/generate-pdf.ts
git commit -m "feat(pdf): route to LaTeX/Tectonic when available, Puppeteer fallback"
```

---

## Task 6: Dockerfile

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

**Step 1: Write Dockerfile**

```dockerfile
# Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

# Install tectonic
RUN apk add --no-cache curl fontconfig freetype harfbuzz \
  && curl -fsSL https://drop-sh.fullyjustified.net | sh \
  && mv tectonic /usr/local/bin/tectonic \
  && tectonic --version

# Persist Tectonic's CTAN package cache across restarts
VOLUME ["/root/.cache/Tectonic"]

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

**Step 2: Write .dockerignore**

```
node_modules
.next
.git
*.md
docs/
```

> **Note:** The `curl -fsSL https://drop-sh.fullyjustified.net | sh` script is the official Tectonic installer. For production, pin to a specific release URL from the [Tectonic GitHub releases](https://github.com/tectonic-typesetting/tectonic/releases) instead.

> **Note on `output: 'standalone'`:** If `next.config.ts` doesn't have `output: 'standalone'`, the Dockerfile's `server.js` copy won't exist. Either add it to the config or replace the CMD with `npm start`.

**Step 3: Check next.config.ts for standalone output**
```bash
grep -i standalone next.config.ts || echo "not set — may need to add output: 'standalone'"
```

**Step 4: Commit**
```bash
git add Dockerfile .dockerignore
git commit -m "feat: add Dockerfile with Tectonic for LaTeX PDF generation"
```

---

## Task 7: Manual end-to-end test (Docker)

**Step 1: Build the image**
```bash
docker build -t job-search-app .
```

**Step 2: Run**
```bash
docker run -p 3000:3000 -v tectonic-cache:/root/.cache/Tectonic job-search-app
```

**Step 3: Download a resume PDF**

Navigate to `http://localhost:3000/resumes/<id>/edit` and click the download button.

Expected: PDF opens cleanly with professional LaTeX typography. First run may be slow (~30s) while Tectonic downloads `mathpazo`, `geometry`, etc. from CTAN — subsequent runs are fast from cache.

**Step 4: Verify fallback (optional)**

Temporarily rename tectonic: `mv /usr/local/bin/tectonic /usr/local/bin/tectonic.bak` inside the container, download again — should fall back to Puppeteer without error.

---

## Notes

- **Tectonic cache volume:** Always mount `/root/.cache/Tectonic` as a named volume. Without it, Tectonic re-downloads packages on every container restart.
- **`--untrusted` flag:** Prevents the compiled `.tex` from calling shell commands via `\write18`. Critical since bullet content comes from user input.
- **Special characters:** `escape-latex` handles `& % $ # _ { } ~ ^ \`. HTML angle brackets (`< >`) are safe in pdfLaTeX text mode. URLs in `\href` are passed through unescaped — valid since they come from the profile fields which should already be valid URLs.
- **Skills field:** Stored as a JSON array string in the DB; `parseSkills()` handles both JSON and comma-separated fallback.
