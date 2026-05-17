'use client'

import { useState, useRef } from 'react'
import { Resume, useUpdateResume } from '@/hooks/use-resume'
import { EditorTabs } from './editor-tabs'
import { SectionTabs } from './section-tabs'
import { GeneralTab } from './general-tab'
import { OverviewTab } from './overview-tab'
import { ExperienceTab } from './experience-tab'
import { EducationTab } from './education-tab'
import { ProjectsTab } from './projects-tab'
import { RepositoriesTab } from './repositories-tab'
import { StyleLayoutTab } from './style-layout-tab'
import { TemplateTab } from './template-tab'
import { ResumePreview } from '../preview/resume-preview'
import { ScreenResultSheet } from '../screen-result-sheet'
import { FactLibrarySheet } from '../fact-library-sheet'
import { ImproveDialog } from '../improve-dialog'
import { ChevronRight, Share2, Link2, Database, ScanLine, Sparkles, Wand2 } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useExtractFacts } from '@/hooks/use-mcp-tools'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/lib/use-toast'

type EditorMode = 'editor' | 'style' | 'template'
type SectionTab = 'general' | 'overview' | 'experience' | 'education' | 'projects' | 'repositories'

interface EditorLayoutProps {
  resume: Resume
}

export function EditorLayout({ resume }: EditorLayoutProps) {
  const [mode, setMode] = useState<EditorMode>('editor')
  const [section, setSection] = useState<SectionTab>('general')
  const [title, setTitle] = useState(resume.title)
  const [screenOpen, setScreenOpen] = useState(false)
  const [factSheetOpen, setFactSheetOpen] = useState(false)
  const [improveOpen, setImproveOpen] = useState(false)
  const [factCount, setFactCount] = useState<number | null>(() => {
    if (!resume.factLibrary) return null
    try { return (JSON.parse(resume.factLibrary) as { facts: unknown[] }).facts.length } catch { return null }
  })
  const [editorWidth, setEditorWidth] = useState(600)
  const editorWidthRef = useRef(600)
  const updateResume = useUpdateResume()
  const extractFacts = useExtractFacts()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const tailorFromLibrary = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/resumes/${resume.id}/tailor-from-library`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Tailor failed')
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resume', resume.id] })
    },
  })
  const titleRef = useRef<HTMLInputElement>(null)

  function startDrag(e: React.MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = editorWidthRef.current
    function onMove(ev: MouseEvent) {
      const newW = Math.max(480, Math.min(900, startW + (ev.clientX - startX)))
      editorWidthRef.current = newW
      setEditorWidth(newW)
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  const saveTitle = () => {
    const val = title.trim() || 'Untitled Resume'
    setTitle(val)
    if (val !== resume.title) updateResume.mutate({ id: resume.id, title: val })
  }

  const createdDate = new Date(resume.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const updatedDate = new Date(resume.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: Editor Panel */}
      <div className="flex flex-col bg-background overflow-hidden shrink-0" style={{ width: editorWidth }}>
        {/* Breadcrumb + Share */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/resumes" className="hover:text-foreground">
              Resumes
            </Link>
            <ChevronRight size={12} />
            <span className="text-foreground truncate max-w-[200px]">
              {resume.title}
            </span>
          </nav>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8"
                onClick={() => tailorFromLibrary.mutate()}
                disabled={tailorFromLibrary.isPending}
              >
                <Sparkles size={13} />
                {tailorFromLibrary.isPending ? 'Tailoring…' : 'Tailor from Library'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8"
                onClick={() => {
                  if (factCount !== null && !extractFacts.isPending) {
                    setFactSheetOpen(true)
                    return
                  }
                  extractFacts.mutate(resume.id, {
                    onSuccess: (data: { facts: unknown[] }) => {
                      setFactCount(data.facts.length)
                      setFactSheetOpen(true)
                      toast({ title: `Extracted ${data.facts.length} facts`, description: 'Fact library updated.' })
                    },
                    onError: (err: unknown) => {
                      const msg = err instanceof Error ? err.message : 'Fact extraction failed'
                      toast({ title: 'Extract Facts failed', description: msg, variant: 'destructive' })
                    },
                  })
                }}
                disabled={extractFacts.isPending}
              >
                <Database size={13} />
                {extractFacts.isPending ? 'Extracting…' : factCount !== null ? `Facts (${factCount})` : 'Extract Facts'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8"
                onClick={() => setImproveOpen(true)}
              >
                <Wand2 size={13} />
                Auto-Improve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8"
                onClick={() => setScreenOpen(true)}
              >
                <ScanLine size={13} />
                Screen Resume
              </Button>
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Share2 size={13} />
                Share
              </button>
            </div>
            {tailorFromLibrary.isError && (
              <p className="text-xs text-destructive">{(tailorFromLibrary.error as Error).message}</p>
            )}
          </div>
        </div>

        {/* Segmented control */}
        <div className="px-4 pt-3 pb-0 shrink-0">
          <EditorTabs mode={mode} onModeChange={setMode} />
        </div>

        {/* Title + badges */}
        <div className="px-4 py-3 shrink-0">
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') titleRef.current?.blur() }}
            className="w-full bg-transparent text-lg font-semibold mb-2 border-0 border-b border-transparent hover:border-border focus:border-mint focus:outline-none transition-colors pb-0.5"
          />
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-green-950 text-green-400 border-0">
              Created {createdDate}
            </Badge>
            <Badge variant="secondary" className="text-xs bg-blue-950 text-blue-400 border-0">
              Updated {updatedDate}
            </Badge>
            {(resume._count?.applications ?? 0) > 0 && (
              <Badge
                variant="secondary"
                className="text-xs bg-indigo-950 text-indigo-400 border-0 flex items-center gap-1"
              >
                <Link2 size={10} />
                {resume._count!.applications} application{resume._count!.applications === 1 ? '' : 's'}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {tailorFromLibrary.isPending ? (
            <div className="px-4 py-6 space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-5/6" />
                <Skeleton className="h-8 w-4/6" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-6 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-4/5" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2">Tailoring resume from library…</p>
            </div>
          ) : (
            <>
              {mode === 'editor' && (
                <>
                  <div className="px-4 pb-2 shrink-0">
                    <SectionTabs section={section} onSectionChange={setSection} />
                  </div>
                  <div className="px-4 pb-6">
                    {section === 'general' && <GeneralTab resume={resume} />}
                    {section === 'overview' && <OverviewTab resume={resume} />}
                    {section === 'experience' && <ExperienceTab resume={resume} />}
                    {section === 'education' && <EducationTab resume={resume} />}
                    {section === 'projects' && <ProjectsTab resume={resume} />}
                    {section === 'repositories' && <RepositoriesTab resume={resume} />}
                  </div>
                </>
              )}
              {mode === 'style' && <StyleLayoutTab resume={resume} />}
              {mode === 'template' && <TemplateTab resume={resume} />}
            </>
          )}
        </div>
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={startDrag}
        className="w-1 shrink-0 cursor-col-resize bg-border hover:bg-primary/40 transition-colors select-none"
      />

      {/* Right: Preview Panel */}
      <div className="flex-1 overflow-hidden">
        <ResumePreview resume={resume} />
      </div>

      <ScreenResultSheet
        open={screenOpen}
        onClose={() => setScreenOpen(false)}
        resumeId={resume.id}
      />
      <FactLibrarySheet
        open={factSheetOpen}
        onClose={() => setFactSheetOpen(false)}
        factLibrary={resume.factLibrary ? (() => { try { return JSON.parse(resume.factLibrary!) } catch { return null } })() : null}
      />
      <ImproveDialog
        resumeId={resume.id}
        open={improveOpen}
        onClose={() => setImproveOpen(false)}
        onApplied={() => queryClient.invalidateQueries({ queryKey: ['resume', resume.id] })}
      />
    </div>
  )
}
