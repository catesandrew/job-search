import { CheckSquare } from 'lucide-react'

export default function TasksPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <CheckSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">Tasks</h1>
      </div>
      <p className="text-muted-foreground">Your tasks will appear here.</p>
    </div>
  )
}
