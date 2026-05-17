'use client'

import { Resume } from '@/hooks/use-resume'
import { HarvardTemplate } from './templates/harvard'
import { NeueTemplate } from './templates/neue'
import { OxfordTemplate } from './templates/oxford'
import { BauhausTemplate } from './templates/bauhaus'
import { ChicagoTemplate } from './templates/chicago'
import { MillerTemplate } from './templates/miller'

interface ResumeDocumentProps {
  resume: Resume
  scale?: number
}

export function ResumeDocument({ resume, scale = 1 }: ResumeDocumentProps) {
  switch (resume.templateId) {
    case 'neue':   return <NeueTemplate   resume={resume} scale={scale} />
    case 'oxford': return <OxfordTemplate resume={resume} scale={scale} />
    case 'bauhaus': return <BauhausTemplate resume={resume} scale={scale} />
    case 'chicago': return <ChicagoTemplate resume={resume} scale={scale} />
    case 'miller':  return <MillerTemplate  resume={resume} scale={scale} />
    default:        return <HarvardTemplate resume={resume} scale={scale} />
  }
}
