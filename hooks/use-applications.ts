'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const APPLICATIONS_KEY = ['applications'] as const

export interface Application {
  id: string
  company: string
  companyUrl?: string | null
  role: string
  location?: string | null
  remote: boolean
  status: 'WISHLIST' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED'
  salaryMin?: number | null
  salaryMax?: number | null
  salaryFreq?: string | null
  jobUrl?: string | null
  jobDescription?: string | null
  notes?: string | null
  linkedResumeId?: string | null
  linkedResume?: { id: string; title: string } | null
  interviewQuestions?: string
  companyInsights?: string | null
  createdAt: string
  updatedAt: string
}

export function useApplications(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: [...APPLICATIONS_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.set('status', filters.status)
      if (filters?.search) params.set('search', filters.search)
      const res = await fetch(`/api/applications${params.toString() ? `?${params}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch applications')
      const json = await res.json()
      return json.data as Application[]
    },
  })
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: [...APPLICATIONS_KEY, id],
    queryFn: async () => {
      const res = await fetch(`/api/applications/${id}`)
      if (!res.ok) throw new Error('Failed to fetch application')
      const json = await res.json()
      return json.data as Application
    },
    enabled: !!id,
  })
}

export function useCreateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Application>) => {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create application')
      }
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY }),
  })
}

export function useUpdateApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Application> & { id: string }) => {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update application')
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY }),
  })
}

export function useDeleteApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete application')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY }),
  })
}

export interface ExtractedApplication {
  company: string
  role: string
  location?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  salaryFreq?: string | null
  companyUrl?: string | null
  jobDescription?: string | null
}

export function useImportApplicationUrl() {
  return useMutation({
    mutationFn: async (url: string): Promise<ExtractedApplication> => {
      const res = await fetch('/api/applications/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Import failed')
      return json.data as ExtractedApplication
    },
  })
}

export function useCloneApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/applications/${id}/clone`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to clone application')
      const json = await res.json()
      return json.data as Application
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPLICATIONS_KEY }),
  })
}
