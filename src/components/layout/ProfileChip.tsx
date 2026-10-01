import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronUp, LogOut, Settings } from 'lucide-react'
import { signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Panel } from '@/components/ui/Panel'

export function ProfileChip({ docked = false }: { docked?: boolean }) {
  const currentUserId = useStore((s) => s.currentUserId)
  const profiles = useStore((s) => s.profiles)
  const userName = useStore((s) => s.settings.userName)
  const [email, setEmail] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const name =
    profiles.find((profile) => profile.id === currentUserId)?.displayName ||
    userName ||
    'You'

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null)
    })
  }, [])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className={
        docked
          ? 'relative'
          : 'fixed z-[60] right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:hidden'
      }
    >
      {open && (
        <Panel
          id={menuId}
          role="menu"
          className={cn(
            'absolute bottom-[calc(100%+0.5rem)] w-56 overflow-hidden p-0',
            docked ? 'left-0' : 'right-0'
          )}
        >
          <div className="px-3 py-2.5 border-b border-[var(--color-border)]">
            <p className="text-sm font-medium truncate">{name}</p>
            {email && (
              <p className="text-[11px] text-[var(--color-muted-foreground)] truncate">{email}</p>
            )}
          </div>
          <div className="p-1">
            <Link
              to="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-2 text-sm text-[var(--color-foreground)] hover:bg-black/5 dark:hover:bg-white/5"
            >
              <Settings className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              Settings
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => void signOut()}
              className="flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </Panel>
      )}

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex items-center gap-2.5 transition-[transform,background-color] duration-150 active:scale-[0.98]',
          docked
            ? 'w-full rounded-2xl px-2 py-2 text-left hover:bg-black/[0.04] dark:hover:bg-white/5'
            : 'float-panel rounded-full py-1 pl-1 pr-2.5 hover:bg-[var(--color-field)]'
        )}
      >
        <Avatar name={name} />
        <span className="max-w-[9rem] truncate text-sm font-medium">{name}</span>
        <ChevronUp
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </button>
    </div>
  )
}
