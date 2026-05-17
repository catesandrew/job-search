'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { useResumes } from '@/hooks/use-resume'
import type { Resume } from '@/hooks/use-resume'
import { useApplications } from '@/hooks/use-applications'
import type { Application } from '@/hooks/use-applications'
import { useGenerateCoverLetter, type CoverLetter } from '@/hooks/use-cover-letters'

interface CreateCoverLetterDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (letter: CoverLetter) => void
}

export function CreateCoverLetterDialog({ open, onClose, onCreated }: CreateCoverLetterDialogProps) {
  const [resumeId, setResumeId] = useState<string>('')
  const [applicationId, setApplicationId] = useState<string>('')

  const resumesQuery = useResumes()
  const applicationsQuery = useApplications()
  const resumes: Resume[] = resumesQuery.data ?? []
  const applications: Application[] = applicationsQuery.data ?? []
  const generate = useGenerateCoverLetter()

  const handleGenerate = async () => {
    if (!resumeId && !applicationId) return
    const letter = await generate.mutateAsync({
      resumeId: resumeId || undefined,
      applicationId: applicationId || undefined,
    })
    onCreated(letter)
    setResumeId('')
    setApplicationId('')
  }

  const handleClose = () => {
    if (generate.isPending) return
    setResumeId('')
    setApplicationId('')
    generate.reset()
    onClose()
  }

  const canGenerate = !!(resumeId || applicationId)

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Cover Letter</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Resume picker */}
          <div className="grid grid-cols-[1fr_auto] items-start gap-6">
            <div>
              <p className="text-sm font-medium mb-0.5">Resume Source</p>
              <p className="text-xs text-muted-foreground">Choose which resume to use as the source.</p>
            </div>
            <Select value={resumeId} onValueChange={setResumeId}>
              <SelectTrigger className="w-52 text-xs">
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
          </div>

          {/* Application picker */}
          <div className="grid grid-cols-[1fr_auto] items-start gap-6">
            <div>
              <p className="text-sm font-medium mb-0.5">Job Application Source</p>
              <p className="text-xs text-muted-foreground">Choose which job application to use as the source.</p>
            </div>
            <Select value={applicationId} onValueChange={setApplicationId}>
              <SelectTrigger className="w-52 text-xs">
                <SelectValue placeholder="Select or create application" />
              </SelectTrigger>
              <SelectContent>
                {applications
                  .filter((a: Application) => a.jobDescription)
                  .map((a: Application) => (
                    <SelectItem key={a.id} value={a.id} className="text-xs">
                      {a.company} — {a.role}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {generate.isError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle size={14} className="shrink-0" />
              {generate.error instanceof Error ? generate.error.message : 'Generation failed'}
            </div>
          )}

          {generate.isPending && (
            <div className="space-y-2 pt-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={generate.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleGenerate}
            disabled={!canGenerate || generate.isPending}
          >
            {generate.isPending ? 'Generating…' : 'Create Cover Letter'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
