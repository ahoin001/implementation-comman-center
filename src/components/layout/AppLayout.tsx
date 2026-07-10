import { useLocation, Outlet } from 'react-router-dom'
import { LayoutGroup, AnimatePresence, motion } from 'framer-motion'
import { Sidebar, MobileNav } from './Navigation'
import { GlobalSearch } from '@/components/search/GlobalSearch'

export function AppLayout() {
  const location = useLocation()
  const isProjectRoute = location.pathname.startsWith('/projects')

  return (
    <LayoutGroup id="app">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 glass border-b border-[var(--color-border)] px-4 lg:px-8 py-3">
            <GlobalSearch />
          </header>
          <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-8">
            <AnimatePresence mode={isProjectRoute ? 'popLayout' : 'wait'} initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <MobileNav />
      </div>
    </LayoutGroup>
  )
}
