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

/**
 * Crisp section heading: full-width dark colored band with white uppercase text.
 * Creates a dramatic, bold visual break between resume sections.
 */
function crispSection(title: string): string {
  return [
    `\\vspace{6pt}`,
    `\\noindent\\setlength{\\fboxsep}{4pt}%`,
    `\\colorbox{crispaccent}{\\makebox[\\linewidth-2\\fboxsep][l]{%`,
    `  \\color{white}\\small\\bfseries\\MakeUppercase{${e(title)}}%`,
    `}}\\par\\vspace{4pt}`,
  ].join('\n')
}

const ITEM_LIST = '[leftmargin=1.2em, noitemsep, topsep=2pt, parsep=0pt, partopsep=0pt]'

function itemize(items: string[]): string {
  return `\\begin{itemize}${ITEM_LIST}\n${items.map(i => `  \\item ${i}`).join('\n')}\n\\end{itemize}`
}

export function generateLatexCrispResume(resume: Resume): string {
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

  // Build inline contact string for the header band
  const bullet = ' \\enspace\\textbullet\\enspace '
  const crispPersonal = [
    profile?.email ? `\\href{mailto:${e(profile.email)}}{${e(profile.email)}}` : null,
    formatPhone(profile?.phone) ? e(formatPhone(profile?.phone)) : null,
    profile?.location ? e(profile.location) : null,
  ].filter(Boolean).join(bullet)
  const crispSocial = [
    profile?.linkedin
      ? `\\href{${escapeUrl(profile.linkedin)}}{${e(displayUrl(profile.linkedin))}}`
      : null,
    profile?.website
      ? `\\href{${escapeUrl(profile.website)}}{${e(displayUrl(profile.website))}}`
      : null,
    profile?.github
      ? `\\href{${escapeUrl(profile.github)}}{${e(displayUrl(profile.github))}}`
      : null,
  ].filter(Boolean).join(bullet)
  const contactBlock = [crispPersonal, crispSocial].filter(Boolean).join('\\\\[2pt]\n        ')

  return `\\documentclass[10pt,letterpaper]{article}
\\usepackage[top=0.5in,bottom=0.5in,left=0.65in,right=0.65in]{geometry}
\\usepackage{fontspec}
\\IfFontExistsTF{Helvetica Neue}{\\setmainfont{Helvetica Neue}}{%
  \\IfFontExistsTF{Arial}{\\setmainfont{Arial}}{%
    \\setmainfont{Latin Modern Sans}}}
\\usepackage{microtype}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{fancyhdr}

% ── Palette ──────────────────────────────────────────────────────────────────
\\definecolor{crispheader}{HTML}{1a202c}
\\definecolor{crispaccent}{HTML}{2d3748}
\\definecolor{crispgray}{HTML}{718096}

% ── Hyperref ─────────────────────────────────────────────────────────────────
\\hypersetup{
  colorlinks=true,
  urlcolor=crispaccent,
  linkcolor=crispaccent,
  citecolor=crispaccent,
}

% ── Page style ───────────────────────────────────────────────────────────────
\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\fancyfoot[C]{\\footnotesize\\color{crispgray}\\thepage}

\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}
\\widowpenalty=10000
\\clubpenalty=10000

\\begin{document}

% ── Header band ──────────────────────────────────────────────────────────────
\\setlength{\\fboxsep}{0pt}%
\\noindent\\colorbox{crispheader}{%
  \\parbox{\\linewidth}{%
    \\setlength{\\fboxsep}{12pt}%
    \\colorbox{crispheader}{%
      \\parbox{\\dimexpr\\linewidth-24pt\\relax}{%
        \\vspace{6pt}%
        {\\fontsize{22}{26}\\selectfont\\bfseries\\color{white} ${e(name)}}\\\\[5pt]
        {\\footnotesize\\color{white!75!crispheader} ${contactBlock}}%
        \\vspace{6pt}%
      }%
    }%
  }%
}%

\\vspace{2pt}

${body}
\\end{document}
`
}

// ── Section renderers ─────────────────────────────────────────────────────────

function renderSummary(resume: Resume): string {
  const summary = resume.profile?.summary
  if (!summary) return ''
  return `
${crispSection('Summary')}
{\\small ${htmlToLatex(summary)}}
`
}

function renderSkills(skills: NonNullable<Resume['skills']>, format = 'labeled'): string {
  if (!skills.length) return ''
  let body: string
  if (format === 'flat') {
    body = `{\\small ${skills.flatMap(s => parseSkills(s.skills)).map(e).join(', ')}}`
  } else {
    const sep = format === 'inline' ? ' $\\cdot$ ' : ', '
    body = skills
      .map(s => `{\\bfseries\\color{crispaccent} ${e(s.name)}:} {\\small ${parseSkills(s.skills).map(e).join(sep)}}`)
      .join('\\\\\n')
  }
  return `
${crispSection('Skills')}
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

    const dateStr = formatDateRange(p.startDate, p.endDate, p.current)
    return `\\noindent{\\bfseries\\color{crispaccent} ${e(p.company)}} \\hfill {\\small\\color{crispgray}${e(p.location ?? '')}}\\\\*
{\\itshape\\small ${e(p.title ?? '')}} \\hfill {\\small\\color{crispgray}${dateStr}}
${bulletList}`
  }).join('\n\\vspace{7pt}\n')

  return `
${crispSection('Experience')}
${items}
`
}

function renderEducation(education: NonNullable<Resume['education']>): string {
  if (!education.length) return ''
  const items = education.map(edu => {
    const dateStr = formatDateRange(edu.startDate, edu.endDate, edu.current)
    const degreeLine = edu.degree ? `{\\itshape\\small ${e(edu.degree)}}` : ''
    return `\\noindent{\\bfseries\\color{crispaccent} ${e(edu.institution)}} \\hfill {\\small\\color{crispgray}${dateStr}}${degreeLine ? `\\\\*\n${degreeLine}` : ''}`
  }).join('\n\\vspace{6pt}\n')

  return `
${crispSection('Education')}
${items}
`
}

function renderProjects(projects: NonNullable<Resume['projects']>): string {
  if (!projects.length) return ''
  const items = projects.map(p => {
    const dateStr = formatDateRange(p.startDate, p.endDate, p.current)
    const linkPart = p.link
      ? ` {\\small\\color{crispgray}--- \\href{${escapeUrl(p.link)}}{${e(p.link)}}}`
      : ''
    const achievementItems = p.achievements ? extractListItems(p.achievements) : null
    const achievementsLatex = achievementItems
      ? itemize(achievementItems)
      : (p.achievements ? htmlToLatex(p.achievements) : '')
    return `\\noindent{\\bfseries\\color{crispaccent} ${e(p.name)}}${linkPart} \\hfill {\\small\\color{crispgray}${dateStr}}
${achievementsLatex}`
  }).join('\n\\vspace{6pt}\n')

  return `
${crispSection('Projects')}
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
    const metaPart = meta ? ` \\hfill {\\small\\color{crispgray}${meta}}` : ''
    const descPart = desc ? `\\\\*\n{\\small\\color{crispgray}${desc}}` : ''
    return `\\noindent{\\bfseries\\color{crispaccent} ${url}}${metaPart}${descPart}\\par`
  }).join('\\vspace{4pt}\n')

  return `
${crispSection('Open Source')}
${items}
`
}
