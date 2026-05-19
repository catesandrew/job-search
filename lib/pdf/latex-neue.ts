import escapeLatex from 'escape-latex'
import type { Resume } from '@/hooks/use-resume'
import { htmlToLatex, extractListItems } from './html-to-latex'
import { escapeUrl, formatPhone, displayUrl } from './utils'

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

/** Section heading: small semibold uppercase label + thin gray rule below */
function neueSection(title: string): string {
  return [
    `\\vspace{10pt}`,
    `{\\small\\bfseries\\MakeUppercase{${e(title)}}}\\par\\vspace{-2pt}`,
    `{\\color{neuerule}\\rule{\\linewidth}{0.4pt}}\\par\\vspace{4pt}`,
  ].join('\n')
}

const ITEM_LIST = '[leftmargin=1.2em, noitemsep, topsep=2pt, parsep=0pt, partopsep=0pt]'

function itemize(items: string[]): string {
  return `\\begin{itemize}${ITEM_LIST}\n${items.map(i => `  \\item ${i}`).join('\n')}\n\\end{itemize}`
}

export function generateLatexNeueResume(resume: Resume): string {
  const profile = resume.identity ?? resume.profile
  const name = profile
    ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
    : e(resume.title)

  const cdot = ' $\\cdot$ '
  const neuPersonal = [profile?.email, formatPhone(profile?.phone), profile?.location]
    .filter(Boolean).map(v => e(v)).join(cdot)
  const neuSocial = [
    profile?.linkedin ? displayUrl(profile.linkedin) : null,
    profile?.website ? displayUrl(profile.website) : null,
    profile?.github ? displayUrl(profile.github) : null,
  ].filter(Boolean).map(v => e(v)).join(cdot)
  const contactBlock = [neuPersonal, neuSocial].filter(Boolean).join('\\\\[1pt]\n')

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

  const sectionBodies: Record<string, string> = {
    summary: renderSummary(resume),
    skills: renderSkills(skills, resume.skillsFormat ?? 'labeled'),
    experience: renderExperience(positions),
    education: renderEducation(education),
    projects: renderProjects(projects),
    repositories: renderRepositories(repositories, resume.repoLinks ?? true),
  }

  const body = sectionOrder
    .map(s => sectionBodies[s.name.toLowerCase()])
    .filter(Boolean)
    .join('\n')

  return `\\documentclass[10pt,letterpaper]{article}
\\usepackage[top=0.5in,bottom=0.5in,left=0.6in,right=0.6in]{geometry}
\\usepackage{fontspec}
\\IfFontExistsTF{Helvetica Neue}{\\setmainfont{Helvetica Neue}}{%
  \\IfFontExistsTF{Arial}{\\setmainfont{Arial}}{%
    \\setmainfont{TeX Gyre Heros}}}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{xcolor}
\\usepackage{microtype}

\\definecolor{neuetext}{HTML}{555555}
\\definecolor{neuerule}{HTML}{cccccc}
\\definecolor{linkblue}{HTML}{2563EB}
\\hypersetup{colorlinks=true,urlcolor=linkblue,linkcolor=black,citecolor=black}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}
\\widowpenalty=10000
\\clubpenalty=10000

\\begin{document}

{\\fontsize{22}{26}\\selectfont\\bfseries ${e(name)}}\\par\\vspace{2pt}
{\\small\\color{neuetext}${contactBlock}}\\par
${body}
\\end{document}
`
}

function renderSummary(resume: Resume): string {
  const summary = resume.profile?.summary
  if (!summary) return ''
  return `
${neueSection('Summary')}
${htmlToLatex(summary)}
`
}

function renderSkills(skills: NonNullable<Resume['skills']>, format = 'labeled'): string {
  if (!skills.length) return ''
  let body: string
  if (format === 'flat') {
    body = skills.flatMap(s => parseSkills(s.skills)).map(e).join(', ')
  } else {
    const sep = format === 'inline' ? ' $\\cdot$ ' : ', '
    body = skills
      .map(s => `\\textbf{${e(s.name)}:} ${parseSkills(s.skills).map(e).join(sep)}`)
      .join('\\\\\n')
  }
  return `
${neueSection('Skills')}
${body}
`
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
    return `\\textbf{${e(p.company)}} \\hfill {\\color{neuetext}${e(p.location ?? '')}}\\\\*
${e(p.title ?? '')} \\hfill {\\color{neuetext}${formatDateRange(p.startDate, p.endDate, p.current)}}
${bulletList}`
  }).join('\n\\vspace{8pt}\n')

  return `
${neueSection('Experience')}
${items}
`
}

function renderEducation(education: NonNullable<Resume['education']>): string {
  if (!education.length) return ''
  const items = education.map(edu => {
    const dateStr = formatDateRange(edu.startDate, edu.endDate, edu.current)
    return `\\textbf{${e(edu.institution)}} \\hfill {\\color{neuetext}${dateStr}}\\\\*
${edu.degree ? e(edu.degree) : ''}`
  }).join('\n\\vspace{8pt}\n')

  return `
${neueSection('Education')}
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
    return `\\textbf{${e(p.name)}}${linkPart} \\hfill {\\color{neuetext}${dateStr}}\\\\*
${achievementsLatex}`
  }).join('\n\\vspace{8pt}\n')

  return `
${neueSection('Projects')}
${items}
`
}

function renderRepositories(repos: NonNullable<Resume['resumeRepositories']>, repoLinks: boolean): string {
  if (!repos.length) return ''
  const items = repos.map(rr => {
    const name = e(rr.nameOverride ?? rr.repository.name)
    const desc = e(rr.descriptionOverride ?? rr.repository.description ?? '')
    const metaParts: string[] = []
    if (rr.repository.language) metaParts.push(e(rr.repository.language))
    if (rr.repository.stars > 0) metaParts.push(`$\\star$\\ ${rr.repository.stars}`)
    const meta = metaParts.join(', ')
    const url = repoLinks ? `\\href{${escapeUrl(rr.repository.url)}}{${name}}` : name
    const metaPart = meta ? ` \\hfill {\\color{neuetext}${meta}}` : ''
    const descPart = desc ? `\\\\*\n{\\color{neuetext}${desc}}` : ''
    return `\\noindent\\textbf{${url}}${metaPart}${descPart}\\par`
  }).join('\\vspace{4pt}\n')

  return `
${neueSection('Open Source')}
${items}
`
}
