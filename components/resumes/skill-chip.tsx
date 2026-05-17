import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SkillChipProps {
  label: string
  onRemove?: () => void
  className?: string
}

export function SkillChip({ label, onRemove, className }: SkillChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-950 text-green-400 border border-green-800',
        className
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:text-green-200 transition-colors"
        >
          <X size={10} />
        </button>
      )}
    </span>
  )
}
