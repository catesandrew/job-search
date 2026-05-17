'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Sparkles, RefreshCw, ArrowLeft, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BulletItem {
  id: string
  text: string
}

function parseAchievements(html: string): BulletItem[] {
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi
  const liMatches = [...html.matchAll(liRegex)]
  if (liMatches.length > 0) {
    return liMatches
      .map((m, i) => ({ id: String(i), text: m[1].replace(/<[^>]+>/g, '').trim() }))
      .filter(b => b.text)
  }
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
  const pMatches = [...html.matchAll(pRegex)]
  return pMatches
    .map((m, i) => ({ id: String(i), text: m[1].replace(/<[^>]+>/g, '').trim() }))
    .filter(b => b.text)
}

function buildBulletHtml(items: BulletItem[]): string {
  return '<ul>' + items.map(i => `<li>${i.text}</li>`).join('') + '</ul>'
}

interface EnhanceBulletsModalProps {
  positionTitle: string
  company: string
  bulletsHtml: string
  open: boolean
  onClose: () => void
  onApply: (newHtml: string) => void
}

export function EnhanceBulletsModal({
  positionTitle,
  company,
  bulletsHtml,
  open,
  onClose,
  onApply,
}: EnhanceBulletsModalProps) {
  const parsedBullets = useMemo(() => parseAchievements(bulletsHtml), [bulletsHtml])

  const [step, setStep] = useState<'select' | 'review'>('select')
  const [instructions, setInstructions] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enhanced, setEnhanced] = useState<Record<string, string>>({})
  const [accepted, setAccepted] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (open) {
      setSelected(new Set(parsedBullets.map(b => b.id)))
      setStep('select')
      setError(null)
      setEnhanced({})
    }
  }, [open, parsedBullets])

  const handleClose = () => {
    setInstructions('')
    setSelected(new Set())
    setEnhanced({})
    setAccepted(new Set())
    setStep('select')
    setError(null)
    onClose()
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const allSelected = parsedBullets.length > 0 && selected.size === parsedBullets.length
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(parsedBullets.map(b => b.id)))

  const generate = async () => {
    const toEnhance = parsedBullets.filter(b => selected.has(b.id))
    if (!toEnhance.length) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/enhance-bullets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ positionTitle, company, bullets: toEnhance, instructions }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Enhancement failed')
      const map: Record<string, string> = {}
      for (const item of data.enhanced as { id: string; text: string }[]) {
        map[item.id] = item.text
      }
      setEnhanced(map)
      setAccepted(new Set(Object.keys(map)))
      setStep('review')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const toggleAccepted = (id: string) => {
    setAccepted(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleApply = () => {
    const newItems = parsedBullets.map(b => ({
      id: b.id,
      text: accepted.has(b.id) && enhanced[b.id] ? enhanced[b.id] : b.text,
    }))
    onApply(buildBulletHtml(newItems))
    handleClose()
  }

  // Bullets shown in review = selected ones (others pass through unchanged)
  const reviewBullets = parsedBullets.filter(b => selected.has(b.id) && enhanced[b.id])

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-400" />
            Enhance Achievements
            <span className="text-muted-foreground text-sm font-normal ml-1">
              — {positionTitle} at {company}
            </span>
          </DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <>
            <div className="space-y-3 py-1">
              {/* Select all */}
              <label className="flex items-center gap-2.5 cursor-pointer pb-1 border-b border-border">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="accent-purple-500 w-3.5 h-3.5"
                />
                <span className="text-xs text-muted-foreground font-medium">Select all</span>
              </label>

              {/* Bullet checkboxes */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {parsedBullets.map(bullet => (
                  <label
                    key={bullet.id}
                    className="flex items-start gap-2.5 cursor-pointer rounded-md px-2 py-2 hover:bg-muted/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(bullet.id)}
                      onChange={() => toggleSelect(bullet.id)}
                      className="accent-purple-500 w-3.5 h-3.5 mt-0.5 shrink-0"
                    />
                    <span className="text-sm leading-snug">{bullet.text}</span>
                  </label>
                ))}
                {parsedBullets.length === 0 && (
                  <p className="text-xs text-muted-foreground py-3 text-center">
                    No achievements found. Add some bullets first.
                  </p>
                )}
              </div>

              {/* Instructions */}
              <div className="pt-1">
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Instructions (optional)
                </Label>
                <textarea
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="e.g. Emphasize leadership, add metrics, use STAR format..."
                  rows={2}
                  className="w-full bg-transparent border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors resize-none"
                />
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={generate}
                disabled={loading || selected.size === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? 'Enhancing…' : `Enhance ${selected.size > 0 ? `(${selected.size})` : ''}`}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'review' && (
          <>
            <div className="space-y-2 py-1 max-h-[420px] overflow-y-auto pr-1">
              <p className="text-xs text-muted-foreground pb-1">
                Click a row to toggle acceptance. Green = will apply enhanced version.
              </p>
              {reviewBullets.map(bullet => {
                const isAccepted = accepted.has(bullet.id)
                return (
                  <button
                    key={bullet.id}
                    type="button"
                    onClick={() => toggleAccepted(bullet.id)}
                    className={cn(
                      'w-full text-left rounded-lg border px-3 py-2.5 transition-colors space-y-2',
                      isAccepted
                        ? 'border-purple-500/50 bg-purple-500/5'
                        : 'border-border bg-muted/10 opacity-60'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <span className={cn(
                        'shrink-0 mt-0.5 rounded-full p-0.5',
                        isAccepted ? 'text-purple-400' : 'text-muted-foreground'
                      )}>
                        {isAccepted ? <Check size={13} /> : <X size={13} />}
                      </span>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="text-xs font-medium text-purple-300">Enhanced</p>
                        <p className="text-sm leading-snug">{enhanced[bullet.id]}</p>
                        <p className="text-xs font-medium text-muted-foreground mt-1">Original</p>
                        <p className="text-xs text-muted-foreground leading-snug">{bullet.text}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setStep('select')} className="gap-1.5">
                <ArrowLeft size={14} />
                Back
              </Button>
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button
                onClick={handleApply}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
              >
                <Check size={14} />
                Apply {accepted.size > 0 ? `(${accepted.size})` : ''}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
