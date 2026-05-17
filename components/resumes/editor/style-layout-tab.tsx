'use client'

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
import { Resume, useUpdateResume } from '@/hooks/use-resume'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info, GripVertical, Eye, EyeOff, Lock } from 'lucide-react'

type Section = { name: string; visible: boolean; locked?: boolean }

interface StyleLayoutTabProps {
  resume: Resume
}

function SortableSection({
  section,
  onToggleVisibility,
}: {
  section: Section
  onToggleVisibility: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.name,
    disabled: !!section.locked,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 hover:bg-muted"
    >
      {section.locked ? (
        <Lock size={13} className="text-muted-foreground shrink-0" />
      ) : (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
        >
          <GripVertical size={13} />
        </div>
      )}
      <span className="flex-1 text-sm capitalize">{section.name}</span>
      <button
        type="button"
        onClick={onToggleVisibility}
        className="text-muted-foreground hover:text-foreground transition-colors"
        disabled={!!section.locked}
      >
        {section.visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
    </div>
  )
}

export function StyleLayoutTab({ resume }: StyleLayoutTabProps) {
  const updateResume = useUpdateResume()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const update = (data: Record<string, unknown>) => {
    updateResume.mutate({ id: resume.id, ...data })
  }

  const knownSections = ['summary', 'skills', 'experience', 'education', 'projects', 'repositories']

  const rawOrder = resume.sectionOrder ?? []
  const existingNames = new Set(rawOrder.map(s => s.name.toLowerCase()))
  const sectionOrder: Section[] = [
    ...rawOrder,
    ...knownSections
      .filter(n => !existingNames.has(n))
      .map(n => ({ name: n, visible: true })),
  ]

  const saveOrder = (updated: Section[]) => {
    update({ sectionOrder: JSON.stringify(updated) })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sectionOrder.findIndex(s => s.name === active.id)
    const newIndex = sectionOrder.findIndex(s => s.name === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    saveOrder(arrayMove(sectionOrder, oldIndex, newIndex))
  }

  const toggleVisibility = (index: number) => {
    if (sectionOrder[index].locked) return
    const updated = [...sectionOrder]
    updated[index] = { ...updated[index], visible: !updated[index].visible }
    saveOrder(updated)
  }

  return (
    <div className="px-4 py-4 space-y-8">
      {/* Typography */}
      <section>
        <h3 className="text-sm font-semibold mb-4">Style</h3>
        <h4 className="text-xs font-medium text-muted-foreground mb-3">Typography</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Font</Label>
            <Select value={resume.fontFamily} onValueChange={v => update({ fontFamily: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Garamond">Garamond</SelectItem>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Font Size</Label>
            <Select value={resume.fontSize} onValueChange={v => update({ fontSize: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Line Height</Label>
            <Select value={resume.lineHeight} onValueChange={v => update({ lineHeight: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="relaxed">Relaxed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Section Title Casing</Label>
            <Select value={resume.sectionTitleCasing} onValueChange={v => update({ sectionTitleCasing: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="capitalize">Capitalized</SelectItem>
                <SelectItem value="uppercase">Uppercase</SelectItem>
                <SelectItem value="lowercase">Lowercase</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Date Format</Label>
            <Select value={resume.dateFormat} onValueChange={v => update({ dateFormat: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short Name (Jan 2024)</SelectItem>
                <SelectItem value="full">Full Name (January 2024)</SelectItem>
                <SelectItem value="numeric">Numeric (01/2024)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Spacing */}
      <section>
        <h4 className="text-xs font-medium text-muted-foreground mb-3">Spacing</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Horizontal Margin</Label>
            <Select value={resume.marginH} onValueChange={v => update({ marginH: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="narrow">Narrow</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="wide">Wide</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Vertical Margin</Label>
            <Select value={resume.marginV} onValueChange={v => update({ marginV: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="relaxed">Relaxed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Page */}
      <section>
        <h4 className="text-xs font-medium text-muted-foreground mb-3">Page</h4>
        <div>
          <Label className="text-xs text-muted-foreground">Page Size</Label>
          <Select value={resume.pageSize} onValueChange={v => update({ pageSize: v })}>
            <SelectTrigger className="mt-1 w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="letter">Letter</SelectItem>
              <SelectItem value="a4">A4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Layout */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-semibold">Layout</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={13} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Drag to reorder · click eye to show/hide</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sectionOrder.map(s => s.name)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {sectionOrder.map((section, index) => (
                <SortableSection
                  key={section.name}
                  section={section}
                  onToggleVisibility={() => toggleVisibility(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>
    </div>
  )
}
