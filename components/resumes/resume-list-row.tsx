'use client'

import { Resume, useCloneResume } from '@/hooks/use-resume'
import { FileText, MoreHorizontal, Pencil, Trash2, Link2, Copy } from 'lucide-react'
import { useToast } from '@/lib/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ResumeListRowProps {
  resume: Resume
  onDelete: (id: string) => void
}

export function ResumeListRow({ resume, onDelete }: ResumeListRowProps) {
  const cloneResume = useCloneResume()
  const { toast } = useToast()
  const date = new Date(resume.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const linkedCount = resume._count?.applications ?? 0

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-white/5 group">
      <FileText size={16} className="text-muted-foreground shrink-0" />
      <Link
        href={`/resumes/${resume.id}/edit`}
        className="flex-1 text-sm font-medium hover:text-mint transition-colors truncate"
      >
        {resume.title}
      </Link>
      {linkedCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 text-xs text-blue-400 shrink-0">
                <Link2 size={11} />
                {linkedCount}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Linked to {linkedCount} application{linkedCount === 1 ? '' : 's'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <span className="text-xs text-muted-foreground shrink-0">{date}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
          >
            <MoreHorizontal size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/resumes/${resume.id}/edit`}>
              <Pencil size={14} className="mr-2" />
              Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => cloneResume.mutate(resume.id, {
              onSuccess: () => toast({ title: 'Resume duplicated' }),
              onError: (err: Error) => toast({ title: 'Duplicate failed', description: err.message, variant: 'destructive' }),
            })}
            disabled={cloneResume.isPending}
          >
            <Copy size={14} className="mr-2" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            className={linkedCount > 0 ? 'text-muted-foreground cursor-not-allowed' : 'text-destructive'}
            onClick={() => linkedCount === 0 && onDelete(resume.id)}
          >
            <Trash2 size={14} className="mr-2" />
            {linkedCount > 0 ? `In use (${linkedCount})` : 'Delete'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
