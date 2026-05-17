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
  Education,
  useAddEducation,
  useUpdateEducation,
  useDeleteEducation,
} from '@/hooks/use-resume'
import { useLibraryEducations } from '@/hooks/use-library'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { RichTextEditor } from '@/components/rich-text-editor'
import { CompanyCard } from '@/components/resumes/company-card'
import { GraduationCap, Plus, Library, Link2Off } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const underlineInput =
  'w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-mint transition-colors'

interface EducationTabProps {
  resume: Resume
}

interface SortableEducationCardProps {
  edu: Education
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onUpdate: (data: Record<string, unknown>) => void
  onDelete: () => void
  onUnlink: () => void
}

function SortableEducationCard({
  edu,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onUpdate,
  onDelete,
  onUnlink,
}: SortableEducationCardProps) {
  const [currentToggle, setCurrentToggle] = useState(edu.current)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: edu.id,
  })

  const lib = edu.libraryEducation
  const isLinked = !!lib

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
        icon={GraduationCap}
        iconColor="text-yellow-400"
        title={isLinked ? lib.institution : edu.institution}
        onDelete={onDelete}
        onMoveUp={isFirst ? undefined : onMoveUp}
        onMoveDown={isLast ? undefined : onMoveDown}
        dragHandleProps={{ ...attributes, ...listeners }}
      >
        {isLinked ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs bg-indigo-950 text-indigo-400 border-0 flex items-center gap-1">
                <Library size={10} />
                Linked from library
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs gap-1 text-muted-foreground hover:text-foreground"
                onClick={onUnlink}
              >
                <Link2Off size={11} />
                Unlink
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Institution</p>
                <p className="text-sm">{lib.institution || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Degree</p>
                <p className="text-sm">{lib.degree || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm">{lib.location || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dates</p>
                <p className="text-sm">
                  {lib.startDate || '?'} – {lib.current ? 'Present' : lib.endDate || '?'}
                </p>
              </div>
            </div>
            {lib.achievements && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Achievements</p>
                <div
                  className="text-sm prose prose-sm prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: lib.achievements }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Institution Name</Label>
                <input
                  defaultValue={edu.institution}
                  onBlur={e => onUpdate({ institution: e.target.value })}
                  className={underlineInput}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Degree</Label>
                <input
                  defaultValue={edu.degree ?? ''}
                  onBlur={e => onUpdate({ degree: e.target.value })}
                  className={underlineInput}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Location</Label>
                <input
                  defaultValue={edu.location ?? ''}
                  onBlur={e => onUpdate({ location: e.target.value })}
                  className={underlineInput}
                />
              </div>
              <div />
              <div>
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <input
                  defaultValue={edu.startDate ?? ''}
                  onBlur={e => onUpdate({ startDate: e.target.value })}
                  placeholder="e.g. Sep 2018"
                  className={underlineInput}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">End Date</Label>
                <input
                  defaultValue={edu.endDate ?? ''}
                  onBlur={e => onUpdate({ endDate: e.target.value })}
                  placeholder="e.g. May 2022"
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
              <Label className="text-xs font-normal text-muted-foreground">Currently attending</Label>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Achievements</Label>
              <RichTextEditor
                value={edu.achievements ?? ''}
                onChange={html => onUpdate({ achievements: html })}
                placeholder="Describe your achievements..."
                minHeight="80px"
              />
            </div>
          </div>
        )}
      </CompanyCard>
    </div>
  )
}

export function EducationTab({ resume }: EducationTabProps) {
  const addEducation = useAddEducation(resume.id)
  const updateEducation = useUpdateEducation(resume.id)
  const deleteEducation = useDeleteEducation(resume.id)
  const { data: libraryEntries = [] } = useLibraryEducations()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const educationList = [...(resume.education ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  const persistOrder = useCallback(
    (ordered: Education[]) => {
      ordered.forEach((edu, index) => {
        updateEducation.mutate({ id: edu.id, sortOrder: index })
      })
    },
    [updateEducation]
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = educationList.findIndex(e => e.id === active.id)
    const newIndex = educationList.findIndex(e => e.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    persistOrder(arrayMove(educationList, oldIndex, newIndex))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const reordered = [...educationList]
    ;[reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]]
    persistOrder(reordered)
  }

  const handleMoveDown = (index: number) => {
    if (index === educationList.length - 1) return
    const reordered = [...educationList]
    ;[reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]]
    persistOrder(reordered)
  }

  const handleAdd = () => {
    addEducation.mutate({
      institution: 'New Institution',
      current: false,
      sortOrder: educationList.length,
    })
  }

  const handleAddFromLibrary = (libraryId: string) => {
    const lib = libraryEntries.find(e => e.id === libraryId)
    if (!lib) return
    addEducation.mutate({
      institution: lib.institution,
      degree: lib.degree ?? undefined,
      location: lib.location ?? undefined,
      startDate: lib.startDate ?? undefined,
      endDate: lib.endDate ?? undefined,
      current: lib.current,
      achievements: lib.achievements ?? undefined,
      sortOrder: educationList.length,
      libraryEducationId: lib.id,
    } as Parameters<typeof addEducation.mutate>[0])
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Education</h3>
        <div className="flex items-center gap-2">
          {libraryEntries.length > 0 && (
            <Select onValueChange={handleAddFromLibrary}>
              <SelectTrigger className="h-7 text-xs w-auto gap-1.5 border-dashed">
                <Library size={12} />
                <SelectValue placeholder="From Library" />
              </SelectTrigger>
              <SelectContent>
                {libraryEntries.map(entry => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.institution}{entry.degree ? ` — ${entry.degree}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={handleAdd}
          >
            <Plus size={12} />
            Add education
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={educationList.map(e => e.id)} strategy={verticalListSortingStrategy}>
          {educationList.map((edu, index) => (
            <SortableEducationCard
              key={edu.id}
              edu={edu}
              isFirst={index === 0}
              isLast={index === educationList.length - 1}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              onUpdate={data => updateEducation.mutate({ id: edu.id, ...data })}
              onDelete={() => deleteEducation.mutate(edu.id)}
              onUnlink={() => updateEducation.mutate({ id: edu.id, libraryEducationId: null })}
            />
          ))}
        </SortableContext>
      </DndContext>

      {educationList.length === 0 && (
        <p className="text-xs text-muted-foreground py-8 text-center">
          No education entries yet. Add one to get started.
        </p>
      )}
    </div>
  )
}
