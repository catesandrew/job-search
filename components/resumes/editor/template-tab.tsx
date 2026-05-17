'use client'

import { Resume, useUpdateResume } from '@/hooks/use-resume'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplateTabProps {
  resume: Resume
}

interface TemplateOption {
  id: string
  name: string
  tags: string[]
}

const templates: TemplateOption[] = [
  { id: 'harvard', name: 'Harvard', tags: ['Classic', 'Traditional', 'Formal', 'ATS Safe'] },
  { id: 'neue',    name: 'Neue',    tags: ['Modern', 'Clean', 'Minimalist', 'ATS Safe'] },
  { id: 'oxford',  name: 'Oxford',  tags: ['Academic', 'Traditional', 'ATS Safe'] },
  { id: 'bauhaus', name: 'Bauhaus', tags: ['2-Column', 'Modern', 'Visual'] },
  { id: 'chicago', name: 'Chicago', tags: ['Modern', 'Bold', 'Accent'] },
  { id: 'miller',  name: 'Miller',  tags: ['Minimal', 'Elegant', 'Classic'] },
]

export function TemplateTab({ resume }: TemplateTabProps) {
  const updateResume = useUpdateResume()

  const applyTemplate = (templateId: string) => {
    updateResume.mutate({ id: resume.id, templateId })
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <h3 className="text-sm font-semibold">Choose a Template</h3>
      <div className="space-y-4">
        {templates.map(template => {
          const isActive = resume.templateId === template.id
          return (
            <div
              key={template.id}
              className={cn(
                'rounded-lg border bg-card overflow-hidden',
                isActive ? 'border-green-500' : 'border-border'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{template.name}</span>
                  {isActive && (
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs"
                  variant={isActive ? 'secondary' : 'default'}
                  disabled={isActive}
                  onClick={() => applyTemplate(template.id)}
                >
                  {isActive ? 'Applied' : 'Apply'}
                </Button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                {template.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Preview mockup */}
              <div className="px-4 pb-4">
                <div className="bg-white rounded shadow-sm mx-auto max-w-[280px] aspect-[8.5/11] p-4">
                  <div className="text-center mb-2">
                    <div className="h-2.5 w-20 bg-gray-800 rounded-sm mx-auto mb-1" />
                    <div className="h-1.5 w-32 bg-gray-300 rounded-sm mx-auto" />
                  </div>
                  <div className="h-px bg-gray-200 my-2" />
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-16 bg-gray-700 rounded-sm" />
                    <div className="h-1 w-full bg-gray-200 rounded-sm" />
                    <div className="h-1 w-4/5 bg-gray-200 rounded-sm" />
                  </div>
                  <div className="h-px bg-gray-200 my-2" />
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-20 bg-gray-700 rounded-sm" />
                    <div className="flex justify-between">
                      <div className="h-1 w-24 bg-gray-400 rounded-sm" />
                      <div className="h-1 w-16 bg-gray-300 rounded-sm" />
                    </div>
                    <div className="h-1 w-full bg-gray-200 rounded-sm" />
                    <div className="h-1 w-11/12 bg-gray-200 rounded-sm" />
                    <div className="h-1 w-3/4 bg-gray-200 rounded-sm" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
