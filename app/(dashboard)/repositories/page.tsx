'use client'

import { useState } from 'react'
import { useRepositories, useSyncRepositories, useToggleExcludeRepository, Repository } from '@/hooks/use-repositories'
import { Button } from '@/components/ui/button'
import { GitBranch, RefreshCw, Star, GitFork, ExternalLink, AlertCircle, EyeOff, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RepositoriesPage() {
  const { data: repos = [], isLoading } = useRepositories()
  const sync = useSyncRepositories()
  const toggleExclude = useToggleExcludeRepository()
  const [syncResult, setSyncResult] = useState<{ synced: number } | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  const handleSync = async () => {
    setSyncResult(null)
    setSyncError(null)
    try {
      const result = await sync.mutateAsync()
      setSyncResult(result)
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Sync failed')
    }
  }

  const languageColors: Record<string, string> = {
    TypeScript: 'bg-blue-500',
    JavaScript: 'bg-yellow-400',
    Python: 'bg-green-500',
    Go: 'bg-cyan-400',
    Rust: 'bg-orange-500',
    Swift: 'bg-orange-400',
    Kotlin: 'bg-purple-500',
    Java: 'bg-red-500',
    Ruby: 'bg-red-400',
    CSS: 'bg-pink-500',
    HTML: 'bg-orange-600',
    Shell: 'bg-gray-400',
  }

  const active = repos.filter(r => !r.excluded)
  const excluded = repos.filter(r => r.excluded)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Repositories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sync your GitHub repos and choose which ones to include on your resumes.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={handleSync}
          disabled={sync.isPending}
        >
          {sync.isPending ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <GitBranch size={14} />
          )}
          {sync.isPending ? 'Syncing…' : 'Sync from GitHub'}
        </Button>
      </div>

      {syncResult && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 px-4 py-3 text-sm">
          Synced {syncResult.synced} repositories from GitHub.
        </div>
      )}

      {syncError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          {syncError}
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
      )}

      {!isLoading && repos.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <GitBranch size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm mb-1">No repositories yet.</p>
          <p className="text-xs">
            Add your GitHub PAT in{' '}
            <a href="/settings" className="underline hover:text-foreground">
              Settings
            </a>{' '}
            then click Sync.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {active.map(repo => (
          <RepoCard
            key={repo.id}
            repo={repo}
            languageColors={languageColors}
            onToggleExclude={() => toggleExclude.mutate({ id: repo.id, excluded: true })}
          />
        ))}
      </div>

      {excluded.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Excluded from sync ({excluded.length})
          </p>
          <div className="space-y-2">
            {excluded.map(repo => (
              <RepoCard
                key={repo.id}
                repo={repo}
                languageColors={languageColors}
                onToggleExclude={() => toggleExclude.mutate({ id: repo.id, excluded: false })}
                isExcluded
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RepoCard({
  repo,
  languageColors,
  onToggleExclude,
  isExcluded = false,
}: {
  repo: Repository
  languageColors: Record<string, string>
  onToggleExclude: () => void
  isExcluded?: boolean
}) {
  return (
    <div className={cn(
      'rounded-lg border bg-card p-4 transition-opacity',
      isExcluded ? 'border-border/50 opacity-50' : 'border-border'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:text-mint flex items-center gap-1 truncate"
            >
              {repo.name}
              <ExternalLink size={11} className="shrink-0 text-muted-foreground" />
            </a>
            {repo.isPrivate && (
              <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">
                private
              </span>
            )}
          </div>
          {repo.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{repo.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {repo.language && (
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full',
                    languageColors[repo.language] ?? 'bg-muted-foreground'
                  )}
                />
                {repo.language}
              </span>
            )}
            {repo.stars > 0 && (
              <span className="flex items-center gap-1">
                <Star size={11} />
                {repo.stars}
              </span>
            )}
            {repo.forks > 0 && (
              <span className="flex items-center gap-1">
                <GitFork size={11} />
                {repo.forks}
              </span>
            )}
            {repo.pushedAt && (
              <span>
                Updated{' '}
                {new Date(repo.pushedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'h-7 w-7 p-0 shrink-0',
            isExcluded
              ? 'text-muted-foreground hover:text-foreground'
              : 'text-muted-foreground hover:text-destructive'
          )}
          onClick={onToggleExclude}
          title={isExcluded ? 'Re-include in sync' : 'Exclude from sync'}
        >
          {isExcluded ? <Eye size={13} /> : <EyeOff size={13} />}
        </Button>
      </div>
    </div>
  )
}
