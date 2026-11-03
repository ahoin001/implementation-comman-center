import { useNavigate } from 'react-router-dom'
import type { ProjectFilter } from '@/types'
import { useStore } from '@/store/useStore'
import { useDashboardStats } from '@/hooks/useProjects'
import { getGreeting } from '@/lib/utils'
import { LiveCard } from '@/design-system/react'
import type { IconName, LiveCardTone } from '@/design-system/react'
import { ScreenHead } from '@/components/ui/ScreenHead'

const statItems: {
  label: string
  key: keyof ReturnType<typeof useDashboardStats>
  icon: IconName
  tone: LiveCardTone
  unit?: string
  filter: ProjectFilter
  action: string
}[] = [
  { label: 'Active', key: 'activeProjects', icon: 'folder', tone: 'apps', filter: 'all', action: 'Open board' },
  { label: 'This week', key: 'launchesThisWeek', icon: 'gauge', tone: 'speed', filter: 'launching_soon', action: 'See launches' },
  { label: 'Waiting', key: 'waitingOnClient', icon: 'clock', tone: 'prot', filter: 'waiting_on_client', action: 'Follow up' },
  { label: 'Attention', key: 'needsAttention', icon: 'warning', tone: 'clean', filter: 'needs_attention', action: 'Review' },
]

export function HeroSection() {
  const userName = useStore((s) => s.settings.userName)
  const setActiveFilter = useStore((s) => s.setActiveFilter)
  const stats = useDashboardStats()
  const navigate = useNavigate()

  const openProjects = (filter: ProjectFilter) => {
    setActiveFilter(filter)
    navigate('/projects')
  }

  return (
    <section className="screen">
      <ScreenHead title="Command Center" sub={`${getGreeting()} ${userName}. Here’s what needs a hand today.`} />
      <div className="home-cards">
        {statItems.map(({ label, key, icon, tone, filter, action }) => (
          <button
            key={label}
            type="button"
            className="min-w-0 text-left"
            onClick={() => openProjects(filter)}
          >
            <LiveCard
              tone={tone}
              icon={icon}
              title={label}
              value={String(stats[key])}
              sub={action}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
