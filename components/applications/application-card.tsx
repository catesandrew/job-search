'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { type Application } from '@/hooks/use-applications'
import { Copy, FileText, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useDeleteApplication, useCloneApplication } from '@/hooks/use-applications'
import { cn } from '@/lib/utils'

interface ApplicationCardProps {
  application: Application
  /** True when rendered inside DragOverlay — disables drag listeners */
  overlay?: boolean
}

export function ApplicationCard({ application, overlay = false }: ApplicationCardProps) {
  const deleteApp = useDeleteApplication()
  const cloneApp = useCloneApplication()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    disabled: overlay,
  })

  const style = overlay
    ? { transform: CSS.Translate.toString(transform) }
    : { transform: CSS.Translate.toString(transform) }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(overlay ? {} : { ...attributes, ...listeners })}
      className={cn(
        'rounded-lg border border-border bg-card p-3 space-y-2 transition-colors group select-none',
        overlay
          ? 'shadow-2xl rotate-1 cursor-grabbing opacity-100'
          : 'cursor-grab active:cursor-grabbing hover:bg-card/80',
        isDragging && !overlay && 'opacity-40'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Prevent link navigation while dragging */}
        <Link
          href={`/applications/${application.id}`}
          className="flex-1 min-w-0"
          onClick={(e) => isDragging && e.preventDefault()}
          draggable={false}
        >
          <p className="font-medium text-sm truncate">{application.company}</p>
          <p className="text-xs text-muted-foreground truncate">{application.role}</p>
          {application.location && (
            <p className="text-xs text-muted-foreground truncate">
              {application.remote ? `${application.location} (Remote)` : application.location}
            </p>
          )}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/applications/${application.id}`}>Edit</Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => cloneApp.mutate(application.id)}
              disabled={cloneApp.isPending}
            >
              <Copy size={14} className="mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => deleteApp.mutate(application.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {application.linkedResume && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText size={11} />
          <span className="truncate">{application.linkedResume.title}</span>
        </div>
      )}
    </div>
  )
}
