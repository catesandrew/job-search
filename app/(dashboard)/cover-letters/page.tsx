'use client'

import { useState } from 'react'
import { useCoverLetters, useDeleteCoverLetter, type CoverLetter } from '@/hooks/use-cover-letters'
import { CreateCoverLetterDialog } from '@/components/cover-letters/create-cover-letter-dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Mail, Plus, Copy, Check, Trash2, ChevronDown, ChevronRight, ExternalLink, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Tab = 'cover' | 'outreach'

function DeleteConfirmDialog({
  open,
  title,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean
  title: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete cover letter?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          &ldquo;{title}&rdquo; will be permanently deleted.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-destructive hover:bg-destructive/90 text-white"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CoverLetterCard({ letter }: { letter: CoverLetter }) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('cover')
  const [copied, setCopied] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteMutation = useDeleteCoverLetter()

  const activeText = activeTab === 'cover' ? letter.content : (letter.outreachMessage ?? '')

  const handleCopy = async () => {
    if (!activeText) return
    await navigator.clipboard.writeText(activeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Card header */}
        <div
          role="button"
          tabIndex={0}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer select-none"
          onClick={() => setExpanded(e => !e)}
          onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
        >
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{letter.title}</p>
            <div className="flex items-center gap-3 mt-0.5">
              {letter.application && (
                <span className="text-xs text-muted-foreground">
                  {letter.application.company} — {letter.application.role}
                </span>
              )}
              {letter.resume && (
                <span className="text-xs text-muted-foreground/60">{letter.resume.title}</span>
              )}
              <span className="text-xs text-muted-foreground/50">
                {new Date(letter.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 ml-3 shrink-0">
            <Link
              href={`/cover-letters/${letter.id}`}
              onClick={e => e.stopPropagation()}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Edit cover letter"
            >
              <Pencil size={13} />
            </Link>
            {letter.application && (
              <Link
                href={`/applications/${letter.application.id}`}
                onClick={e => e.stopPropagation()}
                className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <ExternalLink size={13} />
              </Link>
            )}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setDeleteOpen(true) }}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={13} />
            </button>
            {expanded
              ? <ChevronDown size={14} className="text-muted-foreground" />
              : <ChevronRight size={14} className="text-muted-foreground" />}
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-border">
            {/* Tabs */}
            <div className="flex border-b border-border">
              {(['cover', 'outreach'] as Tab[]).map(tab => {
                if (tab === 'outreach' && !letter.outreachMessage) return null
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex-1 py-2 text-xs font-medium transition-colors',
                      activeTab === tab
                        ? 'border-b-2 border-foreground text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {tab === 'cover' ? 'Cover Letter' : 'Outreach Message'}
                  </button>
                )
              })}
            </div>

            <div className="p-4 space-y-3">
              <ScrollArea className="max-h-[280px] rounded-md border border-border bg-muted/30 p-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{activeText}</p>
              </ScrollArea>
              <div className="flex justify-end">
                <Button size="sm" className="gap-1.5 text-xs h-8" onClick={handleCopy}>
                  {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteOpen}
        title={letter.title}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(letter.id, { onSuccess: () => setDeleteOpen(false) })}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  )
}

export default function CoverLettersPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [newLetterId, setNewLetterId] = useState<string | null>(null)
  const { data: letters = [] as CoverLetter[], isLoading } = useCoverLetters()

  const handleCreated = (letter: CoverLetter) => {
    setCreateOpen(false)
    setNewLetterId(letter.id)
    setTimeout(() => setNewLetterId(null), 3000)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-muted-foreground" />
          <h1 className="text-sm font-semibold">Cover Letters</h1>
          {letters.length > 0 && (
            <span className="text-xs text-muted-foreground">({letters.length})</span>
          )}
        </div>
        <Button
          size="sm"
          className="gap-1.5 text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={13} />
          New Cover Letter
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        )}

        {!isLoading && letters.length === 0 && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="rounded-xl bg-primary/10 p-5 mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold mb-1">Create your first cover letter</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-5">
              Cover letters are a good way of introducing yourself to a potential employer.
              Select a resume and job application and let AI craft a tailored letter for you.
            </p>
            <Button
              className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={14} />
              Create Cover Letter
            </Button>
          </div>
        )}

        {!isLoading && letters.length > 0 && (
          <div className="space-y-3 max-w-3xl">
            {letters.map((letter: CoverLetter) => (
              <div
                key={letter.id}
                className={cn(
                  'transition-all',
                  newLetterId === letter.id && 'ring-2 ring-purple-500/50 rounded-lg'
                )}
              >
                <CoverLetterCard letter={letter} />
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateCoverLetterDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  )
}
