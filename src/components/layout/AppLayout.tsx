import { Outlet, useLocation } from 'react-router-dom'
import { LayoutGroup } from 'framer-motion'
import { Sidebar, MobileNav } from './Navigation'
import { ProfileChip } from './ProfileChip'

export function AppLayout() {
  const location = useLocation()

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
            <div key={location.pathname} className="page-in">
              <Outlet />
            </div>
          </main>
        </div>
        <MobileNav />
        <ProfileChip />
      </div>
    </LayoutGroup>
  )
}
