import { Outlet } from 'react-router-dom'
import { LayoutGroup } from 'framer-motion'
import { Sidebar, MobileNav } from './Navigation'
import { GlobalSearch } from '@/components/search/GlobalSearch'

/**
 * No page-level AnimatePresence / popLayout here.
 * popLayout inserts a height placeholder for the exiting route; on full-page
 * swaps that placeholder often sticks until resize — the huge top gap on Projects.
 * Shared layoutIds still work via LayoutGroup for card ↔ detail morphs.
 */
export function AppLayout() {
  return (
    <LayoutGroup id="app">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 glass border-b border-[var(--color-border)] px-4 lg:px-8 py-3">
            <GlobalSearch />
          </header>
          <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-8">
            <Outlet />
          </main>
        </div>
        <MobileNav />
      </div>
    </LayoutGroup>
  )
}
