'use client'

import { useDroppable } from '@dnd-kit/core'
import { type Application } from '@/hooks/use-applications'
import { ApplicationCard } from './application-card'
import { MoreHorizontal, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  WISHLIST: 'bg-blue-400',
  APPLIED: 'bg-yellow-400',
  INTERVIEWING: 'bg-orange-400',
  OFFER: 'bg-green-400',
  REJECTED: 'bg-pink-400',
}

const STATUS_LABELS: Record<string, string> = {
  WISHLIST: 'Wishlist',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
}

interface KanbanColumnProps {
  status: string
  applications: Application[]
}

export function KanbanColumn({ status, applications }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px]">
      {/* Column header */}
      <div className="rounded-lg bg-card border border-border px-3 py-2.5 flex items-center gap-2 mb-3">
        <div className={cn('w-2 h-2 rounded-full shrink-0', STATUS_COLORS[status])} />
        <span className="text-sm font-medium flex-1">{STATUS_LABELS[status]}</span>
        <span className="text-xs text-muted-foreground">{applications.length}</span>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
          <MoreHorizontal size={14} />
        </Button>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" asChild>
          <Link href={`/applications/new?status=${status}`}>
            <Plus size={14} />
          </Link>
        </Button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 flex-1 rounded-lg transition-colors min-h-[60px] p-1 -m-1',
          isOver && 'bg-white/5 ring-1 ring-white/10'
        )}
      >
        {applications.map((app) => (
          <ApplicationCard key={app.id} application={app} />
        ))}
      </div>
    </div>
  )
}
