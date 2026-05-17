import { Resume } from '@/hooks/use-resume'

export interface TemplateProps {
  resume: Resume
  scale?: number
}

export function getTemplateVars(resume: Resume) {
  const contact = resume.identity ?? resume.profile
  const profile = resume.profile
  const positions = (resume.positions ?? []).filter(p => !p.hidden).sort((a, b) => a.sortOrder - b.sortOrder)
  const skills = (resume.skills ?? []).sort((a, b) => a.sortOrder - b.sortOrder)
  const education = (resume.education ?? []).sort((a, b) => a.sortOrder - b.sortOrder)
  const projects = (resume.projects ?? []).sort((a, b) => a.sortOrder - b.sortOrder)
  const repositories = (resume.resumeRepositories ?? []).filter(rr => !rr.hidden).sort((a, b) => a.sortOrder - b.sortOrder)

  const fontSize = ({ small: '11px', medium: '12px', large: '13px' } as Record<string, string>)[resume.fontSize] ?? '12px'
  const lineHeight = ({ compact: 1.3, standard: 1.5, relaxed: 1.7 } as Record<string, number>)[resume.lineHeight] ?? 1.5
  const fontFamily = ({
    Garamond: '"EB Garamond", Georgia, serif',
    Georgia: 'Georgia, serif',
    Inter: 'Inter, sans-serif',
  } as Record<string, string>)[resume.fontFamily] ?? 'Inter, sans-serif'
  const sectionCasing = ({ capitalize: 'capitalize', uppercase: 'uppercase', lowercase: 'lowercase' } as Record<string, string>)[resume.sectionTitleCasing] ?? 'uppercase'
  const visibleSections = (resume.sectionOrder ?? []).filter(s => s.visible)

  return { contact, profile, positions, skills, education, projects, repositories, fontSize, lineHeight, fontFamily, sectionCasing, visibleSections }
}

export function parseSkills(raw: string): string[] {
  try { return JSON.parse(raw) } catch { return [] }
}

export function contactItems(contact: NonNullable<Resume['identity']>): string[] {
  return [
    contact.email ?? '',
    contact.phone ?? '',
    contact.location ?? '',
    contact.linkedin ?? '',
    contact.website ?? '',
  ].filter(Boolean)
}
