'use client'

import { Minus, Plus } from 'lucide-react'

interface ZoomControlProps {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
}

export function ZoomControl({ scale, onZoomIn, onZoomOut }: ZoomControlProps) {
  return (
    <div className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5 text-xs">
      <button
        type="button"
        onClick={onZoomOut}
        className="hover:text-foreground text-muted-foreground"
      >
        <Minus size={12} />
      </button>
      <span className="min-w-[36px] text-center">
        {Math.round(scale * 100)}%
      </span>
      <button
        type="button"
        onClick={onZoomIn}
        className="hover:text-foreground text-muted-foreground"
      >
        <Plus size={12} />
      </button>
    </div>
  )
}
