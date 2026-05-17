'use client'

import { useState } from 'react'
import { useResumes, useCreateResume, useDeleteResume, useTailorRuns, Resume, TailorRun } from '@/hooks/use-resume'
import { ResumeListRow } from '@/components/resumes/resume-list-row'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FileText, Sparkles, Plus, CircleDot, Wand2, CheckCircle2, XCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ResumeType = 'BASE' | 'JOB_APPLICATION_OPTIMIZED' | 'JOB_TITLE_OPTIMIZED'
type ActiveTab = ResumeType | 'TAILOR_HISTORY'

const resumeTabs: { value: ResumeType; label: string }[] = [
  { value: 'BASE', label: 'Base Resumes' },
  { value: 'JOB_APPLICATION_OPTIMIZED', label: 'Job Application Optimized Resumes' },
  { value: 'JOB_TITLE_OPTIMIZED', label: 'Job Title Optimized Resumes' },
]

export default function ResumesPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('BASE')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('active')
  const router = useRouter()
  const { data: resumes = [], isLoading } = useResumes()
  const { data: tailorRuns = [], isLoading: runsLoading } = useTailorRuns()
  const createResume = useCreateResume()
  const deleteResume = useDeleteResume()

  const filteredResumes = resumes.filter((r: Resume) => {
    if (r.type !== activeTab) return false
    if (search) {
      return r.title.toLowerCase().includes(search.toLowerCase())
    }
    return true
  })

  const tabCounts = resumeTabs.map(tab => ({
    ...tab,
    count: resumes.filter((r: Resume) => r.type === tab.value).length,
  }))

  const handleCreate = async () => {
    try {
      const result = await createResume.mutateAsync({
        title: 'Untitled Resume',
        type: 'BASE',
      })
      router.push(`/resumes/${result.id}/edit`)
    } catch {
      // error handled by mutation
    }
  }

  const handleDelete = (id: string) => {
    deleteResume.mutate(id)
  }

  return (
    <div className="p-8">
      {/* Top row: filter + search + actions */}
      <div className="flex items-center gap-3 mb-6">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Active Resumes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Resumes</SelectItem>
            <SelectItem value="all">All Resumes</SelectItem>
          </SelectContent>
        </Select>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search resumes..."
          className="max-w-[260px]"
        />
        <div className="flex-1" />
        {/* Optimize Resume: disabled at list level — use the resume preview inside an application */}
        <Button
          type="button"
          size="sm"
          className="h-8 text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white opacity-50 cursor-not-allowed"
          disabled
          title="Open an application and use Optimize from the resume preview"
        >
          <Sparkles size={12} />
          Optimize Resume
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8 text-xs gap-1.5 bg-mint hover:bg-mint/90 text-primary-foreground"
          onClick={handleCreate}
          disabled={createResume.isPending}
        >
          <Plus size={12} />
          Create Resume
        </Button>
      </div>

      {/* Main heading */}
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Resumes</h1>
          <p className="text-sm text-muted-foreground">
            Manage and create resumes.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-6">
        {tabCounts.map(tab => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.value
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 min-w-[20px] justify-center"
            >
              {tab.count}
            </Badge>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setActiveTab('TAILOR_HISTORY')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'TAILOR_HISTORY'
              ? 'border-foreground text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wand2 size={13} />
          Tailor History
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 min-w-[20px] justify-center"
          >
            {tailorRuns.length}
          </Badge>
        </button>
      </div>

      {activeTab === 'TAILOR_HISTORY' ? (
        runsLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading history...</div>
        ) : tailorRuns.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No tailor runs yet. Use &quot;Tailor from Library&quot; in a resume editor to get started.
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card">
            {tailorRuns.map((run: TailorRun) => {
              const date = new Date(run.tailoredAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })
              const time = new Date(run.tailoredAt).toLocaleTimeString('en-US', {
                hour: 'numeric', minute: '2-digit',
              })
              return (
                <div key={run.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-white/5">
                  <Wand2 size={15} className="text-purple-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/resumes/${run.resumeId}/edit`}
                        className="text-sm font-medium hover:text-mint transition-colors truncate"
                      >
                        {run.resume.title}
                      </Link>
                      {(run.company || run.role) && (
                        <span className="text-xs text-muted-foreground truncate">
                          → {[run.role, run.company].filter(Boolean).join(' at ')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        {run.summaryGenerated
                          ? <CheckCircle2 size={10} className="text-green-500" />
                          : <XCircle size={10} className="text-muted-foreground" />}
                        Summary
                      </span>
                      <span className="text-[11px] text-muted-foreground">{run.skillCount} skill categories</span>
                      <span className="text-[11px] text-muted-foreground">{run.positionCount} positions</span>
                      {run.repositoryCount > 0 && (
                        <span className="text-[11px] text-muted-foreground">{run.repositoryCount} repos</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{date} {time}</span>
                </div>
              )
            })}
          </div>
        )
      ) : (
        <>
          {/* Active section header */}
          <div className="flex items-center gap-2 mb-3">
            <CircleDot size={14} className="text-green-500" />
            <span className="text-sm font-medium">Active</span>
          </div>

          {/* Resume rows */}
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading resumes...
            </div>
          ) : filteredResumes.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                No resumes found in this category.
              </p>
              <Button
                type="button"
                size="sm"
                className="bg-mint hover:bg-mint/90 text-primary-foreground"
                onClick={handleCreate}
                disabled={createResume.isPending}
              >
                <Plus size={12} className="mr-1.5" />
                Create Resume
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card">
              {filteredResumes.map((resume: Resume) => (
                <ResumeListRow
                  key={resume.id}
                  resume={resume}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
