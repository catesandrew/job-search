'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Copy, Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGenerateCoverLetter, type CoverLetter } from '@/hooks/use-cover-letters'

type Tab = 'cover' | 'outreach'

interface CoverLetterDialogProps {
  applicationId: string
  open: boolean
  onClose: () => void
}

export function CoverLetterDialog({ applicationId, open, onClose }: CoverLetterDialogProps) {
  const [activeTab, setActiveTab] = useState<Tab>('cover')
  const [content, setContent] = useState<CoverLetter | null>(null)
  const [copied, setCopied] = useState(false)

  const generate = useGenerateCoverLetter()

  const handleGenerate = async () => {
    const letter = await generate.mutateAsync({ applicationId })
    setContent(letter)
  }

  const activeText = content
    ? activeTab === 'cover'
      ? content.content
      : (content.outreachMessage ?? '')
    : null

  const handleCopy = async () => {
    if (!activeText) return
    await navigator.clipboard.writeText(activeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setContent(null)
    generate.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Content</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-border -mx-1">
          {(['cover', 'outreach'] as Tab[]).map(tab => (
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
          ))}
        </div>

        <div className="space-y-3">
          {!content && !generate.isPending && !generate.isError && (
            <div className="py-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Generate a cover letter and LinkedIn outreach message tailored to this job description.
              </p>
              <Button
                onClick={handleGenerate}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Generate
              </Button>
            </div>
          )}

          {generate.isPending && (
            <div className="space-y-3 py-4">
              <p className="text-sm text-muted-foreground">
                Writing your {activeTab === 'cover' ? 'cover letter' : 'outreach message'}…
              </p>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}

          {generate.isError && !generate.isPending && (
            <div className="flex items-start gap-2 py-2 text-sm text-destructive">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {generate.error instanceof Error ? generate.error.message : 'Generation failed'}
            </div>
          )}

          {content && !generate.isPending && (
            <>
              <ScrollArea className="max-h-[300px] rounded-md border border-border bg-muted/30 p-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{activeText}</p>
              </ScrollArea>

              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  onClick={handleGenerate}
                  disabled={generate.isPending}
                >
                  <RefreshCw size={12} />
                  Regenerate
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs h-8"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <><Check size={12} /> Copied</>
                  ) : (
                    <><Copy size={12} /> Copy</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
