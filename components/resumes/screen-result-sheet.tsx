'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScreenScore } from '@/lib/ai/mcp-tools'

interface ScreenResultSheetProps {
  open: boolean
  onClose: () => void
  resumeId: string
}

const DIMENSION_LABELS: Record<string, string> = {
  roleFit: 'Role Fit',
  clarity: 'Clarity',
  senioritySignal: 'Seniority Signal',
  impact: 'Impact',
  credibility: 'Credibility',
  keywordAlignment: 'Keyword Alignment',
  formatting: 'Formatting',
  brevity: 'Brevity',
}

const DIMENSION_KEYS = [
  'roleFit',
  'clarity',
  'senioritySignal',
  'impact',
  'credibility',
  'keywordAlignment',
  'formatting',
  'brevity',
] as const

type DimensionKey = (typeof DIMENSION_KEYS)[number]

function scoreBarColor(score: number) {
  if (score >= 70) return 'bg-green-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function scoreTextColor(score: number) {
  if (score >= 70) return 'text-green-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-600'
}

export function ScreenResultSheet({ open, onClose, resumeId }: ScreenResultSheetProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ScreenScore | null>(null)
  const [copied, setCopied] = useState(false)

  const copyAsText = () => {
    if (!result) return
    const lines = [
      `Recruiter First Screen — Overall: ${result.overall}/100`,
      result.passedFirstScreen ? 'Decision: Would pass first screen' : 'Decision: Needs work before applying',
      '',
      ...DIMENSION_KEYS.map(key => {
        const score = result.dimensions[key as DimensionKey] ?? 0
        const feedback = result.feedback.find(f => f.dimension === key)
        const note = feedback?.note ? ` — ${feedback.note}` : ''
        return `${DIMENSION_LABELS[key]}: ${score}${note}`
      }),
    ]
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const runScreen = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/screen-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Screen simulation failed')
      if (!json.data) throw new Error('No result returned — check server logs')
      setResult(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Screen simulation failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) {
      setResult(null)
      setError(null)
      return
    }
    runScreen()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, resumeId])

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-[420px] sm:max-w-[420px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Recruiter First Screen</SheetTitle>
        </SheetHeader>

        {loading && (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={runScreen}>
              <RefreshCw size={13} />
              Try Again
            </Button>
          </div>
        )}

        {result && !loading && (
          <div className="mt-6 space-y-6">
            {/* Overall score */}
            <div className="flex flex-col items-center gap-2">
              <div className={cn('text-5xl font-bold tabular-nums', scoreTextColor(result.overall))}>
                {result.overall}
              </div>
              <div className="text-xs text-muted-foreground">/ 100</div>
              <span
                className={cn(
                  'text-xs font-medium px-3 py-1 rounded-full',
                  result.passedFirstScreen
                    ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
                )}
              >
                {result.passedFirstScreen ? 'Would pass first screen' : 'Needs work before applying'}
              </span>
            </div>

            {/* Dimension rows */}
            <div className="space-y-4">
              {DIMENSION_KEYS.map(key => {
                const score = result.dimensions[key as DimensionKey] ?? 0
                const feedback = result.feedback.find(f => f.dimension === key)
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{DIMENSION_LABELS[key]}</span>
                      <span className={cn('font-semibold tabular-nums', scoreTextColor(score))}>
                        {score}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', scoreBarColor(score))}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    {feedback?.note && (
                      <p className="text-xs text-muted-foreground">{feedback.note}</p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={copyAsText}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy as Text'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5"
                onClick={runScreen}
                disabled={loading}
              >
                <RefreshCw size={13} className={cn(loading && 'animate-spin')} />
                Re-run Screen
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
