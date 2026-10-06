import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Star,
  Calendar,
  Archive,
  Settings,
  Command,
  Moon,
  Sun,
} from 'lucide-react'
import { ProfileChip } from './ProfileChip'
import { Panel } from '@/components/ui/Panel'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, enabled: false },
  { to: '/projects', label: 'Projects', icon: FolderKanban, enabled: true },
  { to: '/my-projects', label: 'My Projects', icon: Star, enabled: true },
  { to: '/calendar', label: 'Calendar', icon: Calendar, enabled: false },
  { to: '/archive', label: 'Archive', icon: Archive, enabled: true },
  { to: '/settings', label: 'Settings', icon: Settings, enabled: true },
]

const visibleNav = navItems.filter((item) => item.enabled)

function isNavActive(to: string, pathname: string) {
  if (to === '/') return pathname === '/'
  if (to === '/projects') return pathname === '/projects' || pathname.startsWith('/projects/')
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="sticky top-4 hidden w-[204px] shrink-0 self-start lg:block">
      <Panel className="flex flex-col p-2">
        <div className="flex items-center gap-2 px-2 pb-2 pt-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-wash-strong)] text-white shadow-[0_8px_16px_-8px_color-mix(in_srgb,var(--color-wash-strong)_80%,transparent)]">
            <Command className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-none tracking-tight">Command Center</p>
            <p className="mt-1 text-[10px] text-[var(--color-ink-soft)]">Implementation</p>
          </div>
        </div>

        <nav className="space-y-0.5">
          {visibleNav.map(({ to, label, icon: Icon }) => {
            const isActive = isNavActive(to, location.pathname)
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[13px] font-medium transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.98]',
                  isActive
                    ? 'bg-[var(--color-wash)] text-[var(--color-wash-strong)]'
                    : 'text-[var(--color-ink)] hover:bg-[var(--color-field)]'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="mt-1 border-t border-[var(--color-border)] pt-1">
          <ThemeToggle />
          <ProfileChip docked />
        </div>
      </Panel>
    </aside>
  )
}

function ThemeToggle() {
  const theme = useStore((s) => s.settings.theme)
  const updateSettings = useStore((s) => s.updateSettings)
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => updateSettings({ theme: dark ? 'light' : 'dark' })}
      className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-[13px] font-medium text-[var(--color-ink)] transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-[var(--color-field)] active:scale-[0.98]"
    >
      {dark ? <Sun className="h-3.5 w-3.5 shrink-0" /> : <Moon className="h-3.5 w-3.5 shrink-0" />}
      <span>{dark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}

export function MobileNav() {
  const location = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-3 inset-x-3 z-50">
      <Panel className="flex items-center justify-between gap-1 overflow-x-auto px-2 py-2">
        {visibleNav.map(({ to, label, icon: Icon }) => {
          const isActive = isNavActive(to, location.pathname)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex shrink-0 flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 transition-colors duration-150 active:scale-[0.95]',
                isActive
                  ? 'bg-[var(--color-wash)] text-[var(--color-wash-strong)]'
                  : 'text-[var(--color-ink-soft)]'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          )
        })}
      </Panel>
    </nav>
  )
}
