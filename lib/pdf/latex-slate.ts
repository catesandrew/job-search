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

/**
 * Slate section heading: colored bold label on the left with a colored dotted
 * rule extending to the right margin — inspired by Moderncv "classic" style.
 */
function slateSection(title: string): string {
  return [
    `\\vspace{10pt}`,
    `\\noindent{\\large\\bfseries\\color{slateaccent} ${e(title)}}`,
    `\\hspace{6pt}{\\color{slateaccent!50}\\leaders\\hrule height 0.4pt\\hfill\\kern 0pt}`,
    `\\par\\vspace{4pt}`,
  ].join('\n')
}

const ITEM_LIST = '[leftmargin=1.2em, noitemsep, topsep=2pt, parsep=0pt, partopsep=0pt]'

function itemize(items: string[]): string {
  return `\\begin{itemize}${ITEM_LIST}\n${items.map(i => `  \\item ${i}`).join('\n')}\n\\end{itemize}`
}

export function generateLatexSlateResume(resume: Resume): string {
  const profile = resume.identity ?? resume.profile
  const name = profile
    ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim()
    : e(resume.title)

  const positions = (resume.positions ?? [])
    .filter(p => !p.hidden)
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const skills = (resume.skills ?? []).sort((a, b) => a.sortOrder - b.sortOrder)
  const education = (resume.education ?? []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const projects = (resume.projects ?? []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const repositories = (resume.resumeRepositories ?? [])
    .filter(rr => !rr.hidden)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const sectionOrder = (resume.sectionOrder ?? []).filter(s => s.visible !== false)

  const sectionBodies: Record<string, string> = {
    summary: renderSummary(resume),
    skills: renderSkills(skills),
    experience: renderExperience(positions),
    education: renderEducation(education),
    projects: renderProjects(projects),
    repositories: renderRepositories(repositories),
  }

  const body = sectionOrder
    .map(s => sectionBodies[s.name.toLowerCase()])
    .filter(Boolean)
    .join('\n')

  // Build right-column contact lines
  const contactLines = [
    profile?.email ? `\\href{mailto:${e(profile.email)}}{${e(profile.email)}}` : null,
    formatPhone(profile?.phone) ? e(formatPhone(profile?.phone)) : null,
    profile?.location ? e(profile.location) : null,
    profile?.linkedin
      ? `\\href{${escapeUrl(profile.linkedin)}}{${e(profile.linkedin)}}`
      : null,
    profile?.website
      ? `\\href{${escapeUrl(profile.website)}}{${e(profile.website)}}`
      : null,
  ].filter(Boolean)

  const contactBlock = contactLines.join('\\\\[1pt]\n    ')

  // Optional tagline beneath the name
  const tagline = (profile as { tagline?: string } | undefined)?.tagline
    ?? (resume as { tagline?: string }).tagline
    ?? ''
  const taglineLine = tagline
    ? `\\\\[4pt]\n    {\\small\\color{slategray}${e(tagline)}}`
    : ''

  return `\\documentclass[10pt,letterpaper]{article}
\\usepackage[top=0.5in,bottom=0.6in,left=0.65in,right=0.65in]{geometry}
\\usepackage{mathpazo}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage{microtype}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{fancyhdr}
\\usepackage{graphicx}

% ── Palette ──────────────────────────────────────────────────────────────────
\\definecolor{slateaccent}{HTML}{1e3a5f}
\\definecolor{slategray}{HTML}{666666}

% ── Hyperref ─────────────────────────────────────────────────────────────────
\\hypersetup{
  colorlinks=true,
  urlcolor=slateaccent,
  linkcolor=slateaccent,
  citecolor=slateaccent,
}

% ── Page style ───────────────────────────────────────────────────────────────
\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\fancyfoot[R]{\\footnotesize\\color{slategray}\\thepage}

\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}
\\widowpenalty=10000
\\clubpenalty=10000

\\begin{document}

% ── Header ───────────────────────────────────────────────────────────────────
\\begin{minipage}[b]{0.60\\textwidth}
  {\\Huge\\bfseries\\color{slateaccent} ${e(name)}}${taglineLine}
\\end{minipage}%
\\hfill%
\\begin{minipage}[b]{0.38\\textwidth}\\raggedleft
  {\\footnotesize\\color{slategray}
    ${contactBlock}
  }
\\end{minipage}

\\vspace{6pt}
{\\color{slateaccent}\\rule{\\linewidth}{1pt}}

${body}
\\end{document}
`
}

// ── Section renderers ─────────────────────────────────────────────────────────

function renderSummary(resume: Resume): string {
  const summary = resume.profile?.summary
  if (!summary) return ''
  return `
${slateSection('Summary')}
{\\small ${htmlToLatex(summary)}}
`
}

function renderSkills(skills: NonNullable<Resume['skills']>): string {
  if (!skills.length) return ''
  const lines = skills
    .map(s =>
      `{\\color{slateaccent}\\bfseries ${e(s.name)}:} ${parseSkills(s.skills).map(e).join(', ')}`
    )
    .join('\\\\\n')
  return `
${slateSection('Skills')}
{\\small ${lines}}
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

    const dateStr = formatDateRange(p.startDate, p.endDate, p.current)
    return `\\noindent{\\color{slateaccent}\\bfseries ${e(p.company)}} \\hfill {\\footnotesize\\color{slategray}${e(p.location ?? '')}}\\\\*
{\\itshape ${e(p.title ?? '')}} \\hfill {\\footnotesize\\color{slategray}${dateStr}}
${bulletList}`
  }).join('\n\\vspace{7pt}\n')

  return `
${slateSection('Experience')}
${items}
`
}

function renderEducation(education: NonNullable<Resume['education']>): string {
  if (!education.length) return ''
  const items = education.map(edu => {
    const dateStr = formatDateRange(edu.startDate, edu.endDate, edu.current)
    const degreeLine = edu.degree ? `{\\itshape ${e(edu.degree)}}` : ''
    return `\\noindent{\\color{slateaccent}\\bfseries ${e(edu.institution)}} \\hfill {\\footnotesize\\color{slategray}${dateStr}}${degreeLine ? `\\\\*\n${degreeLine}` : ''}`
  }).join('\n\\vspace{6pt}\n')

  return `
${slateSection('Education')}
${items}
`
}

function renderProjects(projects: NonNullable<Resume['projects']>): string {
  if (!projects.length) return ''
  const items = projects.map(p => {
    const dateStr = formatDateRange(p.startDate, p.endDate, p.current)
    const linkPart = p.link
      ? ` {\\footnotesize\\color{slategray}--- \\href{${escapeUrl(p.link)}}{${e(p.link)}}}`
      : ''
    const achievementItems = p.achievements ? extractListItems(p.achievements) : null
    const achievementsLatex = achievementItems
      ? itemize(achievementItems)
      : (p.achievements ? htmlToLatex(p.achievements) : '')
    return `\\noindent{\\color{slateaccent}\\bfseries ${e(p.name)}}${linkPart} \\hfill {\\footnotesize\\color{slategray}${dateStr}}
${achievementsLatex}`
  }).join('\n\\vspace{6pt}\n')

  return `
${slateSection('Projects')}
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
    const metaPart = meta ? ` \\hfill {\\footnotesize\\color{slategray}${meta}}` : ''
    const descPart = desc ? `\\\\*\n{\\small\\color{slategray}${desc}}` : ''
    return `\\noindent{\\color{slateaccent}\\bfseries ${url}}${metaPart}${descPart}\\par`
  }).join('\\vspace{4pt}\n')

  return `
${slateSection('Repositories')}
${items}
`
}
