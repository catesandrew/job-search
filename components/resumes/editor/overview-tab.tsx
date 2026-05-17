'use client'

import { useState, useEffect, KeyboardEvent } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Resume,
  SkillCategory,
  useUpdateProfile,
  useAddSkillCategory,
  useUpdateSkillCategory,
  useDeleteSkillCategory,
} from '@/hooks/use-resume'
import { useForm } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/rich-text-editor'
import { SkillChip } from '@/components/resumes/skill-chip'
import { CompanyCard } from '@/components/resumes/company-card'
import { Info, Sparkles, ListIcon, Plus } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { GenerateSummaryModal } from '@/components/resumes/editor/generate-summary-modal'

const underlineInput =
  'w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-mint transition-colors'

interface OverviewTabProps {
  resume: Resume
}

export function OverviewTab({ resume }: OverviewTabProps) {
  const updateProfile = useUpdateProfile(resume.id)
  const addSkillCategory = useAddSkillCategory(resume.id)
  const updateSkillCategory = useUpdateSkillCategory(resume.id)
  const deleteSkillCategory = useDeleteSkillCategory(resume.id)
  const [showAiModal, setShowAiModal] = useState(false)

  const { register, handleSubmit } = useForm({
    defaultValues: {
      targetTitle: resume.profile?.targetTitle ?? '',
    },
  })

  const [summary, setSummary] = useState(resume.profile?.summary ?? '')
  useEffect(() => {
    setSummary(resume.profile?.summary ?? '')
  }, [resume.profile?.summary])

  const saveTitle = handleSubmit(data => {
    updateProfile.mutate({ targetTitle: data.targetTitle })
  })

  const saveSummary = (html: string) => {
    setSummary(html)
    updateProfile.mutate({ summary: html })
  }

  const handleAskAI = () => setShowAiModal(true)

  const handleAddCategory = () => {
    addSkillCategory.mutate({
      name: 'New Category',
      skills: '[]',
      sortOrder: (resume.skills?.length ?? 0) + 1,
    })
  }

  const sortedSkills = [...(resume.skills ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleSkillDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const oldIdx = sortedSkills.findIndex(s => s.id === active.id)
    const newIdx = sortedSkills.findIndex(s => s.id === over.id)
    const reordered = arrayMove(sortedSkills, oldIdx, newIdx)
    reordered.forEach((cat, idx) => {
      if (cat.sortOrder !== idx) updateSkillCategory.mutate({ id: cat.id, sortOrder: idx })
    })
  }

  function moveSkill(id: string, direction: 'up' | 'down') {
    const idx = sortedSkills.findIndex(s => s.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sortedSkills.length) return
    const a = sortedSkills[idx], b = sortedSkills[swapIdx]
    updateSkillCategory.mutate({ id: a.id, sortOrder: b.sortOrder })
    updateSkillCategory.mutate({ id: b.id, sortOrder: a.sortOrder })
  }

  return (
    <div className="space-y-8">
      {/* Target Title */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold">Target Title</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={13} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[220px]">A specific job position placed at the top of your resume that clearly communicates the role you&apos;re applying for.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <input
          {...register('targetTitle')}
          onBlur={saveTitle}
          className={underlineInput}
          placeholder="e.g. Senior Software Engineer"
        />
      </section>

      {/* Professional Summary */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Professional Summary</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-purple-400 hover:text-purple-300"
            onClick={handleAskAI}
          >
            <Sparkles size={12} />
            Ask AI
          </Button>
        </div>
        <RichTextEditor
          value={summary}
          onChange={saveSummary}
          placeholder="Write a brief professional summary..."
          minHeight="100px"
        />
      </section>

      <GenerateSummaryModal
        resumeId={resume.id}
        hasSummary={!!summary}
        open={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApply={saveSummary}
      />

      {/* Skills */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Skills</h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={handleAddCategory}
          >
            <Plus size={12} />
            Add skill category
          </Button>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSkillDragEnd}>
          <SortableContext items={sortedSkills.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sortedSkills.map((category, idx) => (
                <SortableSkillCard
                  key={category.id}
                  category={category}
                  onUpdate={(data) => updateSkillCategory.mutate({ id: category.id, ...data })}
                  onDelete={() => deleteSkillCategory.mutate(category.id)}
                  onMoveUp={idx > 0 ? () => moveSkill(category.id, 'up') : undefined}
                  onMoveDown={idx < sortedSkills.length - 1 ? () => moveSkill(category.id, 'down') : undefined}
                />
              ))}
              {sortedSkills.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No skill categories yet. Add one to get started.
                </p>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </section>
    </div>
  )
}

// --- Sortable wrapper ---

interface SortableSkillCardProps {
  category: SkillCategory
  onUpdate: (data: Partial<SkillCategory>) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

function SortableSkillCard({ category, onUpdate, onDelete, onMoveUp, onMoveDown }: SortableSkillCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <SkillCategoryCard
        category={category}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

// --- Skill Category Card ---

interface SkillCategoryCardProps {
  category: SkillCategory
  onUpdate: (data: Partial<SkillCategory>) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

function SkillCategoryCard({ category, onUpdate, onDelete, onMoveUp, onMoveDown, dragHandleProps }: SkillCategoryCardProps) {
  const [newSkill, setNewSkill] = useState('')

  const parseSkills = (): string[] => {
    try {
      return JSON.parse(category.skills)
    } catch {
      return []
    }
  }

  const skills = parseSkills()

  const addSkill = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      e.preventDefault()
      const updated = [...skills, newSkill.trim()]
      onUpdate({ skills: JSON.stringify(updated) })
      setNewSkill('')
    }
  }

  const removeSkill = (index: number) => {
    const updated = skills.filter((_, i) => i !== index)
    onUpdate({ skills: JSON.stringify(updated) })
  }

  return (
    <CompanyCard
      icon={ListIcon}
      iconColor="text-orange-400"
      title={category.name}
      onDelete={onDelete}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      dragHandleProps={dragHandleProps}
      defaultOpen={true}
    >
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Category Name</Label>
          <input
            defaultValue={category.name}
            onBlur={e => onUpdate({ name: e.target.value })}
            className="w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-mint transition-colors"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">
            Skills (press Enter to add)
          </Label>
          <input
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            onKeyDown={addSkill}
            placeholder="Type a skill and press Enter"
            className="w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-mint transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {skills.map((skill, i) => (
            <SkillChip key={`${skill}-${i}`} label={skill} onRemove={() => removeSkill(i)} />
          ))}
        </div>
      </div>
    </CompanyCard>
  )
}
