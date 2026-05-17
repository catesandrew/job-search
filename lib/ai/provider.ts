export interface AiOptimizeRequest {
  masterResume: {
    positions: Array<{
      id: string
      company: string
      title: string
      hidden: boolean
      bullets: Array<{ id: string; content: string }>
    }>
    skills: Array<{ id: string; name: string; skills: string }>
  }
  jobDescription: string
}

export interface AiOptimizeResponse {
  positionIds: string[]
  bulletIds: string[]
  skillCategoryIds: string[]
  rewrittenBullets?: Record<string, string>
}

export interface AiAnalyzeRequest {
  resumeText: string
  jobDescription: string
}

export interface AiAnalyzeResponse {
  requiredSkills: string[]
  preferredSkills: string[]
  keywords: string[]
  experienceRequirements: string[]
}

export interface AiCoverLetterRequest {
  resumeJson: string
  jobDescription: string
  length?: 'short' | 'medium' | 'long'
  tone?: 'formal' | 'professional' | 'casual'
  customPrompt?: string
}

export interface AiCoverLetterResponse {
  coverLetter: string
  outreachMessage: string
}

export interface AiProvider {
  id: string
  name: string
  isAvailable(): Promise<boolean>
  optimize(req: AiOptimizeRequest): Promise<AiOptimizeResponse>
  analyzeJd(req: AiAnalyzeRequest): Promise<AiAnalyzeResponse>
  generateCoverLetter(req: AiCoverLetterRequest): Promise<AiCoverLetterResponse>
  generateText(prompt: string): Promise<string>
}
