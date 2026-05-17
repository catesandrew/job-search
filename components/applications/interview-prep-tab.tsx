'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Brain, ChevronDown, ChevronRight, RefreshCw, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInterviewPrep, useGenerateInterviewPrep, useSaveInterviewQuestions } from '@/hooks/use-mcp-tools'
import type { InterviewQuestion } from '@/lib/ai/mcp-tools'

interface InterviewPrepTabProps {
  applicationId: string
  hasJobDescription: boolean
  interviewQuestions: string[]
}

const PROB_STYLES = {
  high: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  low: 'bg-muted text-muted-foreground',
}

const PROB_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }

function QuestionCard({ q }: { q: InterviewQuestion }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        type="button"
        className="w-full flex items-start gap-2 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5 flex-wrap">
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', PROB_STYLES[q.probability])}>
            {q.probability}
          </span>
          <span className="text-xs border rounded px-2 py-0.5 text-muted-foreground capitalize">
            {q.category}
          </span>
          {q.source === 'provided' && (
            <span className="text-xs border border-purple-400/50 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded px-2 py-0.5">
              provided
            </span>
          )}
        </div>
        <span className="text-sm font-medium flex-1">{q.question}</span>
        <span className="shrink-0 mt-0.5 text-muted-foreground">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4 space-y-3">
          {(['situation', 'task', 'action', 'result'] as const).map((key) => (
            <div key={key}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </p>
              <p className="text-sm">{q.starFramework[key]}</p>
            </div>
          ))}
          {q.suggestedAnswer && (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Suggested Answer</p>
              <p className="text-sm italic text-muted-foreground">{q.suggestedAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function KnownQuestionsPanel({
  applicationId,
  questions,
}: {
  applicationId: string
  questions: string[]
}) {
  const [items, setItems] = useState<string[]>(questions)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const save = useSaveInterviewQuestions(applicationId)

  function commit(updated: string[]) {
    setItems(updated)
    save.mutate(updated)
  }

  function add() {
    const trimmed = draft.trim()
    if (!trimmed) return
    commit([...items, trimmed])
    setDraft('')
    inputRef.current?.focus()
  }

  function remove(idx: number) {
    commit(items.filter((_, i) => i !== idx))
  }

  return (
    <div className="border border-border rounded-lg bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Known Questions
        </p>
        <span className="text-xs text-muted-foreground/60">— provided by the company ahead of time</span>
      </div>

      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((q, i) => (
            <li key={i} className="flex items-start gap-2 group">
              <span className="text-sm flex-1 pt-0.5">{q}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 mt-0.5"
                aria-label="Remove question"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Paste a question from the company…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') add() }}
          className="flex-1 h-8 text-sm"
        />
        <Button size="sm" variant="outline" onClick={add} disabled={!draft.trim()} className="h-8 px-3">
          <Plus size={13} />
        </Button>
      </div>
      {items.length > 0 && (
        <p className="text-xs text-muted-foreground/60">
          These will be answered first when you generate or regenerate prep.
        </p>
      )}
    </div>
  )
}

export function InterviewPrepTab({ applicationId, hasJobDescription, interviewQuestions }: InterviewPrepTabProps) {
  const { data: prep, isLoading } = useInterviewPrep(applicationId)
  const generatePrep = useGenerateInterviewPrep(applicationId)

  if (!hasJobDescription) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <div>
          <Brain size={32} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">
            Add a job description to this application to generate interview prep.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const sorted = prep
    ? [...prep.questions].sort((a, b) => PROB_ORDER[a.probability] - PROB_ORDER[b.probability])
    : []

  return (
    <div className="space-y-4 p-4">
      {/* Known questions panel — always visible */}
      <KnownQuestionsPanel applicationId={applicationId} questions={interviewQuestions} />

      {!prep ? (
        <div className="flex flex-col items-center py-8 text-center gap-4">
          <Brain size={32} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Generate STAR-method interview questions ranked by probability.
          </p>
          <Button
            size="sm"
            className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => generatePrep.mutate()}
            disabled={generatePrep.isPending}
          >
            <Brain size={13} className={cn(generatePrep.isPending && 'animate-pulse')} />
            {generatePrep.isPending ? 'Generating…' : 'Generate Interview Prep'}
          </Button>
          {generatePrep.error && (
            <p className="text-xs text-destructive">{(generatePrep.error as Error).message}</p>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Generated{' '}
              {new Date(prep.generatedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => generatePrep.mutate()}
              disabled={generatePrep.isPending}
            >
              <RefreshCw size={12} className={cn(generatePrep.isPending && 'animate-spin')} />
              Regenerate
            </Button>
          </div>

          <div className="space-y-2">
            {sorted.map((q, i) => (
              <QuestionCard key={i} q={q} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
