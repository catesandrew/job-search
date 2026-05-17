'use client'

import { use } from 'react'
import { useResume } from '@/hooks/use-resume'
import { EditorLayout } from '@/components/resumes/editor/editor-layout'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditResumePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: resume, isLoading } = useResume(id)

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (!resume) {
    return (
      <div className="p-8 text-muted-foreground">Resume not found</div>
    )
  }

  return <EditorLayout resume={resume} />
}
