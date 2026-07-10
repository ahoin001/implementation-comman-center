import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Rocket, Calendar, AlertCircle, Users, ArrowUpRight } from 'lucide-react'
import type { ProjectFilter } from '@/types'
import { useStore } from '@/store/useStore'
import { useDashboardStats } from '@/hooks/useProjects'
import { getGreeting, cn } from '@/lib/utils'

const statItems: {
  label: string
  key: keyof ReturnType<typeof useDashboardStats>
  icon: typeof Users
  filter: ProjectFilter
}[] = [
  { label: 'Active Projects', key: 'activeProjects', icon: Users, filter: 'all' },
  { label: 'Launches This Week', key: 'launchesThisWeek', icon: Rocket, filter: 'launching_soon' },
  { label: 'Waiting on Client', key: 'waitingOnClient', icon: Calendar, filter: 'waiting_on_client' },
  { label: 'Needs Attention', key: 'needsAttention', icon: AlertCircle, filter: 'needs_attention' },
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
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
      className="mb-8"
    >
      <p className="text-sm text-[var(--color-muted-foreground)] mb-1">{getGreeting()} {userName}</p>
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--color-foreground)] mb-6">
        Implementation Command Center
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statItems.map(({ label, key, icon: Icon, filter }, i) => (
          <motion.button
            key={label}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', bounce: 0, duration: 0.35 }}
            onClick={() => openProjects(filter)}
            className={cn(
              'glass rounded-[var(--radius-lg)] p-4 text-left group',
              'transition-[transform,background-color] duration-150 ease-[var(--ease-out)]',
              'hover:bg-[var(--color-card-solid)] active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]'
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="h-4 w-4 text-[var(--color-accent)] shrink-0" />
                <span className="text-xs text-[var(--color-muted-foreground)] truncate">{label}</span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{stats[key]}</p>
          </motion.button>
        ))}
      </div>
    </motion.section>
  )
}
