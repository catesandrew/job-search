'use client'

import { use, useState, useEffect, useRef } from 'react'
import { useCoverLetter, useUpdateCoverLetter, useRegenerateCoverLetter } from '@/hooks/use-cover-letters'
import { useResumes } from '@/hooks/use-resume'
import type { Resume } from '@/hooks/use-resume'
import { RichTextEditor } from '@/components/rich-text-editor'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ChevronDown, ChevronRight, Copy, Check, RefreshCw, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// ── Section accordion ────────────────────────────────────────────────────────

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="text-sm font-medium">{title}</span>
        {open ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Field row (label + control) ───────────────────────────────────────────────

function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

// ── Letter preview ────────────────────────────────────────────────────────────

function LetterPreview({
  content,
  profile,
  company,
  copied,
  onCopy,
}: {
  content: string
  profile: { firstName: string; lastName: string; email: string; phone: string | null } | null | undefined
  company: string | null | undefined
  copied: boolean
  onCopy: () => void
}) {
  const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : ''
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="outline"
        className="absolute top-0 right-0 gap-1.5 text-xs h-8"
        onClick={onCopy}
      >
        {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
      </Button>

      <div className="mt-10 bg-white text-black rounded-lg shadow-md px-12 py-10 font-serif max-w-[620px] mx-auto min-h-[800px]">
        {/* Header */}
        {fullName && (
          <div className="text-center mb-6">
            <h1 className="text-lg font-bold tracking-wide">{fullName}</h1>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-1">
              {profile?.email && <span>{profile.email}</span>}
              {profile?.phone && <><span>·</span><span>{profile.phone}</span></>}
            </div>
            <hr className="border-gray-300 mt-3" />
          </div>
        )}

        {/* Date */}
        <p className="text-xs text-gray-500 mb-4">{today}</p>

        {/* Addressee */}
        {company && <p className="text-sm mb-5">{company}</p>}

        {/* Body */}
        {content ? (
          <div
            className="text-sm leading-relaxed mb-8 prose prose-sm max-w-none prose-p:my-2"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="text-sm leading-relaxed mb-8">
            <span className="text-gray-400 italic">Cover letter content will appear here…</span>
          </div>
        )}

        {/* Footer */}
        <p className="text-sm">Sincerely,</p>
        {fullName && <p className="text-sm mt-6">{fullName}</p>}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toHtml(text: string): string {
  if (!text) return ''
  if (/<[a-z][\s\S]*>/i.test(text)) return text // already HTML
  return text
    .split(/\n\n+/)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CoverLetterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: letter, isLoading } = useCoverLetter(id)
  const resumesQuery = useResumes()
  const resumes: Resume[] = resumesQuery.data ?? []

  const update = useUpdateCoverLetter()
  const regenerate = useRegenerateCoverLetter(id)

  // Local form state
  const [resumeId, setResumeId] = useState('')
  const [length, setLength] = useState('medium')
  const [tone, setTone] = useState('formal')
  const [customPrompt, setCustomPrompt] = useState('')
  const [content, setContent] = useState('')
  const [copied, setCopied] = useState(false)
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)
  const [leftWidth, setLeftWidth] = useState(420)
  const leftWidthRef = useRef(420)

  const initialized = useRef(false)

  function startDrag(e: React.MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = leftWidthRef.current
    function onMove(ev: MouseEvent) {
      const newW = Math.max(300, Math.min(700, startW + (ev.clientX - startX)))
      leftWidthRef.current = newW
      setLeftWidth(newW)
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  useEffect(() => {
    if (letter && !initialized.current) {
      initialized.current = true
      setResumeId(letter.resumeId ?? '')
      setLength(letter.length)
      setTone(letter.tone)
      setCustomPrompt(letter.customPrompt ?? '')
      setContent(toHtml(letter.content))
      if (letter.customPrompt) setShowCustomPrompt(true)
    }
  }, [letter])

  type SaveData = {
    title?: string
    content?: string
    outreachMessage?: string
    length?: string
    tone?: string
    customPrompt?: string
    resumeId?: string | null
  }
  const save = (data: SaveData) => {
    update.mutate({ id, ...data })
  }

  const handleRegenerate = async () => {
    const result = await regenerate.mutateAsync({
      resumeId: resumeId || undefined,
      length,
      tone,
      customPrompt: customPrompt || undefined,
    })
    setContent(toHtml(result.content))
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(stripHtml(content))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-[1fr_1fr] gap-6">
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    )
  }

  if (!letter) {
    return <div className="p-6 text-sm text-muted-foreground">Cover letter not found.</div>
  }

  const profile = letter.resume?.profile

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border shrink-0">
        <Link href="/cover-letters" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Cover Letters
        </Link>
        <ChevronRight size={14} className="text-muted-foreground" />
        <span className="text-sm font-medium truncate">{letter.title}</span>
      </div>

      {/* Two-panel body */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left panel — config + edit */}
        <div className="shrink-0 overflow-y-auto px-5 py-5 space-y-4" style={{ width: leftWidth }}>
          <div className="flex items-center gap-2 mb-1">
            <Settings size={14} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Configuration</span>
          </div>

          <Section title="Configuration">
            {/* Application link */}
            {letter.application && (
              <FieldRow label="Job Application Source">
                <Link
                  href={`/applications/${letter.application.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  {letter.application.company} — {letter.application.role}
                </Link>
              </FieldRow>
            )}

            {/* Resume source */}
            <FieldRow label="Resume Source" description="Choose which resume to use as the source.">
              <Select
                value={resumeId}
                onValueChange={v => {
                  setResumeId(v)
                  save({ resumeId: v || null })
                }}
              >
                <SelectTrigger className="w-44 text-xs">
                  <SelectValue placeholder="Select a resume" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map((r: Resume) => (
                    <SelectItem key={r.id} value={r.id} className="text-xs">
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>

            {/* Length */}
            <FieldRow label="Cover Letter Length" description="Choose how long you'd like your cover letter to be.">
              <Select
                value={length}
                onValueChange={v => {
                  setLength(v)
                  save({ length: v })
                }}
              >
                <SelectTrigger className="w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short" className="text-xs">Short</SelectItem>
                  <SelectItem value="medium" className="text-xs">Medium</SelectItem>
                  <SelectItem value="long" className="text-xs">Long</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>

            {/* Tone */}
            <FieldRow label="Cover Letter Tone" description="Choose which tone you'd like to convey.">
              <Select
                value={tone}
                onValueChange={v => {
                  setTone(v)
                  save({ tone: v })
                }}
              >
                <SelectTrigger className="w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal" className="text-xs">Formal</SelectItem>
                  <SelectItem value="professional" className="text-xs">Professional</SelectItem>
                  <SelectItem value="casual" className="text-xs">Casual</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>

            {/* Custom prompt toggle */}
            <div>
              <button
                type="button"
                className="flex items-center justify-between w-full text-sm font-medium"
                onClick={() => setShowCustomPrompt(s => !s)}
              >
                <span>Custom Prompt (Optional)</span>
                {showCustomPrompt
                  ? <ChevronDown size={14} className="text-muted-foreground" />
                  : <ChevronRight size={14} className="text-muted-foreground" />}
              </button>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add custom prompt if you want to generate the cover letter in a specific way.
              </p>
              {showCustomPrompt && (
                <textarea
                  className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  rows={5}
                  placeholder="e.g. Emphasize my experience with distributed systems and mention my open source contributions."
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  onBlur={() => save({ customPrompt })}
                />
              )}
            </div>

            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-1.5"
              onClick={handleRegenerate}
              disabled={regenerate.isPending}
            >
              <RefreshCw size={13} className={cn(regenerate.isPending && 'animate-spin')} />
              {regenerate.isPending ? 'Generating…' : 'Generate Cover Letter'}
            </Button>
          </Section>

          {/* Addressee Info */}
          {letter.application && (
            <Section title="Addressee Info" defaultOpen={false}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Company Name</p>
                  <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                    {letter.application.company}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Company Location</p>
                  <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    {letter.application.location ?? '—'}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Profile Info */}
          {profile && (
            <Section title="Profile Info" defaultOpen={false}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">First Name</p>
                  <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">{profile.firstName}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last Name</p>
                  <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">{profile.lastName}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email Address</p>
                  <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">{profile.email}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone Number</p>
                  <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    {profile.phone ?? '—'}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Cover Letter Content */}
          <Section title="Cover Letter Content" defaultOpen={false}>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Body</p>
              <RichTextEditor
                value={content}
                onChange={html => setContent(html)}
                onBlur={html => save({ content: html })}
                placeholder="Cover letter body…"
                minHeight="240px"
              />
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Footer</p>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {`Sincerely,\n${profile ? `${profile.firstName} ${profile.lastName}`.trim() : ''}`}
              </div>
            </div>
          </Section>
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={startDrag}
          className="w-1 shrink-0 cursor-col-resize bg-border hover:bg-primary/40 transition-colors select-none"
        />

        {/* Right panel — preview */}
        <div className="flex-1 overflow-y-auto bg-muted/20 px-8 py-6">
          <LetterPreview
            content={content}
            profile={profile}
            company={letter.application?.company}
            copied={copied}
            onCopy={handleCopy}
          />
        </div>
      </div>
    </div>
  )
}
