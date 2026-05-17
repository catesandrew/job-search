import type { Resume } from '@/hooks/use-resume'
import { generateResumeHtml } from './resume-html-template'

export async function generateResumePdf(resume: Resume): Promise<Buffer> {
  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.default.launch({ headless: true })
  try {
    const page = await browser.newPage()
    const html = generateResumeHtml(resume)
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({ format: 'A4', printBackground: true })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
