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
  Position,
  useAddPosition,
  useUpdatePosition,
  useDeletePosition,
  useAddBullet,
  useUpdateBullet,
} from '@/hooks/use-resume'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { RichTextEditor } from '@/components/rich-text-editor'
import { CompanyCard } from '@/components/resumes/company-card'
import { Building2, User, Plus, Sparkles, Hash } from 'lucide-react'
import { EnhanceBulletsModal } from '@/components/resumes/editor/enhance-bullets-modal'

const underlineInput =
  'w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-mint transition-colors'

interface ExperienceTabProps {
  resume: Resume
}

function groupByCompany(positions: Position[]): [string, Position[]][] {
  const map = new Map<string, Position[]>()
  for (const pos of positions) {
    const key = pos.company || 'Untitled Company'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(pos)
  }
  return Array.from(map.entries()).sort(([, a], [, b]) => {
    const minA = Math.min(...a.map(p => p.sortOrder))
    const minB = Math.min(...b.map(p => p.sortOrder))
    return minA - minB
  })
}

interface SortableCompanyCardProps {
  company: string
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  children: React.ReactNode
}

function SortableCompanyCard({
  company,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  children,
}: SortableCompanyCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: company,
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
        icon={Building2}
        iconColor="text-green-400"
        title={company}
        titleColor="text-mint"
        onDelete={onDelete}
        onMoveUp={isFirst ? undefined : onMoveUp}
        onMoveDown={isLast ? undefined : onMoveDown}
        dragHandleProps={{ ...attributes, ...listeners }}
      >
        {children}
      </CompanyCard>
    </div>
  )
}

export function ExperienceTab({ resume }: ExperienceTabProps) {
  const addPosition = useAddPosition(resume.id)
  const updatePosition = useUpdatePosition(resume.id)
  const deletePosition = useDeletePosition(resume.id)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const positions = (resume.positions ?? []).sort((a, b) => a.sortOrder - b.sortOrder)
  const companyGroups = groupByCompany(positions)

  const persistOrder = useCallback(
    (ordered: [string, Position[]][]) => {
      ordered.forEach(([, groupPositions], groupIndex) => {
        groupPositions.forEach((pos, localIndex) => {
          updatePosition.mutate({ id: pos.id, sortOrder: groupIndex * 1000 + localIndex })
        })
      })
    },
    [updatePosition]
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = companyGroups.findIndex(([c]) => c === active.id)
    const newIndex = companyGroups.findIndex(([c]) => c === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    persistOrder(arrayMove(companyGroups, oldIndex, newIndex))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const reordered = [...companyGroups]
    ;[reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]]
    persistOrder(reordered)
  }

  const handleMoveDown = (index: number) => {
    if (index === companyGroups.length - 1) return
    const reordered = [...companyGroups]
    ;[reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]]
    persistOrder(reordered)
  }

  const handleAddCompany = () => {
    addPosition.mutate({
      company: 'New Company',
      title: 'Position Title',
      current: false,
      hidden: false,
      sortOrder: companyGroups.length * 1000,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Work Experience</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={handleAddCompany}
        >
          <Plus size={12} />
          Add company experience
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={companyGroups.map(([c]) => c)}
          strategy={verticalListSortingStrategy}
        >
          {companyGroups.map(([company, companyPositions], index) => (
            <SortableCompanyCard
              key={company}
              company={company}
              isFirst={index === 0}
              isLast={index === companyGroups.length - 1}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              onDelete={() => companyPositions.forEach(p => deletePosition.mutate(p.id))}
            >
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Company Name</Label>
                  <input
                    defaultValue={company}
                    onBlur={e => {
                      companyPositions.forEach(p =>
                        updatePosition.mutate({ id: p.id, company: e.target.value })
                      )
                    }}
                    className={underlineInput}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Company Description</Label>
                  <input
                    defaultValue={companyPositions[0]?.companyDesc ?? ''}
                    onBlur={e => {
                      companyPositions.forEach(p =>
                        updatePosition.mutate({ id: p.id, companyDesc: e.target.value })
                      )
                    }}
                    className={underlineInput}
                  />
                </div>

                {companyPositions.map(position => (
                  <PositionBlock
                    key={position.id}
                    position={position}
                    resumeId={resume.id}
                    onUpdate={data => updatePosition.mutate({ id: position.id, ...data })}
                    onDelete={() => deletePosition.mutate(position.id)}
                  />
                ))}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 w-full justify-center"
                  onClick={() =>
                    addPosition.mutate({
                      company,
                      companyDesc: companyPositions[0]?.companyDesc,
                      title: 'New Position',
                      current: false,
                      hidden: false,
                      sortOrder: companyGroups.length * 1000 + companyPositions.length,
                    })
                  }
                >
                  <Plus size={12} />
                  Add another position
                </Button>
              </div>
            </SortableCompanyCard>
          ))}
        </SortableContext>
      </DndContext>

      {positions.length === 0 && (
        <p className="text-xs text-muted-foreground py-8 text-center">
          No work experience yet. Add a company to get started.
        </p>
      )}
    </div>
  )
}

// --- Position Block ---

interface PositionBlockProps {
  position: Position
  resumeId: string
  onUpdate: (data: Partial<Position>) => void
  onDelete: () => void
}

function PositionBlock({ position, resumeId, onUpdate, onDelete }: PositionBlockProps) {
  const addBullet = useAddBullet(resumeId, position.id)
  const updateBullet = useUpdateBullet(resumeId, position.id)
  const [currentToggle, setCurrentToggle] = useState(position.current)
  const [showEnhanceModal, setShowEnhanceModal] = useState(false)
  const [quantifying, setQuantifying] = useState(false)

  const bullets = (position.bullets ?? []).sort((a, b) => a.sortOrder - b.sortOrder)

  const handleQuantify = async () => {
    if (!bullets.length) return
    setQuantifying(true)
    try {
      const res = await fetch('/api/ai/quantify-bullets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positionTitle: position.title,
          company: position.company,
          bullets: bullets.map(b => ({
            id: b.id,
            text: b.content.replace(/<[^>]+>/g, ' ').trim(),
          })),
        }),
      })
      if (!res.ok) return
      const { enhanced } = await res.json() as { enhanced: Array<{ id: string; text: string }> }
      for (const item of enhanced) {
        updateBullet.mutate({ id: item.id, content: item.text })
      }
    } finally {
      setQuantifying(false)
    }
  }

  const handleBulletChange = (html: string) => {
    if (bullets.length > 0) {
      updateBullet.mutate({ id: bullets[0].id, content: html })
    } else {
      addBullet.mutate({ content: html, hidden: false, sortOrder: 0 })
    }
  }

  return (
    <div className="pl-4 border-l-2 border-border space-y-3">
      <div className="flex items-center gap-2">
        <User size={13} className="text-blue-400 shrink-0" />
        <span className="text-sm font-medium flex-1">{position.title}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-destructive"
          onClick={onDelete}
        >
          Remove
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Position Title</Label>
          <input
            defaultValue={position.title}
            onBlur={e => onUpdate({ title: e.target.value })}
            className="w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-mint transition-colors"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Location</Label>
          <input
            defaultValue={position.location ?? ''}
            onBlur={e => onUpdate({ location: e.target.value })}
            className="w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-mint transition-colors"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Start Date</Label>
          <input
            defaultValue={position.startDate ?? ''}
            onBlur={e => onUpdate({ startDate: e.target.value })}
            placeholder="e.g. Jan 2023"
            className="w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-mint transition-colors"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">End Date</Label>
          <input
            defaultValue={position.endDate ?? ''}
            onBlur={e => onUpdate({ endDate: e.target.value })}
            placeholder="e.g. Dec 2024"
            disabled={currentToggle}
            className="w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-mint transition-colors disabled:opacity-50"
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
        <Label className="text-xs font-normal text-muted-foreground">Currently in position</Label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs text-muted-foreground">Achievements</Label>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 text-purple-400 hover:text-purple-300"
              disabled={quantifying}
              onClick={handleQuantify}
            >
              <Hash size={11} />
              {quantifying ? 'Quantifying…' : 'Quantify'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 text-purple-400 hover:text-purple-300"
              onClick={() => setShowEnhanceModal(true)}
            >
              <Sparkles size={11} />
              Ask AI
            </Button>
          </div>
        </div>
        <RichTextEditor
          value={bullets.map(b => b.content).join('')}
          onChange={handleBulletChange}
          placeholder="Describe your key achievements..."
          minHeight="80px"
        />
      </div>

      <EnhanceBulletsModal
        positionTitle={position.title}
        company={position.company}
        bulletsHtml={bullets.map(b => b.content).join('')}
        open={showEnhanceModal}
        onClose={() => setShowEnhanceModal(false)}
        onApply={html => {
          if (bullets.length > 0) {
            updateBullet.mutate({ id: bullets[0].id, content: html })
          } else {
            addBullet.mutate({ content: html, hidden: false, sortOrder: 0 })
          }
        }}
      />
    </div>
  )
}
