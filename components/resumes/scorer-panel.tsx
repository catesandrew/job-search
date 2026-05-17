'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CheckResult, CheckCategory, ScoreResult } from '@/lib/scoring/resume-scorer'

interface ScorerPanelProps {
  resumeId: string
  applicationId?: string
  open: boolean
  onClose: () => void
}

type ActiveTab = 'quality' | 'jd'

const CATEGORY_LABELS: Record<CheckCategory, string> = {
  field_completion: 'Field Completion',
  content_quality: 'Content Quality',
  content_length: 'Content Length',
}

interface JdMatchResult {
  matchScore: number
  matchedRequired: string[]
  missingRequired: string[]
  matchedPreferred: string[]
  missingPreferred: string[]
  matchedKeywords: string[]
  missingKeywords: string[]
  experienceRequirements: string[]
  redFlags?: string[]
}

function StatusIcon({ status }: { status: CheckResult['status'] }) {
  if (status === 'pass') return <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
  if (status === 'warn') return <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
  return <XCircle size={14} className="text-destructive mt-0.5 shrink-0" />
}

function CategorySection({ category, checks }: { category: CheckCategory; checks: CheckResult[] }) {
  const [expanded, setExpanded] = useState(true)
  const passed = checks.filter(c => c.status === 'pass').length

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-foreground transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>{CATEGORY_LABELS[category]}</span>
        </div>
        <span className="text-xs text-muted-foreground">{passed}/{checks.length}</span>
      </button>
      {expanded && (
        <div className="space-y-1 pl-5">
          {checks.map(check => (
            <div key={check.id} className="flex items-start gap-2 py-1">
              <StatusIcon status={check.status} />
              <div className="min-w-0">
                <p className="text-sm">{check.label}</p>
                {check.detail && <p className="text-xs text-muted-foreground">{check.detail}</p>}
                {check.status !== 'pass' && check.recommendation && (
                  <p className="text-xs text-muted-foreground/80 italic mt-0.5">{check.recommendation}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ScoreRing({ score, label }: { score: number; label?: string }) {
  const circumference = 2 * Math.PI * 36
  const dashArray = (score / 100) * circumference
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke={color} strokeWidth="6"
            strokeDasharray={`${dashArray} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  )
}

function KeywordChips({ keywords, variant }: { keywords: string[]; variant: 'matched' | 'missing' | 'neutral' }) {
  if (keywords.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {keywords.map(kw => (
        <span
          key={kw}
          className={cn(
            'px-2 py-0.5 rounded-full text-xs font-medium',
            variant === 'matched' && 'bg-green-500/10 text-green-600 dark:text-green-400',
            variant === 'missing' && 'bg-red-500/10 text-red-600 dark:text-red-400',
            variant === 'neutral' && 'bg-muted text-muted-foreground',
          )}
        >
          {kw}
        </span>
      ))}
    </div>
  )
}

function JdMatchTab({ resumeId, applicationId }: { resumeId: string; applicationId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<JdMatchResult | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/ai/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeId, applicationId }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Analysis failed')
        setResult(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [resumeId, applicationId])

  if (loading) {
    return (
      <div className="space-y-4 py-2">
        <div className="flex justify-center py-4"><Skeleton className="w-24 h-24 rounded-full" /></div>
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
      </div>
    )
  }

  if (error) return <p className="text-sm text-destructive py-4">{error}</p>
  if (!result) return null

  return (
    <div className="space-y-5 py-2">
      <div className="flex justify-center">
        <ScoreRing score={result.matchScore} label="JD Match Score" />
      </div>

      {result.redFlags && result.redFlags.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-amber-600 flex items-center gap-1">
            <AlertTriangle size={12} />
            Red Flags ({result.redFlags.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.redFlags.map((flag, i) => (
              <span key={i} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded px-2 py-0.5 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.missingRequired.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
            Missing required skills ({result.missingRequired.length})
          </p>
          <KeywordChips keywords={result.missingRequired} variant="missing" />
        </div>
      )}

      {result.matchedRequired.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
            Matched required skills ({result.matchedRequired.length})
          </p>
          <KeywordChips keywords={result.matchedRequired} variant="matched" />
        </div>
      )}

      {(result.missingPreferred.length > 0 || result.matchedPreferred.length > 0) && (
        <>
          <Separator />
          {result.missingPreferred.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">
                Preferred skills to add ({result.missingPreferred.length})
              </p>
              <KeywordChips keywords={result.missingPreferred} variant="missing" />
            </div>
          )}
          {result.matchedPreferred.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Preferred skills matched ({result.matchedPreferred.length})
              </p>
              <KeywordChips keywords={result.matchedPreferred} variant="matched" />
            </div>
          )}
        </>
      )}

      {result.missingKeywords.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Keywords to consider
            </p>
            <KeywordChips keywords={result.missingKeywords.slice(0, 15)} variant="neutral" />
          </div>
        </>
      )}

      {result.experienceRequirements.length > 0 && (
        <>
          <Separator />
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Experience requirements
            </p>
            {result.experienceRequirements.map((req, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {req}</p>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function ScorerPanel({ resumeId, applicationId, open, onClose }: ScorerPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('quality')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ScoreResult | null>(null)

  useEffect(() => {
    if (!open) {
      setResult(null)
      setError(null)
      return
    }

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/ai/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeId }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Scoring failed')
        setResult(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [open, resumeId])

  const categories: CheckCategory[] = ['content_quality', 'content_length', 'field_completion']
  const recommendations = result?.checks.filter(c => c.status !== 'pass' && c.recommendation) ?? []

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle>Resume Analysis</SheetTitle>
          <SheetDescription>Score and checks for your resume</SheetDescription>
        </SheetHeader>

        <Separator />

        {/* Tabs — only show JD tab when applicationId provided */}
        {applicationId && (
          <div className="flex border-b border-border">
            {(['quality', 'jd'] as ActiveTab[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-2.5 text-xs font-medium transition-colors',
                  activeTab === tab
                    ? 'border-b-2 border-foreground text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab === 'quality' ? 'Resume Quality' : 'JD Match'}
              </button>
            ))}
          </div>
        )}

        <ScrollArea className="flex-1 px-6 py-4">
          {activeTab === 'jd' && applicationId ? (
            <JdMatchTab resumeId={resumeId} applicationId={applicationId} />
          ) : (
            <>
              {loading && (
                <div className="space-y-4">
                  <div className="flex justify-center py-4"><Skeleton className="w-24 h-24 rounded-full" /></div>
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              )}

              {error && !loading && <p className="text-sm text-destructive py-4">{error}</p>}

              {result && !loading && (
                <div className="space-y-6">
                  <div className="flex justify-center py-2">
                    <ScoreRing score={result.score} label="Resume Score" />
                  </div>

                  {recommendations.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold">Priority Fixes</h3>
                        {recommendations.slice(0, 5).map(check => (
                          <div key={check.id} className="flex items-start gap-2">
                            <StatusIcon status={check.status} />
                            <div className="min-w-0">
                              <p className="text-xs font-medium">{check.label}</p>
                              <p className="text-xs text-muted-foreground">{check.recommendation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="space-y-4">
                    {categories.map(cat => {
                      const catChecks = result.checks.filter(c => c.category === cat)
                      if (catChecks.length === 0) return null
                      return (
                        <div key={cat}>
                          <CategorySection category={cat} checks={catChecks} />
                          <Separator className="mt-3" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
