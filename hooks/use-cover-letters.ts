'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const KEY = ['cover-letters'] as const

export interface CoverLetterProfile {
  firstName: string
  lastName: string
  email: string
  phone: string | null
}

export interface CoverLetter {
  id: string
  title: string
  content: string
  outreachMessage: string | null
  length: string
  tone: string
  customPrompt: string | null
  resumeId: string | null
  applicationId: string | null
  resume: {
    id: string
    title: string
    profile?: CoverLetterProfile | null
  } | null
  application: {
    id: string
    company: string
    role: string
    location?: string | null
  } | null
  createdAt: string
  updatedAt: string
}

export function useCoverLetters() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const res = await fetch('/api/cover-letters')
      if (!res.ok) throw new Error('Failed to fetch cover letters')
      const json = await res.json()
      return json.data as CoverLetter[]
    },
  })
}

export function useCoverLetter(id: string) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: async () => {
      const res = await fetch(`/api/cover-letters/${id}`)
      if (!res.ok) throw new Error('Failed to fetch cover letter')
      const json = await res.json()
      return json.data as CoverLetter
    },
    enabled: !!id,
  })
}

export function useDeleteCoverLetter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/cover-letters/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete cover letter')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateCoverLetter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string
      title?: string
      content?: string
      outreachMessage?: string
      length?: string
      tone?: string
      customPrompt?: string
      resumeId?: string | null
    }) => {
      const res = await fetch(`/api/cover-letters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update cover letter')
      const json = await res.json()
      return json.data as CoverLetter
    },
    onSuccess: (_data: CoverLetter, vars: { id: string }) => {
      queryClient.invalidateQueries({ queryKey: KEY })
      queryClient.invalidateQueries({ queryKey: [...KEY, vars.id] })
    },
  })
}

export function useGenerateCoverLetter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      resumeId?: string
      applicationId?: string
      length?: string
      tone?: string
      customPrompt?: string
    }) => {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Generation failed')
      return json.data as CoverLetter
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useRegenerateCoverLetter(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      resumeId?: string
      length?: string
      tone?: string
      customPrompt?: string
    }) => {
      const res = await fetch(`/api/cover-letters/${id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Regeneration failed')
      return json.data as CoverLetter
    },
    onSuccess: (data: CoverLetter) => {
      queryClient.setQueryData([...KEY, id], data)
      queryClient.invalidateQueries({ queryKey: KEY })
    },
  })
}
