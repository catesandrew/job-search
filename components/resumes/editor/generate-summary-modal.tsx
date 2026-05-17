'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Sparkles, RefreshCw, Check, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

function markdownToHtml(md: string): string {
  return md
    .split(/\n\n+/)
    .filter(Boolean)
    .map(para =>
      `<p>${para
        .trim()
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
      }</p>`
    )
    .join('')
}

interface GenerateSummaryModalProps {
  resumeId: string
  hasSummary: boolean
  open: boolean
  onClose: () => void
  onApply: (html: string) => void
}

export function GenerateSummaryModal({
  resumeId,
  hasSummary,
  open,
  onClose,
  onApply,
}: GenerateSummaryModalProps) {
  const [keywords, setKeywords] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [enhanceExisting, setEnhanceExisting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId, keywords, customPrompt, enhanceExisting }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate summary')
      setGenerated(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (!generated) return
    onApply(markdownToHtml(generated) || `<p>${generated}</p>`)
    handleClose()
  }

  const handleClose = () => {
    setGenerated(null)
    setError(null)
    setKeywords('')
    setCustomPrompt('')
    setEnhanceExisting(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-purple-400" />
            Generate Professional Summary
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-2">
          {/* Controls */}
          <div className="space-y-5">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Keywords to emphasize
              </Label>
              <input
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="e.g. TypeScript, distributed systems, leadership"
                className="w-full bg-transparent border-0 border-b border-border rounded-none px-0 py-1.5 text-sm focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Custom instructions
              </Label>
              <textarea
                value={customPrompt}
                onChange={e => setCustomPrompt(e.target.value)}
                placeholder="e.g. Focus on leadership and systems architecture..."
                rows={4}
                className="w-full bg-transparent border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors resize-none"
              />
            </div>
            {hasSummary && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm cursor-pointer" htmlFor="enhance-toggle">
                    Enhance existing summary
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={12} className="text-muted-foreground cursor-default" />
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs max-w-[220px]">
                          When on, your current summary is included in the prompt and the AI improves it.
                          When off, a fresh summary is generated from your resume data.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  id="enhance-toggle"
                  checked={enhanceExisting}
                  onCheckedChange={setEnhanceExisting}
                />
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">Preview</Label>
            <div className="flex-1 min-h-[180px] rounded-md border border-border bg-muted/20 p-3 text-sm">
              {loading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Generating...</span>
                </div>
              )}
              {error && !loading && (
                <p className="text-destructive text-xs">{error}</p>
              )}
              {generated && !loading && (
                <p className="leading-relaxed">{generated}</p>
              )}
              {!loading && !error && !generated && (
                <p className="text-muted-foreground/50 text-xs">
                  Configure options and click Generate to create a summary using your resume data.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={generate}
            disabled={loading}
            className="gap-1.5"
          >
            {loading ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : generated ? (
              <RefreshCw size={14} />
            ) : (
              <Sparkles size={14} />
            )}
            {generated ? 'Regenerate' : 'Generate'}
          </Button>
          {generated && !loading && (
            <Button
              onClick={handleApply}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
            >
              <Check size={14} />
              Apply
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
