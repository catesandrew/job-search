'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Identity } from './use-identity'

const RESUMES_KEY = ['resumes'] as const

export interface Bullet {
  id: string
  content: string
  hidden: boolean
  sortOrder: number
  sourceBulletId?: string | null
}

export interface Position {
  id: string
  company: string
  companyDesc?: string | null
  title: string
  location?: string | null
  startDate?: string | null
  endDate?: string | null
  current: boolean
  hidden: boolean
  sortOrder: number
  sourcePositionId?: string | null
  bullets: Bullet[]
}

export interface SkillCategory {
  id: string
  name: string
  skills: string
  sortOrder: number
}

export interface Repository {
  id: string
  userId: string
  githubId: number
  name: string
  fullName: string
  description?: string | null
  language?: string | null
  stars: number
  forks: number
  url: string
  homepage?: string | null
  isPrivate: boolean
  excluded: boolean
  pushedAt?: string | null
  fetchedAt: string
}

export interface ResumeRepository {
  id: string
  resumeId: string
  repositoryId: string
  hidden: boolean
  nameOverride?: string | null
  descriptionOverride?: string | null
  sortOrder: number
  repository: Repository
}

export interface Education {
  id: string
  institution: string
  degree?: string | null
  location?: string | null
  startDate?: string | null
  endDate?: string | null
  current: boolean
  achievements?: string | null
  sortOrder: number
  libraryEducationId?: string | null
  libraryEducation?: {
    id: string
    institution: string
    degree?: string | null
    location?: string | null
    startDate?: string | null
    endDate?: string | null
    current: boolean
    achievements?: string | null
  } | null
}

export interface Project {
  id: string
  name: string
  link?: string | null
  startDate?: string | null
  endDate?: string | null
  current: boolean
  achievements?: string | null
  sortOrder: number
}

export interface Profile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  location?: string | null
  linkedin?: string | null
  website?: string | null
  targetTitle?: string | null
  summary?: string | null
}

export interface Resume {
  id: string
  userId: string
  title: string
  type: 'BASE' | 'JOB_APPLICATION_OPTIMIZED' | 'JOB_TITLE_OPTIMIZED'
  templateId: string
  fontFamily: string
  fontSize: string
  lineHeight: string
  sectionTitleCasing: string
  dateFormat: string
  marginH: string
  marginV: string
  pageSize: string
  sectionOrder: { name: string; visible: boolean; locked?: boolean }[]
  score?: number | null
  factLibrary?: string | null
  factLibraryAt?: string | null
  createdAt: string
  updatedAt: string
  identityId?: string | null
  identity?: Identity | null
  profile?: Profile | null
  positions?: Position[]
  skills?: SkillCategory[]
  education?: Education[]
  projects?: Project[]
  resumeRepositories?: ResumeRepository[]
  _count?: { applications: number; positions?: number; skills?: number }
}

// sectionOrder is stored as a JSON string in SQLite — parse it on the way out
function parseResume(raw: Resume & { sectionOrder: unknown }): Resume {
  if (typeof raw.sectionOrder === 'string') {
    try {
      raw.sectionOrder = JSON.parse(raw.sectionOrder)
    } catch {
      raw.sectionOrder = []
    }
  }
  if (!Array.isArray(raw.sectionOrder)) raw.sectionOrder = []
  return raw
}

// --- Queries ---

export function useResumes(type?: string) {
  return useQuery({
    queryKey: [...RESUMES_KEY, { type }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (type) params.set('type', type)
      const res = await fetch(`/api/resumes${params.toString() ? `?${params}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch resumes')
      const json = await res.json()
      return (json.data as (Resume & { sectionOrder: unknown })[]).map(parseResume)
    },
  })
}

export function useResume(id: string) {
  return useQuery({
    queryKey: [...RESUMES_KEY, id],
    queryFn: async () => {
      const res = await fetch(`/api/resumes/${id}`)
      if (!res.ok) throw new Error('Failed to fetch resume')
      const json = await res.json()
      return parseResume(json.data as Resume & { sectionOrder: unknown })
    },
    enabled: !!id,
  })
}

// --- Resume CRUD ---

export function useCreateResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Resume>) => {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create resume')
      }
      const json = await res.json()
      return json.data as Resume
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RESUMES_KEY }),
  })
}

export function useUpdateResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Resume> & { id: string }) => {
      const res = await fetch(`/api/resumes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update resume')
      const json = await res.json()
      return json.data as Resume
    },
    onSuccess: (_data: Resume, variables: Partial<Resume> & { id: string }) => {
      queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, variables.id] })
      queryClient.invalidateQueries({ queryKey: RESUMES_KEY })
    },
  })
}

export function useDeleteResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete resume')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RESUMES_KEY }),
  })
}

export function useCloneResume() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/resumes/${id}/clone`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to clone resume')
      const json = await res.json()
      return json.data as Resume
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: RESUMES_KEY }),
  })
}

// --- Profile ---

export function useUpdateProfile(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Profile>) => {
      const res = await fetch(`/api/resumes/${resumeId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update profile')
      const json = await res.json()
      return json.data as Profile
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

// --- Positions ---

export function useAddPosition(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Position>) => {
      const res = await fetch(`/api/resumes/${resumeId}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add position')
      const json = await res.json()
      return json.data as Position
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

export function useUpdatePosition(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Position> & { id: string }) => {
      const res = await fetch(`/api/resumes/${resumeId}/positions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update position')
      const json = await res.json()
      return json.data as Position
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

export function useDeletePosition(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (positionId: string) => {
      const res = await fetch(`/api/resumes/${resumeId}/positions/${positionId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete position')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

// --- Bullets ---

export function useAddBullet(resumeId: string, positionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Bullet>) => {
      const res = await fetch(`/api/resumes/${resumeId}/positions/${positionId}/bullets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add bullet')
      const json = await res.json()
      return json.data as Bullet
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

export function useUpdateBullet(resumeId: string, positionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Bullet> & { id: string }) => {
      const res = await fetch(`/api/resumes/${resumeId}/positions/${positionId}/bullets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update bullet')
      const json = await res.json()
      return json.data as Bullet
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

export function useDeleteBullet(resumeId: string, positionId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bulletId: string) => {
      const res = await fetch(`/api/resumes/${resumeId}/positions/${positionId}/bullets/${bulletId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete bullet')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

// --- Skill Categories ---

export function useAddSkillCategory(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<SkillCategory>) => {
      const res = await fetch(`/api/resumes/${resumeId}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add skill category')
      const json = await res.json()
      return json.data as SkillCategory
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

export function useUpdateSkillCategory(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SkillCategory> & { id: string }) => {
      const res = await fetch(`/api/resumes/${resumeId}/skills/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update skill category')
      const json = await res.json()
      return json.data as SkillCategory
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

export function useDeleteSkillCategory(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (skillCategoryId: string) => {
      const res = await fetch(`/api/resumes/${resumeId}/skills/${skillCategoryId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete skill category')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

// --- Education ---

export function useAddEducation(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Education>) => {
      const res = await fetch(`/api/resumes/${resumeId}/education`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add education')
      const json = await res.json()
      return json.data as Education
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

export function useUpdateEducation(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Education> & { id: string }) => {
      const res = await fetch(`/api/resumes/${resumeId}/education/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update education')
      const json = await res.json()
      return json.data as Education
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

export function useDeleteEducation(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (educationId: string) => {
      const res = await fetch(`/api/resumes/${resumeId}/education/${educationId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete education')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

// --- Projects ---

export function useAddProject(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const res = await fetch(`/api/resumes/${resumeId}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add project')
      const json = await res.json()
      return json.data as Project
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

export function useUpdateProject(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Project> & { id: string }) => {
      const res = await fetch(`/api/resumes/${resumeId}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update project')
      const json = await res.json()
      return json.data as Project
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

export function useDeleteProject(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(`/api/resumes/${resumeId}/projects/${projectId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete project')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

// --- Resume Repositories ---

export function useAddResumeRepository(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      repositoryId: string
      hidden?: boolean
      nameOverride?: string | null
      descriptionOverride?: string | null
      sortOrder?: number
    }) => {
      const res = await fetch(`/api/resumes/${resumeId}/repositories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to add repository')
      const json = await res.json()
      return json.data as ResumeRepository
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

export function useUpdateResumeRepository(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ResumeRepository> & { id: string }) => {
      const res = await fetch(`/api/resumes/${resumeId}/repositories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update repository')
      const json = await res.json()
      return json.data as ResumeRepository
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

export function useDeleteResumeRepository(resumeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (repoId: string) => {
      const res = await fetch(`/api/resumes/${resumeId}/repositories/${repoId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove repository')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...RESUMES_KEY, resumeId] }),
  })
}

export interface TailorRun {
  id: string
  resumeId: string
  applicationId: string | null
  company: string | null
  role: string | null
  summaryGenerated: boolean
  skillCount: number
  positionCount: number
  repositoryCount: number
  tailoredAt: string
  resume: { id: string; title: string }
}

const TAILOR_RUNS_KEY = ['tailor-runs'] as const

export function useTailorRuns() {
  return useQuery({
    queryKey: TAILOR_RUNS_KEY,
    queryFn: async () => {
      const res = await fetch('/api/tailor-runs')
      if (!res.ok) throw new Error('Failed to fetch tailor runs')
      const json = await res.json()
      return json.data as TailorRun[]
    },
  })
}
