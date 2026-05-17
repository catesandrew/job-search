import type { AiOptimizeRequest } from './provider'

export function buildOptimizePrompt(req: AiOptimizeRequest): string {
  const positionsJson = JSON.stringify(
    req.masterResume.positions.map(p => ({
      id: p.id,
      company: p.company,
      title: p.title,
      bullets: p.bullets.map(b => ({ id: b.id, content: b.content })),
    })),
    null,
    2
  )

  const skillsJson = JSON.stringify(
    req.masterResume.skills.map(s => ({ id: s.id, name: s.name, skills: s.skills })),
    null,
    2
  )

  return `You are an expert resume optimizer. Given a master resume and a job description, select the most relevant positions, bullets, and skill categories.

## Job Description
${req.jobDescription}

## Master Resume Positions
${positionsJson}

## Master Resume Skill Categories
${skillsJson}

## Instructions
1. Select which positions are most relevant to the job description. Include at least 1 position.
2. For each included position, select which bullets best demonstrate fit for the role. Include 2-5 bullets per position.
3. Select the skill categories most relevant to the job description.
4. Optionally, rewrite up to 5 bullets to better match the job description keywords, while keeping the content factually accurate.
5. Return ONLY valid JSON. No prose, no markdown, no code fences.

## Required JSON Format
{
  "positionIds": ["id1", "id2"],
  "bulletIds": ["id1", "id2", "id3"],
  "skillCategoryIds": ["id1", "id2"],
  "rewrittenBullets": {
    "bulletId": "Rewritten bullet content starting with capital letter"
  }
}

Respond with only the JSON object and nothing else.`
}

export function buildExtractKeywordsPrompt(jobDescription: string): string {
  return `Extract job requirements as JSON. Output ONLY the JSON object, no other text.

Format:
{
  "required_skills": ["Python", "AWS"],
  "preferred_skills": ["Kubernetes"],
  "experience_requirements": ["5+ years backend", "team leadership"],
  "keywords": ["microservices", "agile", "distributed systems"]
}

Rules:
- required_skills: skills/technologies explicitly required or essential
- preferred_skills: skills listed as nice-to-have or preferred
- experience_requirements: specific experience statements (years, domains, leadership)
- keywords: important domain terms, methodologies, and role-specific phrases
- Keep all values lowercase
- Be specific and concrete — avoid generic terms like "communication" or "teamwork"
- Include acronyms where commonly used (e.g. "ci/cd", "rest api")

Job description:
${jobDescription}`
}

const LENGTH_GUIDANCE: Record<string, string> = {
  short: '75-100 words maximum',
  medium: '100-150 words maximum',
  long: '150-200 words maximum',
}

const TONE_GUIDANCE: Record<string, string> = {
  formal: 'Tone: Formal and professional — confident but respectful distance',
  professional: 'Tone: Confident peer — direct and professional, not stiff',
  casual: 'Tone: Warm and conversational — like a message to a professional contact',
}

export function buildCoverLetterPrompt(
  resumeJson: string,
  jobDescription: string,
  options?: { length?: string; tone?: string; customPrompt?: string }
): string {
  const length = LENGTH_GUIDANCE[options?.length ?? 'medium'] ?? LENGTH_GUIDANCE.medium
  const tone = TONE_GUIDANCE[options?.tone ?? 'professional'] ?? TONE_GUIDANCE.professional
  const custom = options?.customPrompt?.trim()

  return `Write a cover letter for this job application.

Job Description:
${jobDescription}

Candidate Resume (JSON):
${resumeJson}

Requirements:
- ${length}
- 3-4 short paragraphs
- Opening: Reference ONE specific thing from the job description (product, tech stack, or problem they're solving) — not generic excitement about "the role"
- Middle: Pick 1-2 qualifications from resume that DIRECTLY match stated requirements — prioritize relevance over impressiveness
- Closing: Simple availability to discuss, no desperate enthusiasm
- Extract company name from job description — do not use placeholders
- Do NOT invent information not in the resume
- ${tone}
- Do NOT use em dash anywhere in the output
${custom ? `\nAdditional instructions:\n${custom}` : ''}
Output plain text only. No JSON, no markdown formatting.`
}

export function buildOutreachPrompt(resumeJson: string, jobDescription: string): string {
  return `Generate a cold outreach message for LinkedIn or email about this job opportunity.

Job Description:
${jobDescription}

Candidate Resume (JSON):
${resumeJson}

Guidelines:
- 70-100 words maximum
- First sentence: Reference a specific detail from the job description (team, product, technical challenge) — never open with "I'm reaching out" or "I saw your posting"
- One sentence on strongest matching qualification with a concrete metric if available
- End with low-friction ask: "Worth a quick chat?" not "I'd love the opportunity to discuss"
- Tone: How you'd message a former colleague, not a stranger
- Do NOT include placeholder brackets
- Do NOT use phrases like "excited about" or "passionate about"
- Do NOT use em dash anywhere in the output

Output plain text only. No JSON, no markdown formatting.`
}
