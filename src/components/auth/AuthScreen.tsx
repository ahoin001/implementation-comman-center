import { useState } from 'react'
import { BrandMark } from '@/design-system/react'
import { Panel } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
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
    <div className="app" data-bg="dots">
      <div className="bg-layer bg-dots" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      <div className="relative z-[1] flex min-h-dvh items-center justify-center px-4">
        <Panel className="w-full max-w-sm panel rise">
          <div className="mb-6 flex items-center gap-2.5">
            <BrandMark size={30} />
            <div>
              <p className="brand-name leading-none">Command Center</p>
              <p className="nav-label !p-0">Implementation</p>
            </div>
          </div>

          <h1 className="mb-1 text-[22px] font-semibold tracking-[-0.018em]">
            {mode === 'sign-in' ? 'Sign in' : 'Create your account'}
          </h1>
          <p className="mb-5 max-w-[36ch] text-sm leading-normal text-[var(--ink-2)]">
            Teammates share every project. Star the ones you want on My Projects.
          </p>

          <div className="mb-5">
            <SegmentedControl
              label="Auth mode"
              value={mode}
              onChange={(next) => {
                setMode(next)
                setError(null)
                setNotice(null)
              }}
              options={[
                { id: 'sign-in', label: 'Sign in' },
                { id: 'sign-up', label: 'Sign up' },
              ]}
            />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'sign-up' && (
              <label className="field">
                Display name
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex"
                  autoComplete="nickname"
                  required
                />
              </label>
            )}
            <label className="field">
              Email
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@webscribble.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="field">
              Password
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

            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            {notice && <p className="text-sm text-[var(--ink-3)]">{notice}</p>}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Working…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  )
}
