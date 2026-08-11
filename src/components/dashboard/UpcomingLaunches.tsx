import { Link } from 'react-router-dom'
import { ArrowRight, Rocket } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { ProgressRing } from '@/components/project/ProgressRing'
import { FlexibleFollowUpBadges } from '@/components/project/FlexibleFollowUpBadges'
import { useStore } from '@/store/useStore'
import { useActiveProjects } from '@/hooks/useProjects'
import {
  calculateProgress,
  hasOpenFlexibleTasks,
  isLaunchFullyWrapped,
  isProjectLaunchComplete,
} from '@/lib/progress'
import { calculateHealth, getDaysRemaining, formatLaunchDate } from '@/lib/health'
import { cn } from '@/lib/utils'

export function UpcomingLaunches() {
  const setActiveFilter = useStore((s) => s.setActiveFilter)
  const projects = useActiveProjects()
    .filter((p) => p.launchDate)
    .sort((a, b) => {
      // incomplete flexible follow-up stays more visible near top of launched items
      const aScore =
        (isProjectLaunchComplete(a) ? 2 : 0) + (hasOpenFlexibleTasks(a) && isProjectLaunchComplete(a) ? -1 : 0)
      const bScore =
        (isProjectLaunchComplete(b) ? 2 : 0) + (hasOpenFlexibleTasks(b) && isProjectLaunchComplete(b) ? -1 : 0)
      if (aScore !== bScore) return aScore - bScore
      return (a.launchDate ?? '').localeCompare(b.launchDate ?? '')
    })
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
            const launched = isProjectLaunchComplete(project)
            const fullyWrapped = isLaunchFullyWrapped(project)
            const flexOpen = hasOpenFlexibleTasks(project)
            const days = getDaysRemaining(project.launchDate)

            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2.5 -mx-2 transition-[background-color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.99] group',
                  fullyWrapped
                    ? 'bg-[var(--color-success)]/[0.06] hover:bg-[var(--color-success)]/[0.1]'
                    : launched && flexOpen
                      ? 'bg-[var(--color-warning)]/[0.07] hover:bg-[var(--color-warning)]/[0.12]'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                )}
              >
                <ProgressRing
                  progress={progress}
                  size={40}
                  strokeWidth={3}
                  launched={fullyWrapped}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium truncate',
                      fullyWrapped && 'text-[var(--color-muted-foreground)]'
                    )}
                  >
                    {project.name}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {launched ? (
                      <>
                        Launched
                        {project.launchDate && ` · ${formatLaunchDate(project.launchDate)}`}
                      </>
                    ) : (
                      <>
                        {formatLaunchDate(project.launchDate)}
                        {days !== null && days >= 0 && ` · ${days} days`}
                        {days !== null && days < 0 && ` · ${Math.abs(days)}d overdue`}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0 max-w-[42%]">
                  {launched ? (
                    <HealthBadge health="complete" />
                  ) : (
                    <HealthBadge health={health} showLabel={false} />
                  )}
                  <FlexibleFollowUpBadges project={project} compact />
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </Card>
  )
}
