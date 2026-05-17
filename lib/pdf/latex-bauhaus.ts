import escapeLatex from 'escape-latex'
import type { Resume } from '@/hooks/use-resume'
import { htmlToLatex, extractListItems } from './html-to-latex'
import { escapeUrl, formatPhone } from './utils'

function e(s: string | null | undefined): string {
  return escapeLatex(s ?? '')
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

/** Left column section heading: footnotesize bold uppercase tracked label + thin gray rule */
function bauLeftSection(title: string): string {
  return [
    `\\vspace{8pt}`,
    `{\\footnotesize\\bfseries\\textls[100]{\\MakeUppercase{${e(title)}}}}\\par\\vspace{1pt}`,
    `{\\color{baugray}\\rule{\\linewidth}{0.4pt}}\\vspace{3pt}`,
  ].join('\n')
}

/** Right column section heading: small bold uppercase tracked label + dark accent rule */
function bauRightSection(title: string): string {
  return [
    `\\vspace{8pt}`,
    `{\\small\\bfseries\\textls[80]{\\MakeUppercase{${e(title)}}}}\\par\\vspace{-2pt}`,
    `{\\color{bauaccent}\\rule{\\linewidth}{1pt}}\\vspace{4pt}`,
  ].join('\n')
}

const ITEM_LIST = '[leftmargin=1.2em, noitemsep, topsep=2pt, parsep=0pt, partopsep=0pt]'

function itemize(items: string[]): string {
  return `\\begin{itemize}${ITEM_LIST}\n${items.map(i => `  \\item ${i}`).join('\n')}\n\\end{itemize}`
}

export function generateLatexBauhausResume(resume: Resume): string {
  const profile = resume.identity ?? resume.profile
  const name = profile
    ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
    : e(resume.title)

  const contactParts = [
    profile?.email,
    formatPhone(profile?.phone),
    profile?.location,
    profile?.linkedin,
    profile?.website,
  ].filter(Boolean) as string[]

  const sectionOrder = (resume.sectionOrder ?? []).filter(s => s.visible !== false)
  const positions = (resume.positions ?? [])
    .filter(p => !p.hidden)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const skills = (resume.skills ?? []).sort((a, b) => a.sortOrder - b.sortOrder)
  const education = (resume.education ?? []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const projects = (resume.projects ?? []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const repositories = (resume.resumeRepositories ?? [])
    .filter(rr => !rr.hidden)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  // Right column section renderers (skills go left)
  const rightSectionBodies: Record<string, string> = {
    summary: renderSummary(resume),
    experience: renderExperience(positions),
    education: renderEducation(education),
    projects: renderProjects(projects),
    repositories: renderRepositories(repositories),
  }

  // Right column: all sections from sectionOrder except skills
  const rightBody = sectionOrder
    .filter(s => s.name.toLowerCase() !== 'skills')
    .map(s => rightSectionBodies[s.name.toLowerCase()])
    .filter(Boolean)
    .join('\n')

  // Left column skills content
  const leftSkills = renderLeftSkills(skills)

  // Left column contact lines
  const contactLines = contactParts
    .map(v => `{\\color{baugray}\\scriptsize ${e(v)}}\\par\\vspace{1pt}`)
    .join('\n')

  return `\\documentclass[10pt,letterpaper]{article}
\\usepackage[top=0.4in,bottom=0.4in,left=0.55in,right=0.55in]{geometry}
\\usepackage{fontspec}
\\IfFontExistsTF{Helvetica Neue}{\\setmainfont{Helvetica Neue}}{%
  \\IfFontExistsTF{Arial}{\\setmainfont{Arial}}{%
    \\setmainfont{TeX Gyre Heros}}}
\\usepackage{paracol}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{xcolor}
\\usepackage{microtype}
\\usepackage{fancyhdr}
\\usepackage{letterspacing}

\\definecolor{bauaccent}{HTML}{1a1a1a}
\\definecolor{baugray}{HTML}{888888}
\\definecolor{bausidebar}{HTML}{f5f5f5}
\\definecolor{bausidetext}{HTML}{333333}
\\definecolor{linkblue}{HTML}{2563EB}
\\hypersetup{colorlinks=true,urlcolor=linkblue,linkcolor=black,citecolor=black}

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\cfoot{\\thepage}

\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}
\\widowpenalty=10000
\\clubpenalty=10000

\\columnratio{0.27}
\\setlength{\\columnsep}{12pt}
\\backgroundcolor{c[0]}{bausidebar}

\\begin{document}

\\begin{paracol}{2}

%% ── LEFT COLUMN ────────────────────────────────────────────────────────────────
\\color{bausidetext}
\\vspace{4pt}
{\\fontsize{16}{20}\\selectfont\\bfseries ${e(name)}}\\par
\\vspace{6pt}
${contactLines}
${leftSkills}

\\switchcolumn

%% ── RIGHT COLUMN ───────────────────────────────────────────────────────────────
\\vspace{4pt}
${rightBody}

\\end{paracol}

\\end{document}
`
}

function renderSummary(resume: Resume): string {
  const summary = resume.profile?.summary
  if (!summary) return ''
  return `
${bauRightSection('Summary')}
{\\small ${htmlToLatex(summary)}}
`
}

function renderLeftSkills(skills: NonNullable<Resume['skills']>): string {
  if (!skills.length) return ''
  return skills.map(s => {
    const items = parseSkills(s.skills).map(e).join(', ')
    return `
${bauLeftSection(s.name)}
{\\scriptsize\\color{bausidetext}${items}}\\par`
  }).join('\n')
}

function renderExperience(positions: NonNullable<Resume['positions']>): string {
  if (!positions.length) return ''
  const items = positions.map(p => {
    const visibleBullets = (p.bullets ?? [])
      .filter(b => !b.hidden)
      .sort((a, b) => a.sortOrder - b.sortOrder)
    const allItems = visibleBullets.flatMap(b => {
      const listItems = extractListItems(b.content)
      return listItems ?? [htmlToLatex(b.content)]
    }).filter(s => s.length > 0)
    const bulletList = allItems.length ? itemize(allItems) : ''
    return `\\textbf{${e(p.company)}} \\hfill {\\color{baugray}${e(p.location ?? '')}}\\\\*
{\\small ${e(p.title ?? '')}} \\hfill {\\color{baugray}\\small ${formatDateRange(p.startDate, p.endDate, p.current)}}
${bulletList}`
  }).join('\n\\vspace{6pt}\n')

  return `
${bauRightSection('Experience')}
${items}
`
}

function renderEducation(education: NonNullable<Resume['education']>): string {
  if (!education.length) return ''
  const items = education.map(edu => {
    const dateStr = formatDateRange(edu.startDate, edu.endDate, edu.current)
    return `\\textbf{${e(edu.institution)}} \\hfill {\\color{baugray}\\small ${dateStr}}\\\\*
${edu.degree ? `{\\small ${e(edu.degree)}}` : ''}`
  }).join('\n\\vspace{6pt}\n')

  return `
${bauRightSection('Education')}
${items}
`
}

function renderProjects(projects: NonNullable<Resume['projects']>): string {
  if (!projects.length) return ''
  const items = projects.map(p => {
    const dateStr = formatDateRange(p.startDate, p.endDate, p.current)
    const linkPart = p.link ? ` --- \\href{${escapeUrl(p.link)}}{${e(p.link)}}` : ''
    const achievementItems = p.achievements ? extractListItems(p.achievements) : null
    const achievementsLatex = achievementItems
      ? itemize(achievementItems)
      : (p.achievements ? htmlToLatex(p.achievements) : '')
    return `\\textbf{${e(p.name)}}${linkPart} \\hfill {\\color{baugray}\\small ${dateStr}}\\\\*
${achievementsLatex}`
  }).join('\n\\vspace{6pt}\n')

  return `
${bauRightSection('Projects')}
${items}
`
}

function renderRepositories(repos: NonNullable<Resume['resumeRepositories']>): string {
  if (!repos.length) return ''
  const items = repos.map(rr => {
    const name = e(rr.nameOverride ?? rr.repository.name)
    const desc = e(rr.descriptionOverride ?? rr.repository.description ?? '')
    const metaParts: string[] = []
    if (rr.repository.language) metaParts.push(e(rr.repository.language))
    if (rr.repository.stars > 0) metaParts.push(`$\\star$\\ ${rr.repository.stars}`)
    const meta = metaParts.join(', ')
    const url = `\\href{${escapeUrl(rr.repository.url)}}{${name}}`
    const metaPart = meta ? ` \\hfill {\\color{baugray}\\small ${meta}}` : ''
    const descPart = desc ? `\\\\*\n{\\small\\color{baugray}${desc}}` : ''
    return `\\noindent\\textbf{${url}}${metaPart}${descPart}\\par`
  }).join('\\vspace{4pt}\n')

  return `
${bauRightSection('Repositories')}
${items}
`
}
