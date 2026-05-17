'use client'

import { useState, useEffect, useCallback } from 'react'
import { Resume } from './use-resume'

export function useResumePreview(resume: Resume | undefined) {
  const [previewResume, setPreviewResume] = useState<Resume | undefined>(resume)

  useEffect(() => {
    setPreviewResume(resume)
  }, [resume])

  const updatePreview = useCallback((updates: Partial<Resume>) => {
    setPreviewResume(prev => prev ? { ...prev, ...updates } : prev)
  }, [])

  return { previewResume, updatePreview }
}
