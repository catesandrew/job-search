import escapeLatex from 'escape-latex'
import type { Resume } from '@/hooks/use-resume'
import { htmlToLatex } from './html-to-latex'

function e(s: string | null | undefined): string {
  return escapeLatex(s ?? '')
}

function escapeUrl(url: string): string {
  return url.replace(/%/g, '\\%').replace(/#/g, '\\#')
}

function parseSkills(raw: string): string[] {
  try { return JSON.parse(raw) } catch { return raw.split(',').map(s => s.trim()) }
}

function formatDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  current: boolean | null | undefined,
): string {
  const start = e(startDate ?? '')
  const end = current ? 'Present' : e(endDate ?? '')
  return [start, end].filter(Boolean).join(' -- ')
}

export function generateLatexResume(resume: Resume): string {
  const profile = resume.identity ?? resume.profile
  const name = profile
    ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
    : e(resume.title)

  const contactParts = [
    profile?.email,
    profile?.phone,
    profile?.location,
    profile?.linkedin,
    profile?.website,
  ].filter(Boolean).map(v => e(v))
  const contactLine = contactParts.join(' $\\cdot$ ')

  const sectionOrder = (resume.sectionOrder ?? []).filter(s => s.visible !== false)
  const positions = (resume.positions ?? [])
    .filter(p => !p.hidden)
    .sort((a, b) => a.sortOrder - b.sortOrder)
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

\\titleformat{\\section}{\\normalsize\\bfseries\\uppercase}{}{0em}{}[\\vspace{-4pt}\\rule{\\linewidth}{0.4pt}]
\\titlespacing{\\section}{0pt}{10pt}{4pt}

\\begin{document}

\\begin{center}
  {\\Large\\textbf{${e(name)}}}\\\\[3pt]
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

function renderSkills(skills: NonNullable<Resume['skills']>): string {
  if (!skills.length) return ''
  const lines = skills
    .map(s => `\\textbf{${e(s.name)}:} ${parseSkills(s.skills).map(e).join(', ')}`)
    .join('\\\\[2pt]\n')
  return `
\\section{Skills}
${lines}
`
}

function renderExperience(positions: NonNullable<Resume['positions']>): string {
  if (!positions.length) return ''
  const items = positions.map(p => {
    const visibleBullets = (p.bullets ?? [])
      .filter(b => !b.hidden)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const bulletList = visibleBullets.length
      ? `\\begin{itemize}[leftmargin=1.2em,itemsep=1pt,parsep=0pt,topsep=2pt]\n${visibleBullets.map(b => `  \\item ${htmlToLatex(b.content)}`).join('\n')}\n\\end{itemize}`
      : ''
    return `\\textbf{${e(p.company)}} \\hfill ${e(p.location ?? '')}\\\\
\\textit{${e(p.title ?? '')}} \\hfill ${formatDateRange(p.startDate, p.endDate, p.current)}\\\\[2pt]
${bulletList}`
  }).join('\n\\vspace{4pt}\n')

  return `
\\section{Experience}
${items}
`
}

function renderEducation(education: NonNullable<Resume['education']>): string {
  if (!education.length) return ''
  const items = education.map(edu => {
    const dateStr = formatDateRange(edu.startDate, edu.endDate, edu.current)
    return `\\textbf{${e(edu.institution)}} \\hfill ${dateStr}\\\\
${edu.degree ? `${e(edu.degree)}\\\\` : ''}`
  }).join('\n\\vspace{4pt}\n')

  return `
\\section{Education}
${items}
`
}

function renderProjects(projects: NonNullable<Resume['projects']>): string {
  if (!projects.length) return ''
  const items = projects.map(p => {
    const dateStr = formatDateRange(p.startDate, p.endDate, p.current)
    const linkPart = p.link ? ` --- \\href{${escapeUrl(p.link)}}{${e(p.link)}}` : ''
    return `\\textbf{${e(p.name)}}${linkPart} \\hfill ${dateStr}\\\\
${p.achievements ? htmlToLatex(p.achievements) : ''}`
  }).join('\n\\vspace{4pt}\n')

  return `
\\section{Projects}
${items}
`
}
