import { useEffect, useRef } from 'react'
import { useStore } from '@/store/useStore'
import { subscribeRealtime } from '@/lib/supabaseApi'

/** Hydrates from Supabase and keeps the store in sync via Realtime. */
export function SupabaseSync({ children }: { children: React.ReactNode }) {
  const hydrate = useStore((s) => s.hydrate)
  const refresh = useStore((s) => s.refresh)
  const hydrated = useStore((s) => s.hydrated)
  const syncError = useStore((s) => s.syncError)
  const syncing = useStore((s) => s.syncing)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!hydrated) return
    return subscribeRealtime({
      onChange: () => {
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => {
          void refresh()
        }, 250)
      },
    })
  }, [hydrated, refresh])

  return (
    <>
      {(syncing || syncError) && (
        <div
          className={`fixed top-3 right-3 z-[100] rounded-[var(--radius-md)] px-3 py-2 text-xs shadow-lg ${
            syncError
              ? 'bg-[var(--color-danger)] text-white'
              : 'glass text-[var(--color-muted-foreground)]'
          }`}
        >
          {syncError
            ? `Supabase: ${syncError}`
            : 'Syncing…'}
        </div>
      )}
      {children}
    </>
  )
}
