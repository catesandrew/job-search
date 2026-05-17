import type { Resume } from '@/hooks/use-resume'

const fontFamilyMap: Record<string, string> = {
  garamond: "'EB Garamond', Georgia, serif",
  inter: "'Inter', Arial, sans-serif",
  helvetica: 'Helvetica, Arial, sans-serif',
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatDate(date: string | null | undefined): string {
  if (!date) return ''
  return date
}

function renderSummary(resume: Resume): string {
  const summary = resume.profile?.summary
  if (!summary) return ''
  return `
    <section>
      <h2>Summary</h2>
      <p>${stripHtml(summary)}</p>
    </section>`
}

function renderExperience(resume: Resume): string {
  const positions = (resume.positions ?? []).filter(p => !p.hidden)
  if (positions.length === 0) return ''

  const items = positions
    .map(p => {
      const dates = [p.startDate, p.current ? 'Present' : p.endDate].filter(Boolean).join(' – ')
      const visibleBullets = p.bullets.filter(b => !b.hidden)
      const bulletHtml = visibleBullets.length
        ? `<ul>${visibleBullets.map(b => `<li>${stripHtml(b.content)}</li>`).join('')}</ul>`
        : ''
      return `
        <div class="entry">
          <div class="entry-header">
            <span class="company">${p.company}</span>${p.title ? ` — <span class="title">${p.title}</span>` : ''}
            <span class="dates">${dates}${p.location ? ` | ${p.location}` : ''}</span>
          </div>
          ${bulletHtml}
        </div>`
    })
    .join('')

  return `
    <section>
      <h2>Experience</h2>
      ${items}
    </section>`
}

function renderEducation(resume: Resume): string {
  const education = resume.education ?? []
  if (education.length === 0) return ''

  const items = education
    .map(e => {
      const dates = [e.startDate, e.current ? 'Present' : e.endDate].filter(Boolean).join(' – ')
      return `
        <div class="entry">
          <div class="entry-header">
            <span class="company">${e.institution}</span>${e.degree ? ` — <span class="title">${e.degree}</span>` : ''}
            <span class="dates">${dates}${e.location ? ` | ${e.location}` : ''}</span>
          </div>
          ${e.achievements ? `<p>${stripHtml(e.achievements)}</p>` : ''}
        </div>`
    })
    .join('')

  return `
    <section>
      <h2>Education</h2>
      ${items}
    </section>`
}

function renderSkills(resume: Resume): string {
  const skills = resume.skills ?? []
  if (skills.length === 0) return ''

  const items = skills
    .map(s => `<p><strong>${s.name}:</strong> ${s.skills}</p>`)
    .join('')

  return `
    <section>
      <h2>Skills</h2>
      ${items}
    </section>`
}

function renderProjects(resume: Resume): string {
  const projects = resume.projects ?? []
  if (projects.length === 0) return ''

  const items = projects
    .map(p => {
      const dates = [p.startDate, p.current ? 'Present' : p.endDate].filter(Boolean).join(' – ')
      return `
        <div class="entry">
          <div class="entry-header">
            <span class="company">${p.name}</span>${p.link ? ` — <a href="${p.link}">${p.link}</a>` : ''}
            <span class="dates">${dates}</span>
          </div>
          ${p.achievements ? `<p>${stripHtml(p.achievements)}</p>` : ''}
        </div>`
    })
    .join('')

  return `
    <section>
      <h2>Projects</h2>
      ${items}
    </section>`
}

const sectionRenderers: Record<string, (resume: Resume) => string> = {
  summary: renderSummary,
  experience: renderExperience,
  education: renderEducation,
  skills: renderSkills,
  projects: renderProjects,
}

export function generateResumeHtml(resume: Resume): string {
  const fontFamily = fontFamilyMap[resume.fontFamily] ?? fontFamilyMap.garamond
  const fontSize = resume.fontSize ?? '11pt'
  const lineHeight = resume.lineHeight ?? '1.4'
  const marginH = resume.marginH ?? '18mm'
  const marginV = resume.marginV ?? '15mm'

  const profile = resume.profile
  const name = profile ? `${profile.firstName} ${profile.lastName}` : resume.title

  const contactParts = [
    profile?.email,
    profile?.phone,
    profile?.location,
    profile?.linkedin,
    profile?.website,
  ].filter(Boolean)
  const contactLine = contactParts.join(' | ')

  const sectionOrder = resume.sectionOrder ?? []
  const sectionsHtml = sectionOrder
    .filter(s => s.visible !== false)
    .map(s => {
      const renderer = sectionRenderers[s.name]
      return renderer ? renderer(resume) : ''
    })
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;600&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: ${fontFamily};
      font-size: ${fontSize};
      line-height: ${lineHeight};
      color: #111;
      background: #fff;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: ${marginV} ${marginH};
    }

    header {
      text-align: center;
      margin-bottom: 8pt;
    }

    h1 {
      font-size: 22pt;
      font-weight: 600;
      letter-spacing: 0.02em;
      margin-bottom: 4pt;
    }

    .contact {
      font-size: 9pt;
      color: #444;
    }

    hr {
      border: none;
      border-top: 1px solid #333;
      margin: 8pt 0;
    }

    section {
      margin-bottom: 10pt;
    }

    h2 {
      font-size: 11pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-bottom: 1px solid #999;
      padding-bottom: 2pt;
      margin-bottom: 6pt;
    }

    .entry {
      margin-bottom: 6pt;
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 4pt;
      margin-bottom: 2pt;
    }

    .company {
      font-weight: 600;
    }

    .title {
      font-style: italic;
    }

    .dates {
      font-size: 9pt;
      color: #555;
      margin-left: auto;
    }

    ul {
      padding-left: 16pt;
      margin-top: 2pt;
    }

    li {
      margin-bottom: 1pt;
    }

    p {
      margin-bottom: 3pt;
    }

    a {
      color: #111;
    }
  </style>
</head>
<body>
  <div class="page">
    <header>
      <h1>${name}</h1>
      ${contactLine ? `<p class="contact">${contactLine}</p>` : ''}
    </header>
    <hr>
    ${sectionsHtml}
  </div>
</body>
</html>`
}
