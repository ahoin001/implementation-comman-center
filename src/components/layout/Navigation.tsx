import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Star,
  Calendar,
  Archive,
  Settings,
  Command,
} from 'lucide-react'
import { ProfileChip } from './ProfileChip'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/my-projects', label: 'My Projects', icon: Star },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/archive', label: 'Archive', icon: Archive },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function isNavActive(to: string, pathname: string) {
  if (to === '/') return pathname === '/'
  if (to === '/projects') return pathname === '/projects' || pathname.startsWith('/projects/')
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="hidden lg:flex w-[248px] shrink-0 sticky top-4 h-[calc(100dvh-2rem)]">
      <div className="float-panel flex w-full flex-col p-3">
        <div className="flex items-center gap-2.5 px-2 pb-4 pt-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#3b6cff] text-white shadow-[0_8px_16px_-8px_rgba(59,108,255,0.9)]">
            <Command className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight leading-none">Command Center</p>
            <p className="mt-1 text-[11px] text-[var(--color-muted-foreground)]">Implementation</p>
          </div>
        </div>

        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
          Navigate
        </p>

        <nav className="flex-1 space-y-1 overflow-y-auto px-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = isNavActive(to, location.pathname)
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2.5 rounded-2xl px-3 py-2.5 text-sm font-medium transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.98]',
                  isActive
                    ? 'bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)] text-[var(--color-accent)]'
                    : 'text-[var(--color-foreground)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-2 border-t border-[var(--color-border)] pt-2">
          <ProfileChip docked />
        </div>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const location = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-3 inset-x-3 z-50">
      <div className="float-panel flex items-center justify-between gap-1 overflow-x-auto px-2 py-2">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = isNavActive(to, location.pathname)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex shrink-0 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-colors duration-150 active:scale-[0.95]',
                isActive
                  ? 'bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)] text-[var(--color-accent)]'
                  : 'text-[var(--color-muted-foreground)]'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
