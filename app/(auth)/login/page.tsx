import { Briefcase } from 'lucide-react'
import { LoginForm } from './login-form'

export default function LoginPage() {
  const showZitadel = !!(process.env.ZITADEL_ISSUER && process.env.ZITADEL_CLIENT_ID)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">JobSearch</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <LoginForm showZitadel={showZitadel} />
      </div>
    </div>
  )
}
