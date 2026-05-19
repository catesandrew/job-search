'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const IDENTITIES_KEY = ['identities'] as const

export interface Identity {
  id: string
  userId: string
  label: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  location?: string | null
  linkedin?: string | null
  website?: string | null
  github?: string | null
  createdAt: string
  updatedAt: string
  _count?: { resumes: number }
}

export function useIdentities() {
  return useQuery({
    queryKey: [...IDENTITIES_KEY],
    queryFn: async () => {
      const res = await fetch('/api/identities')
      if (!res.ok) throw new Error('Failed to fetch identities')
      const json = await res.json()
      return json.data as Identity[]
    },
  })
}

export function useCreateIdentity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Identity>) => {
      const res = await fetch('/api/identities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create identity')
      }
      const json = await res.json()
      return json.data as Identity
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: IDENTITIES_KEY }),
  })
}

export function useUpdateIdentity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Identity> & { id: string }) => {
      const res = await fetch(`/api/identities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update identity')
      const json = await res.json()
      return json.data as Identity
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: IDENTITIES_KEY }),
  })
}

export function useDeleteIdentity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/identities/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete identity')
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: IDENTITIES_KEY }),
  })
}

export function useCloneIdentity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/identities/${id}/clone`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to clone identity')
      const json = await res.json()
      return json.data as Identity
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: IDENTITIES_KEY }),
  })
}
