'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { type Application, useUpdateApplication } from '@/hooks/use-applications'
import { KanbanColumn } from './kanban-column'
import { ApplicationCard } from './application-card'

const STATUSES = ['WISHLIST', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED'] as const
type Status = typeof STATUSES[number]

interface KanbanBoardProps {
  applications: Application[]
}

export function KanbanBoard({ applications }: KanbanBoardProps) {
  const [localApps, setLocalApps] = useState(applications)
  const [activeId, setActiveId] = useState<string | null>(null)
  const updateApp = useUpdateApplication()

  // Sync from server data (but don't overwrite while dragging)
  useEffect(() => {
    if (!activeId) setLocalApps(applications)
  }, [applications, activeId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const byStatus = STATUSES.reduce<Record<string, Application[]>>((acc, status) => {
    acc[status] = localApps.filter((a) => a.status === status)
    return acc
  }, {})

  const activeApp = activeId ? localApps.find((a) => a.id === activeId) : null

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over) return

    const newStatus = over.id as Status
    const app = localApps.find((a) => a.id === active.id)
    if (!app || app.status === newStatus) return

    // Optimistic local update
    setLocalApps((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status: newStatus } : a))
    )

    updateApp.mutate({ id: app.id, status: newStatus })
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            applications={byStatus[status]}
          />
        ))}
        <div className="min-w-4 shrink-0" />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeApp ? <ApplicationCard application={activeApp} overlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}
