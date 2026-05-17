'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

function LoginFormInner({ showZitadel }: { showZitadel: boolean }) {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      callbackUrl: '/applications',
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else if (result?.url) {
      window.location.href = result.url
    }
  }

  const displayError =
    error ||
    (urlError === 'CredentialsSignin'
      ? 'Invalid email or password'
      : urlError
        ? 'An error occurred'
        : '')

  return (
    <div className="space-y-4">
      {showZitadel && (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => signIn('zitadel', { callbackUrl: '/applications' })}
          >
            Sign in with Zitadel
          </Button>
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              or
            </span>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {displayError && <p className="text-sm text-red-500">{displayError}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  )
}

export function LoginForm({ showZitadel }: { showZitadel: boolean }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-muted rounded-md" />
          <div className="h-10 bg-muted rounded-md" />
          <div className="h-10 bg-muted rounded-md" />
        </div>
      }
    >
      <LoginFormInner showZitadel={showZitadel} />
    </Suspense>
  )
}
