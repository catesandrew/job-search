import { Camera } from 'lucide-react'

export default function HeadshotsPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <Camera className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-2xl font-semibold mb-2">Headshots</h1>
      <p className="text-muted-foreground max-w-md">
        AI headshot generation is coming soon. Upload a photo and generate professional headshots for your applications.
      </p>
    </div>
  )
}
