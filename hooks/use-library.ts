'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const LIBRARY_SKILLS_KEY = ['library', 'skills'] as const
const LIBRARY_EXPERIENCES_KEY = ['library', 'experiences'] as const
const LIBRARY_EDUCATION_KEY = ['library', 'education'] as const

export interface LibraryBullet {
  id: string
  content: string
  sortOrder: number
}

export interface LibraryExperience {
  id: string
  company: string
  companyDesc?: string | null
  title: string
  location?: string | null
  startDate?: string | null
  endDate?: string | null
  current: boolean
  sortOrder: number
  bullets: LibraryBullet[]
}

export interface SkillLibraryCategory {
  id: string
  name: string
  skills: string  // JSON string: '["React", "TypeScript"]'
  sortOrder: number
}

// --- Skill Library Categories ---

export function useLibrarySkills() {
  return useQuery({
    queryKey: LIBRARY_SKILLS_KEY,
    queryFn: async () => {
      const res = await fetch('/api/library/skills')
      if (!res.ok) throw new Error('Failed to fetch library skills')
      const json = await res.json()
      return json.data as SkillLibraryCategory[]
    },
  })
}

export function useAddLibrarySkillCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; skills: string; sortOrder: number }) => {
      const res = await fetch('/api/library/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add skill category')
      const json = await res.json()
      return json.data as SkillLibraryCategory
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_SKILLS_KEY }),
  })
}

export function useUpdateLibrarySkillCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; skills?: string; sortOrder?: number }) => {
      const res = await fetch(`/api/library/skills/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update skill category')
      const json = await res.json()
      return json.data as SkillLibraryCategory
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_SKILLS_KEY }),
  })
}

export function useDeleteLibrarySkillCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await fetch(`/api/library/skills/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete skill category')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_SKILLS_KEY }),
  })
}

// --- Library Experiences ---

export function useLibraryExperiences() {
  return useQuery({
    queryKey: LIBRARY_EXPERIENCES_KEY,
    queryFn: async () => {
      const res = await fetch('/api/library/experiences')
      if (!res.ok) throw new Error('Failed to fetch library experiences')
      const json = await res.json()
      return json.data as LibraryExperience[]
    },
  })
}

export function useAddLibraryExperience() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      company: string
      title: string
      companyDesc?: string
      location?: string
      startDate?: string
      endDate?: string
      current?: boolean
      sortOrder?: number
    }) => {
      const res = await fetch('/api/library/experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add library experience')
      const json = await res.json()
      return json.data as LibraryExperience
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_EXPERIENCES_KEY }),
  })
}

export function useUpdateLibraryExperience() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string
      company?: string
      title?: string
      companyDesc?: string
      location?: string
      startDate?: string
      endDate?: string
      current?: boolean
      sortOrder?: number
    }) => {
      const res = await fetch(`/api/library/experiences/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update library experience')
      const json = await res.json()
      return json.data as LibraryExperience
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_EXPERIENCES_KEY }),
  })
}

export function useDeleteLibraryExperience() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await fetch(`/api/library/experiences/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete library experience')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_EXPERIENCES_KEY }),
  })
}

// --- Library Bullets ---

export function useAddLibraryBullet(experienceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { content: string; sortOrder: number }) => {
      const res = await fetch(`/api/library/experiences/${experienceId}/bullets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add library bullet')
      const json = await res.json()
      return json.data as LibraryBullet
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_EXPERIENCES_KEY }),
  })
}

export function useUpdateLibraryBullet(experienceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; content?: string; sortOrder?: number }) => {
      const res = await fetch(`/api/library/experiences/${experienceId}/bullets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update library bullet')
      const json = await res.json()
      return json.data as LibraryBullet
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_EXPERIENCES_KEY }),
  })
}

export function useDeleteLibraryBullet(experienceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await fetch(`/api/library/experiences/${experienceId}/bullets/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete library bullet')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_EXPERIENCES_KEY }),
  })
}

export function useCloneLibrarySkillCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/library/skills/${id}/clone`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to clone skill category')
      const json = await res.json()
      return json.data as SkillLibraryCategory
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_SKILLS_KEY }),
  })
}

export function useCloneLibraryExperience() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/library/experiences/${id}/clone`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to clone experience')
      const json = await res.json()
      return json.data as LibraryExperience
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_EXPERIENCES_KEY }),
  })
}

// --- Library Education ---

export interface LibraryEducation {
  id: string
  institution: string
  degree?: string | null
  location?: string | null
  startDate?: string | null
  endDate?: string | null
  current: boolean
  achievements?: string | null
  sortOrder: number
  _count?: { educations: number }
}

export function useLibraryEducations() {
  return useQuery({
    queryKey: LIBRARY_EDUCATION_KEY,
    queryFn: async () => {
      const res = await fetch('/api/library/education')
      if (!res.ok) throw new Error('Failed to fetch library education')
      const json = await res.json()
      return json.data as LibraryEducation[]
    },
  })
}

export function useAddLibraryEducation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<LibraryEducation>) => {
      const res = await fetch('/api/library/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add library education')
      const json = await res.json()
      return json.data as LibraryEducation
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_EDUCATION_KEY }),
  })
}

export function useUpdateLibraryEducation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<LibraryEducation> & { id: string }) => {
      const res = await fetch(`/api/library/education/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update library education')
      const json = await res.json()
      return json.data as LibraryEducation
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_EDUCATION_KEY }),
  })
}

export function useDeleteLibraryEducation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await fetch(`/api/library/education/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to delete library education')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_EDUCATION_KEY }),
  })
}

export function useCloneLibraryEducation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/library/education/${id}/clone`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to clone library education')
      const json = await res.json()
      return json.data as LibraryEducation
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIBRARY_EDUCATION_KEY }),
  })
}
