import { motion } from 'framer-motion'
import { Rocket, Calendar, AlertCircle, Users } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useDashboardStats } from '@/hooks/useProjects'
import { getGreeting } from '@/lib/utils'

export function HeroSection() {
  const userName = useStore((s) => s.settings.userName)
  const stats = useDashboardStats()

  const statItems = [
    { label: 'Active Projects', value: stats.activeProjects, icon: Users },
    { label: 'Launches This Week', value: stats.launchesThisWeek, icon: Rocket },
    { label: 'Waiting on Client', value: stats.waitingOnClient, icon: Calendar },
    { label: 'Needs Attention', value: stats.needsAttention, icon: AlertCircle },
  ]

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
        {statItems.map(({ label, value, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', bounce: 0, duration: 0.35 }}
            className="glass rounded-[var(--radius-lg)] p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-[var(--color-accent)]" />
              <span className="text-xs text-[var(--color-muted-foreground)]">{label}</span>
            </div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}
