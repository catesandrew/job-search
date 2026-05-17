'use client'

import { useState } from 'react'
import { useApplications } from '@/hooks/use-applications'
import { KanbanBoard } from '@/components/applications/kanban-board'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const { data: applications = [], isLoading } = useApplications({
    status: statusFilter || undefined,
    search: search || undefined,
  })

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Active Applications" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="WISHLIST">Wishlist</SelectItem>
            <SelectItem value="APPLIED">Applied</SelectItem>
            <SelectItem value="INTERVIEWING">Interviewing</SelectItem>
            <SelectItem value="OFFER">Offer</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search applications"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="ml-auto">
          <Button asChild className="bg-mint hover:bg-mint/90 text-primary-foreground">
            <Link href="/applications/new">
              <Plus size={16} className="mr-2" />
              New Application
            </Link>
          </Button>
        </div>
      </div>
      {/* Board */}
      <div className="flex-1 overflow-hidden px-6 py-4">
        {isLoading ? (
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="min-w-[280px] space-y-2">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <KanbanBoard applications={applications} />
        )}
      </div>
    </div>
  )
}
