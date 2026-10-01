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
    <aside className="hidden lg:flex flex-col w-56 shrink-0 glass-heavy h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)]">
          <Command className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight leading-none">Command Center</p>
          <p className="text-[10px] text-[var(--color-muted-foreground)] mt-0.5">Implementation</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = isNavActive(to, location.pathname)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-[background-color,color] duration-150 ease-[var(--ease-out)] active:scale-[0.98]',
                isActive
                  ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                  : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-black/5 dark:hover:bg-white/5'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          )
        })}
      </nav>

    </aside>
  )
}

export function MobileNav() {
  const location = useLocation()

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 glass border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between gap-1 overflow-x-auto px-2 py-2">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = isNavActive(to, location.pathname)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex shrink-0 flex-col items-center gap-0.5 px-2 py-1.5 rounded-[var(--radius-md)] transition-colors duration-150 active:scale-[0.95]',
                isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-muted-foreground)]'
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
