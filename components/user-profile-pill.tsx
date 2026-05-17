'use client'

import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function UserProfilePill({ collapsed }: { collapsed?: boolean }) {
  const { data: session } = useSession()
  const name = session?.user?.name || session?.user?.email?.split('@')[0] || 'User'
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={`flex items-center gap-2 rounded-lg p-2 ${collapsed ? 'justify-center' : ''}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-xs font-medium text-white">
          {initials}
        </AvatarFallback>
      </Avatar>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
        </div>
      )}
    </div>
  )
}
