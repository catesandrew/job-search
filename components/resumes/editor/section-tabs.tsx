'use client'

import { cn } from '@/lib/utils'

type SectionTab = 'general' | 'overview' | 'experience' | 'education' | 'projects' | 'repositories'

interface SectionTabsProps {
  section: SectionTab
  onSectionChange: (section: SectionTab) => void
}

const sections: { value: SectionTab; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'overview', label: 'Overview' },
  { value: 'experience', label: 'Experience' },
  { value: 'education', label: 'Education' },
  { value: 'projects', label: 'Projects' },
  { value: 'repositories', label: 'Repositories' },
]

export function SectionTabs({ section, onSectionChange }: SectionTabsProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-border scrollbar-none">
      {sections.map(tab => {
        const active = section === tab.value
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onSectionChange(tab.value)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
