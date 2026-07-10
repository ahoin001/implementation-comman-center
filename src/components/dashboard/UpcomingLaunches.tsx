import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { ProgressRing } from '@/components/project/ProgressRing'
import { useActiveProjects } from '@/hooks/useProjects'
import { calculateProgress } from '@/lib/progress'
import { calculateHealth, getDaysRemaining, formatLaunchDate } from '@/lib/health'

export function UpcomingLaunches() {
  const projects = useActiveProjects()
    .filter((p) => p.launchDate)
    .sort((a, b) => (a.launchDate ?? '').localeCompare(b.launchDate ?? ''))
    .slice(0, 5)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upcoming Launches</CardTitle>
        <Link to="/projects" className="text-xs text-[var(--color-accent)] hover:underline">
          View all
        </Link>
      </CardHeader>

      <div className="space-y-3">
        {projects.map((project) => {
          const progress = calculateProgress(project)
          const health = calculateHealth(project)
          const days = getDaysRemaining(project.launchDate)

          return (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="flex items-center gap-3 rounded-[var(--radius-md)] p-2 -mx-2 transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <ProgressRing progress={progress} size={40} strokeWidth={3} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{project.name}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {formatLaunchDate(project.launchDate)}
                  {days !== null && days >= 0 && ` · ${days} days`}
                </p>
              </div>
              <HealthBadge health={health} showLabel={false} />
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
