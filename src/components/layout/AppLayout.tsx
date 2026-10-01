import { Outlet } from 'react-router-dom'
import { LayoutGroup } from 'framer-motion'
import { Sidebar, MobileNav } from './Navigation'
import { ProfileChip } from './ProfileChip'
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
      <div className="flex min-h-screen gap-3 p-3 lg:gap-4 lg:p-4">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="mb-3 flex justify-end">
            <GlobalSearch />
          </header>
          <main className="flex-1 pb-28 lg:pb-2">
            <Outlet />
          </main>
        </div>
        <MobileNav />
        <ProfileChip />
      </div>
    </LayoutGroup>
  )
}
