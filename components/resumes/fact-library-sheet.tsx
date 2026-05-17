'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import type { CareerFact, FactLibrary } from '@/lib/ai/mcp-tools'

interface FactLibrarySheetProps {
  open: boolean
  onClose: () => void
  factLibrary: FactLibrary | null
}

const CATEGORY_LABELS: Record<CareerFact['category'], string> = {
  achievement: 'Achievement',
  skill: 'Skill',
  responsibility: 'Responsibility',
  metric: 'Metric',
  credential: 'Credential',
}

const CATEGORY_COLORS: Record<CareerFact['category'], string> = {
  achievement: 'bg-green-950 text-green-400',
  skill: 'bg-blue-950 text-blue-400',
  responsibility: 'bg-purple-950 text-purple-400',
  metric: 'bg-orange-950 text-orange-400',
  credential: 'bg-yellow-950 text-yellow-400',
}

const CATEGORY_ORDER: CareerFact['category'][] = [
  'achievement', 'metric', 'skill', 'responsibility', 'credential',
]

export function FactLibrarySheet({ open, onClose, factLibrary }: FactLibrarySheetProps) {
  const facts = factLibrary?.facts ?? []
  const [copied, setCopied] = useState(false)

  const grouped = CATEGORY_ORDER.reduce<Record<string, CareerFact[]>>((acc, cat) => {
    acc[cat] = facts.filter(f => f.category === cat)
    return acc
  }, {})

  const copyAsText = () => {
    const lines: string[] = [`Career Facts (${facts.length} total)`, '']
    for (const cat of CATEGORY_ORDER) {
      const catFacts = grouped[cat]
      if (catFacts.length === 0) continue
      lines.push(`## ${CATEGORY_LABELS[cat]}`)
      for (const fact of catFacts) {
        lines.push(`- ${fact.claim} (confidence: ${Math.round(fact.confidence * 100)}%)`)
      }
      lines.push('')
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-[480px] sm:max-w-[480px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <div className="flex items-start justify-between gap-2">
            <SheetTitle className="text-base">
              Fact Library
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {facts.length} verified facts
              </span>
            </SheetTitle>
            {facts.length > 0 && (
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={copyAsText}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            )}
          </div>
          {factLibrary?.extractedAt && (
            <p className="text-xs text-muted-foreground">
              Extracted {new Date(factLibrary.extractedAt).toLocaleString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}
            </p>
          )}
        </SheetHeader>

        {facts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No facts extracted yet. Click &quot;Extract Facts&quot; to build the library.
          </p>
        ) : (
          <div className="space-y-6">
            {CATEGORY_ORDER.map(cat => {
              const catFacts = grouped[cat]
              if (catFacts.length === 0) return null
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${CATEGORY_COLORS[cat]}`}>
                      {CATEGORY_LABELS[cat]}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {catFacts.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {catFacts.map(fact => (
                      <div key={fact.id} className="rounded-md border border-border bg-card p-3 space-y-1.5">
                        <p className="text-sm leading-snug">{fact.claim}</p>
                        {fact.sourceText && fact.sourceText !== fact.claim && (
                          <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2 leading-snug">
                            &ldquo;{fact.sourceText.slice(0, 120)}{fact.sourceText.length > 120 ? '…' : ''}&rdquo;
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-0.5">
                          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-mint"
                              style={{ width: `${Math.round(fact.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {Math.round(fact.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
