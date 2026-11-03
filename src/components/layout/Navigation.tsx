import { NavLink, useLocation } from 'react-router-dom'
import { BrandMark, Icon } from '@/design-system/react'
import type { IconName } from '@/design-system/react'
import { ProfileChip } from './ProfileChip'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'

const navItems: { to: string; label: string; icon: IconName; enabled: boolean }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'gauge', enabled: false },
  { to: '/projects', label: 'Projects', icon: 'folder', enabled: true },
  { to: '/my-projects', label: 'My Projects', icon: 'heart', enabled: true },
  { to: '/calendar', label: 'Calendar', icon: 'clock', enabled: false },
  { to: '/archive', label: 'Archive', icon: 'history', enabled: true },
  { to: '/settings', label: 'Settings', icon: 'gear', enabled: true },
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
    <aside className="nav rise">
      <div className="brand">
        <BrandMark size={30} />
        <div className="min-w-0">
          <p className="brand-name">Command Center</p>
          <p className="nav-label !p-0">Implementation</p>
        </div>
      </div>

      <p className="nav-label">Workspace</p>
      <nav className="flex flex-col gap-0.5">
        {visibleNav.map(({ to, label, icon }) => {
          const isActive = isNavActive(to, location.pathname)
          return (
            <NavLink key={to} to={to} className={cn('nav-item', isActive && 'on')}>
              <Icon name={icon} />
              <span className="min-w-0 flex-1 truncate">{label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="nav-foot">
        <div className="disk">
          <ThemeToggle />
          <ProfileChip docked />
        </div>
      </div>
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
      className="nav-item"
    >
      <Icon name={dark ? 'spark' : 'power'} />
      <span>{dark ? 'Light' : 'Graphite'}</span>
    </button>
  )
}

export function MobileNav() {
  const location = useLocation()

  return (
    <nav className="icc-mobile-dock fx-dock">
      {visibleNav.map(({ to, label, icon }) => {
        const isActive = isNavActive(to, location.pathname)
        return (
          <NavLink key={to} to={to} className={cn('nav-item', isActive && 'on')}>
            <Icon name={icon} />
            <span>{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
