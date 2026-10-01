import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { ensureProfile } from '@/lib/auth'
import { setActorId } from '@/lib/session'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setReady(true)
      return
    }

    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setActorId(data.session?.user.id ?? null)
      setSession(data.session)
      setReady(true)
      if (data.session?.user) void ensureProfile(data.session.user).catch(() => undefined)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setActorId(next?.user.id ?? null)
      setSession(next)
      setReady(true)
      if (next?.user) void ensureProfile(next.user).catch(() => undefined)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  if (!isSupabaseConfigured()) return children
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--color-muted-foreground)]">
        Loading…
      </div>
    )
  }
  if (!session) return <AuthScreen />
  return children
}
