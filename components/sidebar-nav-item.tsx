'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface SidebarNavItemProps {
  href: string
  label: string
  icon: LucideIcon
  collapsed?: boolean
}

export function SidebarNavItem({ href, label, icon: Icon, collapsed }: SidebarNavItemProps) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        'text-muted-foreground hover:text-foreground hover:bg-white/5',
        isActive && 'bg-white/10 text-foreground',
        collapsed && 'justify-center px-2'
      )}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} strokeWidth={1.5} />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}
