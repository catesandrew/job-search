'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, ArrowRight, Check, RefreshCw, Sparkles, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApplications } from '@/hooks/use-applications'
import type { Application } from '@/hooks/use-applications'
import type { ImproveIteration, BulletProposal } from '@/lib/ai/resume-improver'

interface ImproveDialogProps {
  resumeId: string
  open: boolean
  onClose: () => void
  onApplied?: () => void
}

type Step = 'config' | 'running' | 'review' | 'applying' | 'done'

const proposalKey = (p: BulletProposal) =>
  p.paragraphIndex !== undefined ? `${p.bulletId}::${p.paragraphIndex}` : p.bulletId

const DIMENSION_LABELS: Record<string, string> = {
  impact: 'Impact & Metrics',
  clarity: 'Clarity & Action Verbs',
  brevity: 'Brevity',
  keywordAlignment: 'Keyword Alignment',
  senioritySignal: 'Seniority Signal',
  credibility: 'Credibility',
  roleFit: 'Role Fit',
  formatting: 'Formatting',
  none: 'None',
}

export function ImproveDialog({ resumeId, open, onClose, onApplied }: ImproveDialogProps) {
  const [step, setStep] = useState<Step>('config')
  const [targetScore, setTargetScore] = useState(90)
  const [maxIterations, setMaxIterations] = useState(3)
  const [iteration, setIteration] = useState(1)
  const [currentResult, setCurrentResult] = useState<ImproveIteration | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [scoreHistory, setScoreHistory] = useState<{ local: number; ai: number | null }[]>([])
  const [totalApplied, setTotalApplied] = useState(0)
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const [stopReason, setStopReason] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [linkedAppId, setLinkedAppId] = useState<string | undefined>(undefined)

  const { data: applications = [] } = useApplications()

  // Auto-detect linked application
  useEffect(() => {
    if (!applications.length) return
    const linked = applications.find((a: Application) => a.linkedResumeId === resumeId)
    if (linked) setLinkedAppId(linked.id)
  }, [applications, resumeId])

  // Reset on open
  useEffect(() => {
    if (!open) {
      setStep('config')
      setIteration(1)
      setCurrentResult(null)
      setSelected(new Set())
      setScoreHistory([])
      setTotalApplied(0)
      setFinalScore(null)
      setStopReason(null)
      setError(null)
    }
  }, [open])

  const runIterate = async (iterNum: number) => {
    setStep('running')
    setError(null)
    try {
      const res = await fetch('/api/ai/improve-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          applicationId: linkedAppId,
          targetScore,
          maxIterations,
          iteration: iterNum,
          runAiScreen: iterNum % 2 === 1,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Iteration failed')
      const result: ImproveIteration = json.data
      setCurrentResult(result)
      setScoreHistory(prev => [...prev, { local: result.localScore, ai: result.aiScore }])

      if (result.stopReason) {
        setFinalScore(result.localScore)
        setStopReason(result.stopReason)
        setStep('done')
        return
      }

      // Select all proposals by default
      setSelected(new Set(result.proposals.map(proposalKey)))
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Iteration failed')
      setStep('review') // show error in review area
    }
  }

  const handleStart = () => runIterate(1)

  const handleApply = async () => {
    if (!currentResult) return
    const toApply = currentResult.proposals.filter(p => selected.has(proposalKey(p)))
    if (toApply.length === 0) {
      // Skip this iteration
      advanceOrFinish(currentResult.localScore, 0)
      return
    }

    setStep('applying')
    try {
      const res = await fetch('/api/ai/improve-resume/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, proposals: toApply }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Apply failed')
      const { updatedCount, newLocalScore } = json.data as { updatedCount: number; newLocalScore: number }
      setTotalApplied(prev => prev + updatedCount)
      onApplied?.()
      advanceOrFinish(newLocalScore, updatedCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Apply failed')
      setStep('review')
    }
  }

  const advanceOrFinish = (newScore: number, applied: number) => {
    const nextIter = iteration + 1
    if (newScore >= targetScore) {
      setFinalScore(newScore)
      setStopReason('threshold_met')
      setStep('done')
    } else if (nextIter > maxIterations) {
      setFinalScore(newScore)
      setStopReason('max_iterations')
      setStep('done')
    } else if (applied === 0) {
      setFinalScore(newScore)
      setStopReason('no_improvement')
      setStep('done')
    } else {
      setIteration(nextIter)
      runIterate(nextIter)
    }
  }

  const handleSkip = () => {
    if (!currentResult) return
    const nextIter = iteration + 1
    if (nextIter > maxIterations) {
      setFinalScore(currentResult.localScore)
      setStopReason('max_iterations')
      setStep('done')
    } else {
      setIteration(nextIter)
      runIterate(nextIter)
    }
  }

  const toggleProposal = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const prevScore = scoreHistory.length >= 2 ? scoreHistory[scoreHistory.length - 2].local : null
  const currentScore = scoreHistory.length > 0 ? scoreHistory[scoreHistory.length - 1].local : null
  const isRegression = prevScore !== null && currentScore !== null && currentScore < prevScore - 5

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-400" />
            Auto-Improve Resume
            {iteration > 1 && step !== 'config' && (
              <Badge variant="secondary" className="text-xs ml-1">
                Iteration {iteration} / {maxIterations}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">

          {/* ── Config ───────────────────────────────────────────── */}
          {step === 'config' && (
            <div className="space-y-5 py-2">
              <p className="text-sm text-muted-foreground">
                The agent will score your resume, identify the weakest dimension, rewrite targeted
                bullets, and ask for approval before saving — repeating until your score meets the
                target or iterations are exhausted.
              </p>

              {linkedAppId && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground rounded-md border border-border px-3 py-2">
                  <Check size={12} className="text-green-500 shrink-0" />
                  Linked application detected — job description will be used for context
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Target Score</label>
                  <span className="text-sm font-semibold tabular-nums">{targetScore}</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={90}
                  step={5}
                  value={targetScore}
                  onChange={e => setTargetScore(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50</span><span>70</span><span>90</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Max Iterations</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setMaxIterations(n)}
                      className={cn(
                        'flex-1 py-1.5 rounded-md border text-sm font-medium transition-colors',
                        maxIterations === n
                          ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button
                  onClick={handleStart}
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                >
                  <Sparkles size={14} />
                  Start Improving
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── Running ──────────────────────────────────────────── */}
          {step === 'running' && (
            <div className="py-6 space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw size={16} className="animate-spin text-purple-400 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Iteration {iteration} — analyzing{currentResult ? ` dimension: ${DIMENSION_LABELS[currentResult.weakestDimension] ?? currentResult.weakestDimension}` : ' resume…'}
                </p>
              </div>
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          )}

          {/* ── Review ───────────────────────────────────────────── */}
          {(step === 'review' || step === 'applying') && currentResult && (
            <div className="flex flex-col gap-4 h-full">
              {/* Score bar */}
              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs text-muted-foreground">Local score:</span>
                <span className="text-sm font-semibold tabular-nums">{currentResult.localScore}</span>
                {currentResult.aiScore !== null && (
                  <>
                    <span className="text-xs text-muted-foreground ml-2">AI screen:</span>
                    <span className="text-sm font-semibold tabular-nums">{currentResult.aiScore}</span>
                  </>
                )}
                <Badge variant="secondary" className="text-xs ml-auto">
                  Targeting: {DIMENSION_LABELS[currentResult.weakestDimension] ?? currentResult.weakestDimension}
                </Badge>
              </div>

              {isRegression && (
                <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                  <AlertCircle size={13} className="text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-400/90">
                    Score dropped from {prevScore} → {currentScore}. Review proposals carefully before applying.
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              {currentResult.proposals.length === 0 && !error && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No actionable improvements found for this dimension.
                </p>
              )}

              {currentResult.proposals.length > 0 && (
                <div className="overflow-y-auto max-h-[45vh] pr-1 space-y-3">
                  {currentResult.proposals.map((p: BulletProposal) => (
                    <ProposalCard
                      key={proposalKey(p)}
                      proposal={p}
                      selected={selected.has(proposalKey(p))}
                      onToggle={() => toggleProposal(proposalKey(p))}
                      disabled={step === 'applying'}
                    />
                  ))}
                </div>
              )}

              <DialogFooter className="gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={handleSkip} disabled={step === 'applying'}>
                  Skip
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                  disabled={step === 'applying'}
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                >
                  {step === 'applying' ? (
                    <><RefreshCw size={13} className="animate-spin" /> Applying…</>
                  ) : (
                    <><Check size={13} /> Apply Selected ({selected.size})</>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── Done ─────────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="py-4 space-y-5">
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="flex items-center gap-3">
                  {scoreHistory.length > 0 && (
                    <>
                      <span className="text-2xl font-bold tabular-nums text-muted-foreground">
                        {scoreHistory[0].local}
                      </span>
                      <ArrowRight size={20} className="text-muted-foreground" />
                    </>
                  )}
                  <span className="text-4xl font-bold tabular-nums text-purple-400">
                    {finalScore ?? scoreHistory[scoreHistory.length - 1]?.local ?? '—'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Local resume score</p>
              </div>

              <div className="rounded-md border border-border bg-card p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} className="text-green-500" />
                  <span className="font-medium">Summary</span>
                </div>
                <p className="text-muted-foreground">
                  {totalApplied} bullet{totalApplied === 1 ? '' : 's'} improved over {iteration} iteration{iteration === 1 ? '' : 's'}.
                </p>
                <p className="text-muted-foreground">
                  {stopReason === 'threshold_met' && totalApplied === 0 && `Score already exceeds target of ${targetScore}. Raise the target to run improvements. `}
                  {stopReason === 'threshold_met' && totalApplied > 0 && `Reached target score of ${targetScore}. `}
                  {stopReason === 'max_iterations' && `Completed all ${maxIterations} iterations. `}
                  {stopReason === 'no_improvement' && 'No further improvements found. '}
                  {stopReason === 'no_proposals' && 'No actionable proposals generated. '}
                </p>
              </div>

              <DialogFooter className="flex gap-2">
                {stopReason === 'threshold_met' && totalApplied === 0 && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStep('config')
                      setStopReason(null)
                      setScoreHistory([])
                      setIteration(1)
                    }}
                  >
                    Adjust Target
                  </Button>
                )}
                <Button onClick={onClose} className="flex-1">Done</Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ProposalCard({
  proposal,
  selected,
  onToggle,
  disabled,
}: {
  proposal: BulletProposal
  selected: boolean
  onToggle: () => void
  disabled: boolean
}) {
  return (
    <div
      onClick={() => !disabled && onToggle()}
      className={cn(
        'rounded-md border p-3 space-y-2 cursor-pointer transition-colors select-none',
        selected ? 'border-purple-500/50 bg-purple-500/5' : 'border-border hover:bg-muted/30',
        disabled && 'opacity-50 cursor-default'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground truncate">
          {proposal.positionTitle} · {proposal.company}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-500/40 text-purple-400">
            {DIMENSION_LABELS[proposal.dimension] ?? proposal.dimension}
          </Badge>
          <div className={cn(
            'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
            selected ? 'border-purple-500 bg-purple-500' : 'border-muted-foreground'
          )}>
            {selected && <Check size={9} className="text-white" />}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded bg-muted/40 px-2 py-1.5">
          <p className="text-[10px] text-muted-foreground mb-1">Before</p>
          <p className="text-xs leading-snug line-clamp-3">{proposal.before}</p>
        </div>
        <div className="rounded bg-green-950/40 border border-green-900/30 px-2 py-1.5">
          <p className="text-[10px] text-green-500 mb-1">After</p>
          <p className="text-xs leading-snug line-clamp-3">{proposal.after}</p>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground italic">{proposal.reason}</p>
    </div>
  )
}
