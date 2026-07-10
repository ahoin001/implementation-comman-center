import { HeroSection } from '@/components/dashboard/HeroSection'
import { MyDayWidget } from '@/components/dashboard/MyDayWidget'
import { UpcomingMeetings, RecentActivity } from '@/components/dashboard/ActivityWidgets'
import { UpcomingLaunches } from '@/components/dashboard/UpcomingLaunches'

export function DashboardPage() {
  return (
    <div>
      <HeroSection />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MyDayWidget />
        </div>
        <div>
          <UpcomingMeetings />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RecentActivity />
        <UpcomingLaunches />
      </div>
    </div>
  )
}
