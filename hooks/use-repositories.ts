'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const REPOS_KEY = ['repositories'] as const

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

export function useRepositories() {
  return useQuery({
    queryKey: [...REPOS_KEY],
    queryFn: async () => {
      const res = await fetch('/api/repositories')
      if (!res.ok) throw new Error('Failed to fetch repositories')
      const json = await res.json()
      return json.data as Repository[]
    },
  })
}

export function useSyncRepositories() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/repositories/sync', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to sync repositories')
      }
      return res.json() as Promise<{ synced: number }>
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REPOS_KEY }),
  })
}

export function useToggleExcludeRepository() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, excluded }: { id: string; excluded: boolean }) => {
      const res = await fetch(`/api/repositories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excluded }),
      })
      if (!res.ok) throw new Error('Failed to update repository')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REPOS_KEY }),
  })
}
