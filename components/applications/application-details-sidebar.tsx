'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type Application, useUpdateApplication } from '@/hooks/use-applications'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RichTextEditor } from '@/components/rich-text-editor'
import { cn } from '@/lib/utils'
import { Circle, Link2, MapPin, DollarSign, Calendar, FileText, AlignLeft, LayoutGrid } from 'lucide-react'

// ── Status dot colors ──────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  WISHLIST: 'text-blue-400',
  APPLIED: 'text-yellow-400',
  INTERVIEWING: 'text-orange-400',
  OFFER: 'text-green-400',
  REJECTED: 'text-pink-400',
}

// ── Field row ──────────────────────────────────────────────────────────────────

function FieldRow({
  icon,
  label,
  children,
}: {
  icon?: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className="w-[140px] shrink-0 flex items-center gap-1.5 pt-0.5">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function InlineInput({
  value,
  placeholder,
  onBlur,
  type = 'text',
}: {
  value: string
  placeholder: string
  onBlur: (v: string) => void
  type?: string
}) {
  const [local, setLocal] = useState(value)
  return (
    <input
      type={type}
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => onBlur(local)}
      className="w-full text-xs bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground/50 focus:ring-0"
    />
  )
}

// ── Details tab ────────────────────────────────────────────────────────────────

function DetailsTab({ application }: { application: Application }) {
  const updateApp = useUpdateApplication()

  const save = useCallback(
    (fields: Partial<Application>) => {
      updateApp.mutate({ id: application.id, ...fields })
    },
    [application.id, updateApp]
  )

  const { data: resumes = [] as { id: string; title: string }[] } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const res = await fetch('/api/resumes')
      if (!res.ok) return [] as { id: string; title: string }[]
      const json = await res.json()
      return json.data as { id: string; title: string }[]
    },
  })

  return (
    <div className="px-4 py-3 space-y-5">
      {/* Application Details */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <LayoutGrid size={13} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Application Details
          </span>
        </div>
        <div className="rounded-lg border border-border bg-card/30 px-3">
          <FieldRow icon={<Circle size={11} />} label="Status">
            <Select
              value={application.status}
              onValueChange={(v) => save({ status: v as Application['status'] })}
            >
              <SelectTrigger className="h-auto border-0 p-0 text-xs shadow-none focus:ring-0 bg-transparent">
                <SelectValue>
                  <span className={cn('flex items-center gap-1.5', STATUS_COLORS[application.status])}>
                    <Circle size={7} fill="currentColor" />
                    <span className="text-foreground capitalize">{application.status.charAt(0) + application.status.slice(1).toLowerCase()}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {['WISHLIST', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED'].map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    <span className={cn('flex items-center gap-1.5', STATUS_COLORS[s])}>
                      <Circle size={7} fill="currentColor" />
                      <span className="text-foreground">{s.charAt(0) + s.slice(1).toLowerCase()}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          <FieldRow icon={<FileText size={11} />} label="Resume">
            <Select
              value={application.linkedResumeId ?? 'none'}
              onValueChange={(v) => save({ linkedResumeId: v === 'none' ? null : v })}
            >
              <SelectTrigger className="h-auto border-0 p-0 text-xs shadow-none focus:ring-0 bg-transparent">
                <SelectValue placeholder="Select resume..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-xs">No resume linked</SelectItem>
                {resumes.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-xs">{r.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        </div>
      </section>

      {/* Company Info */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <LayoutGrid size={13} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Company Info
          </span>
        </div>
        <div className="rounded-lg border border-border bg-card/30 px-3">
          <FieldRow label="Company Name">
            <InlineInput
              value={application.company}
              placeholder="Company name"
              onBlur={(v) => v && save({ company: v })}
            />
          </FieldRow>
          <FieldRow icon={<Link2 size={11} />} label="Website">
            <InlineInput
              value={application.companyUrl ?? ''}
              placeholder="Set company website"
              onBlur={(v) => save({ companyUrl: v })}
            />
          </FieldRow>
        </div>
      </section>

      {/* Position */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <LayoutGrid size={13} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Position
          </span>
        </div>
        <div className="rounded-lg border border-border bg-card/30 px-3">
          <FieldRow label="Position Title">
            <InlineInput
              value={application.role}
              placeholder="Job title"
              onBlur={(v) => v && save({ role: v })}
            />
          </FieldRow>
          <FieldRow icon={<Link2 size={11} />} label="URL">
            <InlineInput
              value={application.jobUrl ?? ''}
              placeholder="Set url to job posting"
              onBlur={(v) => save({ jobUrl: v })}
            />
          </FieldRow>
          <FieldRow icon={<MapPin size={11} />} label="Location">
            <InlineInput
              value={application.location ?? ''}
              placeholder="Set location"
              onBlur={(v) => save({ location: v })}
            />
          </FieldRow>
          <FieldRow label="Remote">
            <Switch
              checked={application.remote}
              onCheckedChange={(v) => save({ remote: v })}
              className="h-4 w-7 data-[state=checked]:bg-emerald-500"
            />
          </FieldRow>
          <FieldRow icon={<DollarSign size={11} />} label="Salary">
            <InlineInput
              value={application.salaryMin != null ? String(application.salaryMin) : ''}
              placeholder="e.g. 150000"
              type="number"
              onBlur={(v) => save({ salaryMin: v ? parseInt(v) : null })}
            />
          </FieldRow>
          <FieldRow icon={<Calendar size={11} />} label="Pay Period">
            <Select
              value={application.salaryFreq ?? ''}
              onValueChange={(v) => save({ salaryFreq: v })}
            >
              <SelectTrigger className="h-auto border-0 p-0 text-xs shadow-none focus:ring-0 bg-transparent">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly" className="text-xs">Hourly</SelectItem>
                <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
                <SelectItem value="yearly" className="text-xs">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </div>
      </section>

      {/* Job Description */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <AlignLeft size={13} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Job Description
          </span>
        </div>
        <RichTextEditor
          value={application.jobDescription ?? ''}
          onBlur={(html) => save({ jobDescription: html })}
          placeholder="Paste job description..."
          minHeight="180px"
        />
      </section>
    </div>
  )
}

// ── Notes tab ──────────────────────────────────────────────────────────────────

function NotesTab({ application }: { application: Application }) {
  const updateApp = useUpdateApplication()

  return (
    <div className="px-4 py-3">
      <RichTextEditor
        value={application.notes ?? ''}
        onBlur={(html) => updateApp.mutate({ id: application.id, notes: html })}
        placeholder="Add notes about this application..."
        minHeight="300px"
      />
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

export function ApplicationDetailsSidebar({
  application,
  style,
}: {
  application: Application
  style?: React.CSSProperties
}) {
  return (
    <div className="shrink-0 overflow-auto flex flex-col" style={style}>
      <Tabs defaultValue="details" className="flex flex-col h-full">
        <div className="border-b border-border px-4 shrink-0">
          <TabsList className="h-10 bg-transparent gap-4 p-0 rounded-none">
            {['details', 'notes'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-2 px-0 text-sm capitalize"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="details" className="flex-1 overflow-auto mt-0">
          <DetailsTab application={application} />
        </TabsContent>

        <TabsContent value="notes" className="flex-1 overflow-auto mt-0">
          <NotesTab application={application} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
