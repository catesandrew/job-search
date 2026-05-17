'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/use-toast'

interface DownloadButtonProps {
  resumeId: string
  resumeTitle: string
}

export function DownloadButton({ resumeId, resumeTitle }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDownload = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/resumes/${resumeId}/pdf`)
      if (!res.ok) throw new Error('Failed to generate PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resumeTitle}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'PDF generation failed', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="h-8 text-xs gap-1.5"
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Download size={12} />
      )}
      Download
    </Button>
  )
}
