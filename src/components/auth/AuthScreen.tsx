import { useState } from 'react'
import { Command } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { signIn, signUp } from '@/lib/auth'

type Mode = 'sign-in' | 'sign-up'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      if (mode === 'sign-up') {
        const result = await signUp(displayName, email, password)
        if (result.needsConfirmation) {
          setNotice('Check your email to confirm this account, then sign in.')
          setMode('sign-in')
        }
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--color-background)]">
      <div className="glass w-full max-w-sm rounded-[var(--radius-xl)] p-6">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)]">
            <Command className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight leading-none">Command Center</p>
            <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">Implementation</p>
          </div>
        </div>

        <h1 className="text-xl font-semibold tracking-tight mb-1">
          {mode === 'sign-in' ? 'Sign in' : 'Create your account'}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-5">
          Teammates share every project. Star the ones you want on My Projects.
        </p>

        <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5 mb-5">
          {(
            [
              { id: 'sign-in' as const, label: 'Sign in' },
              { id: 'sign-up' as const, label: 'Sign up' },
            ]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setMode(tab.id)
                setError(null)
                setNotice(null)
              }}
              className={
                mode === tab.id
                  ? 'rounded-[calc(var(--radius-md)-2px)] bg-[var(--color-foreground)] px-3 py-1.5 text-sm font-medium text-[var(--color-background)]'
                  : 'rounded-[calc(var(--radius-md)-2px)] px-3 py-1.5 text-sm font-medium text-[var(--color-muted-foreground)]'
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'sign-up' && (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Display name</span>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex"
                autoComplete="nickname"
                required
              />
            </label>
          )}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Email</span>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@webscribble.com"
              autoComplete="email"
              required
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Password</span>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          </label>

          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
          {notice && <p className="text-sm text-[var(--color-muted-foreground)]">{notice}</p>}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Working…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
      </div>
    </div>
  )
}
