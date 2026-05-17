'use client'

import { useState } from 'react'
import { Resume } from '@/hooks/use-resume'
import { ResumeDocument } from './resume-document'
import { ZoomControl } from './zoom-control'
import { Button } from '@/components/ui/button'
import { Sparkles, BarChart3 } from 'lucide-react'
import { OptimizeDialog } from '@/components/resumes/optimize-dialog'
import { ScorerPanel } from '@/components/resumes/scorer-panel'
import { DownloadButton } from '@/components/resumes/download-button'
import { scoreResume } from '@/lib/scoring/resume-scorer'

interface ResumePreviewProps {
  resume: Resume
  applicationId?: string
}

export function ResumePreview({ resume, applicationId }: ResumePreviewProps) {
  const [scale, setScale] = useState(0.6)
  const [optimizeOpen, setOptimizeOpen] = useState(false)
  const [scorerOpen, setScorerOpen] = useState(false)

  const zoomIn = () => setScale(s => Math.min(s + 0.1, 1.2))
  const zoomOut = () => setScale(s => Math.max(s - 0.1, 0.4))

  const scoreValue = scoreResume(resume).score

  return (
    <div
      className="relative h-full overflow-auto"
      style={{
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        backgroundColor: '#f9fafb',
      }}
    >
      {/* Top-left: Score badge — click to open scorer panel */}
      <button
        type="button"
        onClick={() => setScorerOpen(true)}
        title="View resume analysis"
        className="absolute top-4 left-4 z-10 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative flex items-center justify-center w-12 h-12 hover:opacity-80 transition-opacity">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="3" />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeDasharray={`${(scoreValue / 100) * 125.6} 125.6`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-xs font-bold text-gray-800">{scoreValue}</span>
        </div>
      </button>

      {/* Top-right: Action buttons */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="h-8 text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => setOptimizeOpen(true)}
        >
          <Sparkles size={12} />
          Optimize Resume
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8 text-xs gap-1.5 bg-mint hover:bg-mint/90 text-primary-foreground"
          onClick={() => setScorerOpen(true)}
        >
          <BarChart3 size={12} />
          Analyze Resume
        </Button>
        <DownloadButton resumeId={resume.id} resumeTitle={resume.title} />
      </div>

      {/* Centered resume document */}
      <div className="flex justify-center pt-20 pb-20 px-4">
        <ResumeDocument resume={resume} scale={scale} />
      </div>

      {/* Bottom-right: Zoom control */}
      <div className="absolute bottom-4 right-4 z-10">
        <ZoomControl scale={scale} onZoomIn={zoomIn} onZoomOut={zoomOut} />
      </div>

      <OptimizeDialog
        resumeId={resume.id}
        defaultApplicationId={applicationId}
        open={optimizeOpen}
        onClose={() => setOptimizeOpen(false)}
        onApproved={_resumeId => setOptimizeOpen(false)}
      />

      {/* Scorer Panel */}
      <ScorerPanel
        resumeId={resume.id}
        applicationId={applicationId}
        open={scorerOpen}
        onClose={() => setScorerOpen(false)}
      />
    </div>
  )
}
