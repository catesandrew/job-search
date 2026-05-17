'use client'

import { use, useState, useRef } from 'react'
import { useApplication } from '@/hooks/use-applications'
import { ApplicationOverview } from '@/components/applications/application-overview'
import { ApplicationDetailsSidebar } from '@/components/applications/application-details-sidebar'
import { CoverLetterDialog } from '@/components/applications/cover-letter-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Sparkles, ChevronRight, FileText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: application, isLoading } = useApplication(id)
  const [optimizing, setOptimizing] = useState(false)
  const [coverLetterOpen, setCoverLetterOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(360)
  const sidebarWidthRef = useRef(360)

  function startDrag(e: React.MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = sidebarWidthRef.current

    function onMove(ev: MouseEvent) {
      const newW = Math.max(260, Math.min(600, startW + (startX - ev.clientX)))
      sidebarWidthRef.current = newW
      setSidebarWidth(newW)
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  async function handleCreateOptimizedResume() {
    if (!application?.linkedResumeId) {
      alert('Link a resume in the Details panel first.')
      return
    }
    setOptimizing(true)
    try {
      const res = await fetch(`/api/resumes/${application.linkedResumeId}/clone`, {
        method: 'POST',
      })
      if (res.ok) {
        const json = await res.json()
        router.push(`/resumes/${json.data?.id ?? ''}/edit`)
      }
    } finally {
      setOptimizing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Application not found.</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <Link href="/applications" className="hover:text-foreground transition-colors shrink-0">
            Applications
          </Link>
          <ChevronRight size={14} className="shrink-0" />
          <span className="text-foreground truncate font-medium">
            {application.company} — {application.role}
          </span>
        </div>

        {/* Metadata badges */}
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <Badge variant="outline" className="gap-1 text-xs font-normal">
            <Clock size={11} />
            Created {fmt(application.createdAt)}
          </Badge>
          <Badge variant="outline" className="gap-1 text-xs font-normal">
            <Clock size={11} />
            Updated {fmt(application.updatedAt)}
          </Badge>
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            onClick={() => setCoverLetterOpen(true)}
          >
            <FileText size={13} />
            Generate Content
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            onClick={handleCreateOptimizedResume}
            disabled={optimizing}
          >
            <Sparkles size={13} />
            {optimizing ? 'Creating...' : 'Create Optimized Resume'}
          </Button>
        </div>
      </div>

      {/* Two-panel body */}
      <div className="flex-1 flex overflow-hidden">
        <ApplicationOverview application={application} />
        {/* Drag handle */}
        <div
          onMouseDown={startDrag}
          className="w-1 shrink-0 cursor-col-resize bg-border hover:bg-primary/40 transition-colors select-none"
        />
        <ApplicationDetailsSidebar
          application={application}
          style={{ width: sidebarWidth }}
        />
      </div>

      <CoverLetterDialog
        applicationId={id}
        open={coverLetterOpen}
        onClose={() => setCoverLetterOpen(false)}
      />
    </div>
  )
}
