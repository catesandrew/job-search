import React from 'react'
import type { Resume } from '@/hooks/use-resume'
import { HarvardTemplate } from '@/components/resumes/preview/templates/harvard'
import { NeueTemplate } from '@/components/resumes/preview/templates/neue'
import { OxfordTemplate } from '@/components/resumes/preview/templates/oxford'
import { BauhausTemplate } from '@/components/resumes/preview/templates/bauhaus'
import { ChicagoTemplate } from '@/components/resumes/preview/templates/chicago'
import { MillerTemplate } from '@/components/resumes/preview/templates/miller'
import { generateLatexResume } from './latex-resume'
import { generateLatexNeueResume } from './latex-neue'
import { generateLatexOxfordResume } from './latex-oxford'
import { generateLatexChicagoResume } from './latex-chicago'
import { generateLatexMillerResume } from './latex-miller'
import { generateLatexBauhausResume } from './latex-bauhaus'
import { generateLatexSlateResume } from './latex-slate'
import { generateLatexCrispResume } from './latex-crisp'
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
    const source = resume.templateId === 'neue'
      ? generateLatexNeueResume(resume)
      : resume.templateId === 'oxford'
      ? generateLatexOxfordResume(resume)
      : resume.templateId === 'chicago'
      ? generateLatexChicagoResume(resume)
      : resume.templateId === 'miller'
      ? generateLatexMillerResume(resume)
      : resume.templateId === 'bauhaus'
      ? generateLatexBauhausResume(resume)
      : resume.templateId === 'slate'
      ? generateLatexSlateResume(resume)
      : resume.templateId === 'crisp'
      ? generateLatexCrispResume(resume)
      : generateLatexResume(resume)
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
