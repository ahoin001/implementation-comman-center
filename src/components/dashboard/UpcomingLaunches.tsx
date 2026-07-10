import { Link } from 'react-router-dom'
import { ArrowRight, Rocket } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { ProgressRing } from '@/components/project/ProgressRing'
import { useStore } from '@/store/useStore'
import { useActiveProjects } from '@/hooks/useProjects'
import { calculateProgress } from '@/lib/progress'
import { calculateHealth, getDaysRemaining, formatLaunchDate } from '@/lib/health'

export function UpcomingLaunches() {
  const setActiveFilter = useStore((s) => s.setActiveFilter)
  const projects = useActiveProjects()
    .filter((p) => p.launchDate)
    .sort((a, b) => (a.launchDate ?? '').localeCompare(b.launchDate ?? ''))
    .slice(0, 5)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between mb-2">
        <CardTitle>Upcoming Launches</CardTitle>
        <Link
          to="/projects"
          onClick={() => setActiveFilter('launching_soon')}
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          View all
        </Link>
      </CardHeader>

      {projects.length === 0 ? (
        <Link
          to="/projects"
          onClick={() => setActiveFilter('no_launch_date')}
          className="flex flex-col items-center justify-center gap-2 py-8 text-center rounded-[var(--radius-md)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <Rocket className="h-5 w-5 text-[var(--color-muted)]" />
          <p className="text-sm text-[var(--color-muted-foreground)]">No launch dates set</p>
          <span className="text-xs text-[var(--color-accent)]">Projects without dates</span>
        </Link>
      ) : (
        <div className="space-y-0.5">
          {projects.map((project) => {
            const progress = calculateProgress(project)
            const health = calculateHealth(project)
            const days = getDaysRemaining(project.launchDate)

            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2.5 -mx-2 transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] group"
              >
                <ProgressRing progress={progress} size={40} strokeWidth={3} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{project.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {formatLaunchDate(project.launchDate)}
                    {days !== null && days >= 0 && ` · ${days} days`}
                    {days !== null && days < 0 && ` · ${Math.abs(days)}d overdue`}
                  </p>
                </div>
                <HealthBadge health={health} showLabel={false} />
                <ArrowRight className="h-4 w-4 text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}
