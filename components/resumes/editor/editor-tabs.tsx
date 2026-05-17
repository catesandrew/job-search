'use client'

import { Pencil, Palette, LayoutTemplate } from 'lucide-react'
import { cn } from '@/lib/utils'

type EditorMode = 'editor' | 'style' | 'template'

interface EditorTabsProps {
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
}

const tabs: { value: EditorMode; label: string; icon: typeof Pencil }[] = [
  { value: 'editor', label: 'Editor', icon: Pencil },
  { value: 'style', label: 'Style and Layout', icon: Palette },
  { value: 'template', label: 'Template', icon: LayoutTemplate },
]

export function EditorTabs({ mode, onModeChange }: EditorTabsProps) {
  return (
    <div className="inline-flex items-center gap-1 bg-muted rounded-lg p-1">
      {tabs.map(tab => {
        const Icon = tab.icon
        const active = mode === tab.value
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onModeChange(tab.value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon size={13} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
