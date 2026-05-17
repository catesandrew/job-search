'use client'

import { useState, useCallback } from 'react'
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
  Project,
  useAddProject,
  useUpdateProject,
  useDeleteProject,
} from '@/hooks/use-resume'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { RichTextEditor } from '@/components/rich-text-editor'
import { CompanyCard } from '@/components/resumes/company-card'
import { Rocket, Plus, ExternalLink } from 'lucide-react'

const underlineInput =
  'w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-mint transition-colors'

interface ProjectsTabProps {
  resume: Resume
}

interface SortableProjectCardProps {
  project: Project
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onUpdate: (data: Record<string, unknown>) => void
  onDelete: () => void
}

function SortableProjectCard({
  project,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onDelete,
}: SortableProjectCardProps) {
  const [currentToggle, setCurrentToggle] = useState(project.current)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <CompanyCard
        icon={Rocket}
        iconColor="text-purple-400"
        title={project.name}
        onDelete={onDelete}
        onMoveUp={isFirst ? undefined : onMoveUp}
        onMoveDown={isLast ? undefined : onMoveDown}
        dragHandleProps={{ ...attributes, ...listeners }}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <input
                defaultValue={project.name}
                onBlur={e => onUpdate({ name: e.target.value })}
                className={underlineInput}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                Link <ExternalLink size={10} />
              </Label>
              <input
                defaultValue={project.link ?? ''}
                onBlur={e => onUpdate({ link: e.target.value })}
                placeholder="https://..."
                className={underlineInput}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Start Date</Label>
              <input
                defaultValue={project.startDate ?? ''}
                onBlur={e => onUpdate({ startDate: e.target.value })}
                placeholder="e.g. Mar 2023"
                className={underlineInput}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">End Date</Label>
              <input
                defaultValue={project.endDate ?? ''}
                onBlur={e => onUpdate({ endDate: e.target.value })}
                placeholder="e.g. Jun 2024"
                disabled={currentToggle}
                className={`${underlineInput} disabled:opacity-50`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={currentToggle}
              onCheckedChange={val => {
                setCurrentToggle(val)
                onUpdate({ current: val })
              }}
            />
            <Label className="text-xs font-normal text-muted-foreground">
              Currently working on project
            </Label>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Achievements</Label>
            <RichTextEditor
              value={project.achievements ?? ''}
              onChange={html => onUpdate({ achievements: html })}
              placeholder="Describe the project and your contributions..."
              minHeight="80px"
            />
          </div>
        </div>
      </CompanyCard>
    </div>
  )
}

export function ProjectsTab({ resume }: ProjectsTabProps) {
  const addProject = useAddProject(resume.id)
  const updateProject = useUpdateProject(resume.id)
  const deleteProject = useDeleteProject(resume.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const projectList = [...(resume.projects ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  const persistOrder = useCallback(
    (ordered: Project[]) => {
      ordered.forEach((project, index) => {
        updateProject.mutate({ id: project.id, sortOrder: index })
      })
    },
    [updateProject]
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = projectList.findIndex(p => p.id === active.id)
    const newIndex = projectList.findIndex(p => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    persistOrder(arrayMove(projectList, oldIndex, newIndex))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const reordered = [...projectList]
    ;[reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]]
    persistOrder(reordered)
  }

  const handleMoveDown = (index: number) => {
    if (index === projectList.length - 1) return
    const reordered = [...projectList]
    ;[reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]]
    persistOrder(reordered)
  }

  const handleAdd = () => {
    addProject.mutate({
      name: 'New Project',
      current: false,
      sortOrder: projectList.length,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Projects</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={handleAdd}
        >
          <Plus size={12} />
          Add project
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={projectList.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {projectList.map((project, index) => (
            <SortableProjectCard
              key={project.id}
              project={project}
              isFirst={index === 0}
              isLast={index === projectList.length - 1}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              onUpdate={data => updateProject.mutate({ id: project.id, ...data })}
              onDelete={() => deleteProject.mutate(project.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {projectList.length === 0 && (
        <p className="text-xs text-muted-foreground py-8 text-center">
          No projects yet. Add one to get started.
        </p>
      )}
    </div>
  )
}
