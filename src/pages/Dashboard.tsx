import { HeroSection } from '@/components/dashboard/HeroSection'
import { MyDayWidget } from '@/components/dashboard/MyDayWidget'
import { UpcomingMeetings, RecentActivity } from '@/components/dashboard/ActivityWidgets'
import { UpcomingLaunches } from '@/components/dashboard/UpcomingLaunches'
import { LoadingState } from '@/components/ui/EmptyState'
import { useStore } from '@/store/useStore'

export function DashboardPage() {
  const hydrated = useStore((s) => s.hydrated)

  if (!hydrated) {
    return <LoadingState label="Loading the board" />
  }

  return (
    <div className="screen">
      <HeroSection />
      <div className="split-hero sy-stagger">
        <MyDayWidget />
        <UpcomingMeetings />
      </div>
      <div className="split-support sy-stagger">
        <RecentActivity />
        <UpcomingLaunches />
      </div>
    </div>
  )
}
