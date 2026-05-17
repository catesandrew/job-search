'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, MoreHorizontal, GripVertical, ArrowUp, ArrowDown, Copy } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface CompanyCardProps {
  icon: LucideIcon
  iconColor?: string
  title: string
  titleColor?: string
  onClone?: () => void
  onDelete?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  children: React.ReactNode
  defaultOpen?: boolean
}

export function CompanyCard({
  icon: Icon,
  iconColor = 'text-green-400',
  title,
  titleColor,
  onClone,
  onDelete,
  onMoveUp,
  onMoveDown,
  dragHandleProps,
  children,
  defaultOpen = true,
}: CompanyCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  const hasMenuItems = onClone || onMoveUp || onMoveDown || onDelete

  return (
    <div className="rounded-lg border border-border bg-card mb-3">
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0 touch-none"
          >
            <GripVertical size={14} />
          </div>
        )}
        <Icon size={15} className={cn('shrink-0', iconColor)} />
        <span className={cn('flex-1 text-sm font-medium truncate', titleColor)}>
          {title}
        </span>
        {hasMenuItems && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal size={13} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onMoveUp && (
                <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onMoveUp() }}>
                  <ArrowUp size={13} className="mr-2" />
                  Move up
                </DropdownMenuItem>
              )}
              {onMoveDown && (
                <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onMoveDown() }}>
                  <ArrowDown size={13} className="mr-2" />
                  Move down
                </DropdownMenuItem>
              )}
              {onClone && (
                <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClone() }}>
                  <Copy size={13} className="mr-2" />
                  Duplicate
                </DropdownMenuItem>
              )}
              {(onMoveUp || onMoveDown || onClone) && onDelete && <DropdownMenuSeparator />}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete() }}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {open ? (
          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
        )}
      </div>
      {open && (
        <div className="px-3 pb-3 border-t border-border pt-3">{children}</div>
      )}
    </div>
  )
}
