'use client'

import { Suspense, useState } from 'react'
import { ApplicationForm } from '@/components/applications/application-form'
import { useCreateApplication, useImportApplicationUrl } from '@/hooks/use-applications'
import type { ExtractedApplication } from '@/hooks/use-applications'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Wand2, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/lib/use-toast'

function NewApplicationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const createApp = useCreateApplication()
  const importUrl = useImportApplicationUrl()
  const { toast } = useToast()

  const [urlInput, setUrlInput] = useState('')
  const [imported, setImported] = useState<ExtractedApplication | null>(null)

  const initialStatus = searchParams.get('status') as
    | 'WISHLIST'
    | 'APPLIED'
    | 'INTERVIEWING'
    | 'OFFER'
    | 'REJECTED'
    | null

  async function handleImport() {
    if (!urlInput.trim()) return
    try {
      const data = await importUrl.mutateAsync(urlInput.trim())
      setImported(data)
      toast({ title: 'Job imported', description: `${data.company} — ${data.role}` })
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Could not import job posting',
        variant: 'destructive',
      })
    }
  }

  const defaultValues = imported
    ? {
        company: imported.company,
        role: imported.role,
        location: imported.location ?? undefined,
        salaryMin: imported.salaryMin ?? undefined,
        salaryMax: imported.salaryMax ?? undefined,
        salaryFreq: (imported.salaryFreq ?? undefined) as 'yearly' | 'monthly' | 'hourly' | undefined,
        companyUrl: imported.companyUrl ?? undefined,
        jobDescription: imported.jobDescription ?? undefined,
        status: initialStatus ?? undefined,
      }
    : initialStatus
      ? { status: initialStatus }
      : undefined

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-full border border-border">
          <Plus size={14} />
        </div>
        <h1 className="text-lg font-semibold">Create New Job Application</h1>
      </div>

      {/* URL import section */}
      <div className="px-6 py-4 border-b border-border shrink-0 bg-muted/30">
        <p className="text-sm text-muted-foreground mb-2">Paste a job posting URL to auto-fill the form</p>
        <div className="flex gap-2">
          <Input
            placeholder="https://job-boards.greenhouse.io/..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleImport() }}
            disabled={importUrl.isPending}
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={handleImport}
            disabled={importUrl.isPending || !urlInput.trim()}
          >
            {importUrl.isPending ? (
              <Loader2 size={15} className="mr-1.5 animate-spin" />
            ) : (
              <Wand2 size={15} className="mr-1.5" />
            )}
            {importUrl.isPending ? 'Importing…' : 'Import'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {importUrl.isPending ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <ApplicationForm
            key={imported ? JSON.stringify(imported) : 'empty'}
            defaultValues={defaultValues}
            onSubmit={async (data) => {
              await createApp.mutateAsync(data)
              router.push('/applications')
            }}
            isLoading={createApp.isPending}
          />
        )}
      </div>
    </div>
  )
}

export default function NewApplicationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px]" />
        </div>
      }
    >
      <NewApplicationContent />
    </Suspense>
  )
}
