'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FactLibrary, ScreenScore, InterviewQuestion } from '@/lib/ai/mcp-tools'

// ── Career Fact Extractor ─────────────────────────────────────────────────────

export function useExtractFacts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (resumeId: string) => {
      const res = await fetch('/api/ai/extract-facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Fact extraction failed')
      return json.data as FactLibrary
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  })
}

// ── Recruiter Screen Simulation ───────────────────────────────────────────────

export function useScreenResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ resumeId, jobDescription }: { resumeId: string; jobDescription?: string }) => {
      const res = await fetch('/api/ai/screen-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, jobDescription }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Screen simulation failed')
      return json.data as ScreenScore
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  })
}

// ── Interview Prep ────────────────────────────────────────────────────────────

export interface InterviewPrepResult {
  applicationId: string
  questions: InterviewQuestion[]
  generatedAt: string
}

export function useInterviewPrep(applicationId: string) {
  return useQuery({
    queryKey: ['interview-prep', applicationId],
    queryFn: async () => {
      const res = await fetch(`/api/applications/${applicationId}/interview-prep`)
      if (!res.ok) throw new Error('Failed to fetch interview prep')
      const json = await res.json()
      return json.data as InterviewPrepResult | null
    },
    enabled: !!applicationId,
  })
}

export function useGenerateInterviewPrep(applicationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/applications/${applicationId}/interview-prep`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Interview prep generation failed')
      return json.data as InterviewPrepResult
    },
    onSuccess: (data: InterviewPrepResult) => {
      queryClient.setQueryData(['interview-prep', applicationId], data)
    },
  })
}

// ── Company Insights ──────────────────────────────────────────────────────────

import type { CompanyInsights } from '@/app/api/applications/[id]/insights/route'
export type { CompanyInsights }

export function useCompanyInsights(applicationId: string, initialData?: CompanyInsights | null) {
  return useQuery({
    queryKey: ['company-insights', applicationId],
    queryFn: async () => {
      const res = await fetch(`/api/applications/${applicationId}/insights`)
      if (!res.ok) throw new Error('Failed to fetch insights')
      const json = await res.json()
      return json.data as CompanyInsights | null
    },
    initialData: initialData ?? undefined,
    enabled: !!applicationId,
  })
}

export function useGenerateCompanyInsights(applicationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/applications/${applicationId}/insights`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to generate insights')
      return json.data as CompanyInsights
    },
    onSuccess: (data: CompanyInsights) => {
      queryClient.setQueryData(['company-insights', applicationId], data)
    },
  })
}

export function useSaveInterviewQuestions(applicationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (questions: string[]) => {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewQuestions: JSON.stringify(questions) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      return json.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications', applicationId] }),
  })
}
