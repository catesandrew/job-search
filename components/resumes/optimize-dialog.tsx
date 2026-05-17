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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, RefreshCw, CheckCircle2, AlertCircle, Info, Check } from 'lucide-react'
import { useApplications, type Application } from '@/hooks/use-applications'
import { cn } from '@/lib/utils'
import type { AiOptimizeResponse } from '@/lib/ai/provider'

type Mode = 'application' | 'title'
type Step = 'config' | 'result'

interface OptimizeDialogProps {
  resumeId: string
  open: boolean
  onClose: () => void
  onApproved?: (resumeId: string) => void
  defaultApplicationId?: string
}

interface OptimizeResult {
  selection: AiOptimizeResponse
  masterResumeId: string
}

export function OptimizeDialog({
  resumeId,
  open,
  onClose,
  onApproved,
  defaultApplicationId,
}: OptimizeDialogProps) {
  const [step, setStep] = useState<Step>('config')
  const [mode, setMode] = useState<Mode>(defaultApplicationId ? 'application' : 'title')
  const [selectedApplicationId, setSelectedApplicationId] = useState(defaultApplicationId ?? '')
  const [jobTitle, setJobTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OptimizeResult | null>(null)

  const { data: applications = [] } = useApplications()

  // Auto-detect the application linked to this resume
  useEffect(() => {
    if (selectedApplicationId || applications.length === 0) return
    const linked = applications.find((a: Application) => a.linkedResumeId === resumeId)
    if (linked) {
      setSelectedApplicationId(linked.id)
      setMode('application')
    }
  }, [applications, resumeId, selectedApplicationId])

  const canProceed =
    mode === 'application' ? !!selectedApplicationId : !!jobTitle.trim()

  const runOptimize = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const body =
        mode === 'application'
          ? { applicationId: selectedApplicationId, resumeId }
          : { jobTitle: jobTitle.trim(), resumeId }

      const res = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Optimization failed')
      setResult({ selection: json.data.selection, masterResumeId: json.data.masterResumeId })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    setStep('result')
    await runOptimize()
  }

  const handleApprove = async () => {
    if (!result) return
    setApplying(true)
    setError(null)
    try {
      const body =
        mode === 'application'
          ? { applicationId: selectedApplicationId, masterResumeId: result.masterResumeId, selection: result.selection }
          : { masterResumeId: result.masterResumeId, selection: result.selection }

      const res = await fetch('/api/ai/optimize/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to apply')
      onApproved?.(json.data.resumeId)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setApplying(false)
    }
  }

  const handleClose = () => {
    setStep('config')
    setResult(null)
    setError(null)
    setLoading(false)
    onClose()
  }

  const goBack = () => {
    setStep('config')
    setResult(null)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-400" />
            Optimize Resume for Job
          </DialogTitle>
        </DialogHeader>

        {step === 'config' && (
          <div className="space-y-5">
            {/* ATS banner */}
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400/90 leading-relaxed">
                25% of resumes get filtered out of{' '}
                <span className="underline underline-offset-2 decoration-amber-400/60">
                  Applicant Tracking Systems (ATS)
                </span>{' '}
                due to missing keywords.
              </p>
            </div>

            {/* Mode toggle */}
            <div>
              <p className="text-sm font-medium mb-3">
                Choose how you want to optimize your resume
              </p>
              <div className="flex gap-3">
                <ModeCard
                  label="Optimize for Job Application"
                  selected={mode === 'application'}
                  onClick={() => setMode('application')}
                />
                <ModeCard
                  label="Optimize for Job Title"
                  selected={mode === 'title'}
                  onClick={() => setMode('title')}
                />
              </div>
            </div>

            <hr className="border-border" />

            {/* Mode-specific input */}
            {mode === 'title' && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <label className="text-sm font-medium">Job Title</label>
                  <Info size={12} className="text-muted-foreground" />
                </div>
                <Input
                  placeholder="Enter a job title to optimize your resume for"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canProceed && handleNext()}
                  autoFocus
                />
              </div>
            )}

            {mode === 'application' && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <label className="text-sm font-medium">Job Application Source</label>
                  <Info size={12} className="text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Choose which job application to optimize your resume to. Applications with job
                  descriptions will be best suited for optimization.
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  <span className="text-amber-400 font-medium">–</span>{' '}
                  Denotes an application without a job description filled
                </p>
                <Select
                  value={selectedApplicationId}
                  onValueChange={setSelectedApplicationId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an application" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.length === 0 && (
                      <SelectItem value="__none__" disabled>
                        No applications yet
                      </SelectItem>
                    )}
                    {applications.map((app: Application) => (
                      <SelectItem key={app.id} value={app.id}>
                        {!app.jobDescription ? '– ' : ''}
                        {app.company} — {app.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Next
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'result' && (
          <div className="space-y-4">
            <ScrollArea className="max-h-[320px] pr-2">
              {loading && (
                <div className="space-y-3 py-4">
                  <p className="text-sm text-muted-foreground">
                    Analyzing your resume{mode === 'title' ? ` for "${jobTitle}"` : ''}…
                  </p>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              )}

              {error && !loading && (
                <div className="flex items-start gap-2 py-4 text-sm text-destructive">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              {result && !loading && (
                <div className="py-2 space-y-4">
                  <div className="rounded-md border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-500" />
                      <span className="text-sm font-medium">Selection Summary</span>
                    </div>
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <p>
                        <span className="text-foreground font-medium">
                          {result.selection.positionIds.length}
                        </span>{' '}
                        position(s) selected
                      </p>
                      <p>
                        <span className="text-foreground font-medium">
                          {result.selection.bulletIds.length}
                        </span>{' '}
                        bullet(s) included
                      </p>
                      <p>
                        <span className="text-foreground font-medium">
                          {result.selection.skillCategoryIds.length}
                        </span>{' '}
                        skill categor
                        {result.selection.skillCategoryIds.length === 1 ? 'y' : 'ies'} selected
                      </p>
                      {result.selection.rewrittenBullets &&
                        Object.keys(result.selection.rewrittenBullets).length > 0 && (
                          <p>
                            <span className="text-foreground font-medium">
                              {Object.keys(result.selection.rewrittenBullets).length}
                            </span>{' '}
                            bullet(s) rewritten
                          </p>
                        )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click Approve to create a tailored resume clone with these selections applied.
                    The original resume will not be modified.
                  </p>
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={goBack} disabled={applying}>
                Back
              </Button>
              {(result || error) && !loading && (
                <Button
                  variant="outline"
                  onClick={runOptimize}
                  disabled={loading || applying}
                  className="gap-1.5"
                >
                  <RefreshCw size={14} />
                  Regenerate
                </Button>
              )}
              {result && !loading && (
                <Button
                  onClick={handleApprove}
                  disabled={applying}
                  className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
                >
                  {applying ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Applying…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      Approve
                    </>
                  )}
                </Button>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ModeCard({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition-colors select-none',
        selected
          ? 'border-foreground/50 bg-muted'
          : 'border-border hover:bg-muted/40'
      )}
    >
      <span className={cn('text-sm', selected ? 'font-medium' : 'text-muted-foreground')}>
        {label}
      </span>
      <div
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2',
          selected ? 'border-foreground bg-foreground' : 'border-muted-foreground'
        )}
      >
        {selected && <Check size={11} className="text-background" />}
      </div>
    </div>
  )
}
