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
    <div>
      <div className="rise-in">
        <HeroSection />
      </div>

      <div className="rise-in grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ animationDelay: '40ms' }}>
        <div className="lg:col-span-2">
          <MyDayWidget />
        </div>
        <div>
          <UpcomingMeetings />
        </div>
      </div>

      <div className="rise-in mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2" style={{ animationDelay: '80ms' }}>
        <RecentActivity />
        <UpcomingLaunches />
      </div>
    </div>
  )
}
