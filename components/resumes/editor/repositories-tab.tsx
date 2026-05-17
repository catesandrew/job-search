'use client'

import { useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Resume,
  ResumeRepository,
  useAddResumeRepository,
  useUpdateResumeRepository,
  useDeleteResumeRepository,
} from '@/hooks/use-resume'
import { useRepositories, Repository } from '@/hooks/use-repositories'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { GripVertical, GitBranch, Star, GitFork, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const underlineInput =
  'w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-mint transition-colors'

interface RepositoriesTabProps {
  resume: Resume
}

// --- Included repo sortable card ---

interface SortableIncludedRepoProps {
  rr: ResumeRepository
  isFirst: boolean
  isLast: boolean
  onUpdate: (data: Partial<ResumeRepository>) => void
  onRemove: () => void
}

function SortableIncludedRepo({ rr, onUpdate, onRemove }: SortableIncludedRepoProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rr.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="rounded-lg border border-border bg-card p-3 space-y-2"
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
        >
          <GripVertical size={14} />
        </div>
        <GitBranch size={13} className="text-muted-foreground shrink-0" />
        <span className="text-sm font-medium flex-1 truncate">
          {rr.nameOverride || rr.repository.name}
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          {rr.repository.language && <span>{rr.repository.language}</span>}
          {rr.repository.stars > 0 && (
            <span className="flex items-center gap-0.5">
              <Star size={10} />
              {rr.repository.stars}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-destructive shrink-0"
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Description override</Label>
        <input
          defaultValue={rr.descriptionOverride ?? ''}
          onBlur={e => onUpdate({ descriptionOverride: e.target.value || null })}
          placeholder={rr.repository.description ?? 'No description'}
          className={underlineInput}
        />
      </div>
    </div>
  )
}

export function RepositoriesTab({ resume }: RepositoriesTabProps) {
  const { data: allRepos = [], isLoading } = useRepositories()
  const addResumeRepo = useAddResumeRepository(resume.id)
  const updateResumeRepo = useUpdateResumeRepository(resume.id)
  const deleteResumeRepo = useDeleteResumeRepository(resume.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const resumeRepos = [...(resume.resumeRepositories ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder
  )
  const includedIds = new Set(resumeRepos.filter(rr => !rr.hidden).map(rr => rr.repositoryId))
  const rrByRepoId = new Map(resumeRepos.map(rr => [rr.repositoryId, rr]))
  const includedRepos = resumeRepos.filter(rr => !rr.hidden)

  const persistOrder = useCallback(
    (ordered: ResumeRepository[]) => {
      ordered.forEach((rr, index) => {
        updateResumeRepo.mutate({ id: rr.id, sortOrder: index })
      })
    },
    [updateResumeRepo]
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = includedRepos.findIndex(r => r.id === active.id)
    const newIndex = includedRepos.findIndex(r => r.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    persistOrder(arrayMove(includedRepos, oldIndex, newIndex))
  }

  const toggleInclude = (repo: Repository) => {
    const existing = rrByRepoId.get(repo.id)
    if (!existing) {
      addResumeRepo.mutate({
        repositoryId: repo.id,
        hidden: false,
        sortOrder: includedRepos.length,
      })
    } else if (!existing.hidden) {
      updateResumeRepo.mutate({ id: existing.id, hidden: true })
    } else {
      updateResumeRepo.mutate({ id: existing.id, hidden: false, sortOrder: includedRepos.length })
    }
  }

  const notIncluded = allRepos.filter(r => !includedIds.has(r.id))

  return (
    <div className="space-y-5">
      {/* Included section */}
      <div>
        <h3 className="text-sm font-semibold mb-3">On Resume</h3>
        {includedRepos.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
            No repositories included. Toggle some below.
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={includedRepos.map(r => r.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {includedRepos.map((rr, index) => (
                  <SortableIncludedRepo
                    key={rr.id}
                    rr={rr}
                    isFirst={index === 0}
                    isLast={index === includedRepos.length - 1}
                    onUpdate={data => updateResumeRepo.mutate({ id: rr.id, ...data })}
                    onRemove={() => deleteResumeRepo.mutate(rr.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Available repos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Available Repositories</h3>
          <Link
            href="/repositories"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            Manage <ExternalLink size={10} />
          </Link>
        </div>

        {isLoading && (
          <p className="text-xs text-muted-foreground py-4 text-center">Loading...</p>
        )}

        {!isLoading && allRepos.length === 0 && (
          <div className="text-center py-6 border border-dashed border-border rounded-lg">
            <GitBranch size={24} className="mx-auto mb-2 text-muted-foreground opacity-40" />
            <p className="text-xs text-muted-foreground mb-2">No repositories synced yet.</p>
            <Link href="/repositories">
              <Button type="button" variant="outline" size="sm" className="text-xs">
                Sync from GitHub
              </Button>
            </Link>
          </div>
        )}

        <div className="space-y-1.5">
          {notIncluded.map(repo => (
            <RepoRow
              key={repo.id}
              repo={repo}
              included={false}
              onToggle={() => toggleInclude(repo)}
            />
          ))}
          {/* Show included repos in the list too so they can be toggled off */}
          {includedRepos.map(rr => (
            <RepoRow
              key={rr.repositoryId}
              repo={rr.repository}
              included={true}
              onToggle={() => toggleInclude(rr.repository)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function RepoRow({
  repo,
  included,
  onToggle,
}: {
  repo: Repository
  included: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 border transition-colors',
        included ? 'border-mint/30 bg-mint/5' : 'border-border bg-card/20'
      )}
    >
      <Switch checked={included} onCheckedChange={onToggle} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{repo.name}</span>
          {repo.isPrivate && (
            <span className="text-[10px] text-muted-foreground border border-border rounded px-1">
              private
            </span>
          )}
        </div>
        {repo.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{repo.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        {repo.language && <span>{repo.language}</span>}
        {repo.stars > 0 && (
          <span className="flex items-center gap-0.5">
            <Star size={10} />
            {repo.stars}
          </span>
        )}
        {repo.forks > 0 && (
          <span className="flex items-center gap-0.5">
            <GitFork size={10} />
            {repo.forks}
          </span>
        )}
      </div>
    </div>
  )
}
