'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navItems, taskItem } from '@/lib/navigation'
import { SidebarNavItem } from '@/components/sidebar-nav-item'
import { UserProfilePill } from '@/components/user-profile-pill'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

const STORAGE_KEY = 'sidebar-collapsed'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') setCollapsed(true)
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'pending-count'],
    queryFn: async () => {
      const res = await fetch('/api/tasks?done=false')
      if (!res.ok) return { data: [] }
      return res.json()
    },
    refetchInterval: 30000,
  })

  const pendingCount = tasksData?.data?.length ?? 0

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-border transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
      style={{
        backgroundColor: 'hsl(var(--sidebar-bg))',
      }}
    >
      {/* Header */}
      <div className={cn('flex items-center gap-2 px-4 py-4', collapsed && 'justify-center px-2')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Briefcase className="h-4 w-4 text-primary" />
        </div>
        {!collapsed && <span className="text-lg font-semibold">JobSearch</span>}
        <button
          onClick={toggleCollapsed}
          className={cn(
            'ml-auto flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors',
            collapsed && 'ml-0'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <SidebarNavItem key={item.href} {...item} collapsed={collapsed} />
        ))}

        <Separator className="my-3 bg-white/10" />

        {/* Tasks with badge */}
        <div className="relative">
          <SidebarNavItem {...taskItem} collapsed={collapsed} />
          {pendingCount > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                'absolute top-1 bg-orange-500/20 text-orange-400 text-[10px] px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center hover:bg-orange-500/20',
                collapsed ? 'right-0.5' : 'right-2'
              )}
            >
              {pendingCount}
            </Badge>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-2">
        <UserProfilePill collapsed={collapsed} />
        <button
          onClick={async () => {
            await signOut({ redirect: false })
            window.location.href = '/api/auth/federated-logout'
          }}
          className={cn(
            'mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut size={18} strokeWidth={1.5} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
