import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronUp } from 'lucide-react'
import { signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/design-system/react'

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
        <div
          id={menuId}
          role="menu"
          className={cn(
            'menu-pop absolute bottom-[calc(100%+0.5rem)] w-56 overflow-hidden',
            docked ? 'left-0' : 'right-0'
          )}
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{name}</p>
            {email && <p className="truncate font-[family-name:var(--mono)] text-[11px] text-[var(--ink-3)]">{email}</p>}
          </div>
          <Link
            to="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="nav-item"
          >
            <Icon name="gear" />
            Settings
          </Link>
          <button type="button" role="menuitem" onClick={() => void signOut()} className="nav-item text-[var(--danger)]">
            <Icon name="power" />
            Sign out
          </button>
        </div>
      )}

      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={cn('nav-item', !docked && 'card-w rounded-full py-1 pl-1 pr-2.5')}
      >
        <Avatar name={name} />
        <span className={cn('truncate text-sm font-medium', docked ? 'max-w-[7.5rem] text-[13px]' : 'max-w-[9rem]')}>
          {name}
        </span>
        <ChevronUp
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-[var(--ink-3)] transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </button>
    </div>
  )
}
