import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function ApplicationsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-center">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Add a new job application</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Streamline your job search by adding job applications to your board
        </p>
      </div>
      <Button asChild className="bg-mint hover:bg-mint/90 text-primary-foreground">
        <Link href="/applications/new">
          <Plus size={16} className="mr-2" />
          New Job Application
        </Link>
      </Button>
    </div>
  )
}
