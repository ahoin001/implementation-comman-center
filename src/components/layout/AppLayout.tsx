import { useEffect, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { LayoutGroup } from 'framer-motion'
import { settleViewTransition, wasViewTransition, markViewTransition } from '@/lib/viewTransition'
import { Sidebar, MobileNav } from './Navigation'
import { ProfileChip } from './ProfileChip'

function PageFrame({ children }: { children: ReactNode }) {
  const [quiet] = useState(wasViewTransition)

  useEffect(() => {
    const timer = window.setTimeout(settleViewTransition, 50)
    return () => window.clearTimeout(timer)
  }, [])

  return <div className={quiet ? 'page-settled' : 'page-in'}>{children}</div>
}

export function AppLayout() {
  const location = useLocation()

  useEffect(() => {
    const onPop = () => markViewTransition()
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return (
    <LayoutGroup id="app">
      <div className="app" data-bg="dots">
        <div className="bg-layer bg-dots" aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <div className="bg-layer bg-glow" aria-hidden>
          <i className="glow-lav" />
          <i className="glow-pink" />
          <div className="glow-horizon">
            <i />
          </div>
        </div>
        <div className="body">
          <Sidebar />
          <main className="main">
            <PageFrame key={location.pathname}>
              <Outlet />
            </PageFrame>
          </main>
        </div>
        <MobileNav />
        <ProfileChip />
      </div>
    </LayoutGroup>
  )
}
