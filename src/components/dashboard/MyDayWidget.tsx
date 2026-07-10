import { Link } from 'react-router-dom'
import { ArrowRight, Rocket, Calendar, Mail, PenLine, CheckCircle2 } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { useMyDayActions } from '@/hooks/useProjects'
import { useStore } from '@/store/useStore'
import type { ProjectHealth } from '@/types'

const actionIcons: Record<string, typeof Rocket> = {
  Launch: Rocket,
  Schedule: Calendar,
  Follow: Mail,
  Finish: PenLine,
  Send: Mail,
  Import: CheckCircle2,
}

function getActionIcon(action: string) {
  const key = Object.keys(actionIcons).find((k) => action.includes(k))
  return key ? actionIcons[key] : PenLine
}

export function MyDayWidget() {
  const actions = useMyDayActions()
  const setActiveFilter = useStore((s) => s.setActiveFilter)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between mb-4">
        <CardTitle>To Do</CardTitle>
        <Link
          to="/projects"
          onClick={() => setActiveFilter('needs_attention')}
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          Needs attention
        </Link>
      </CardHeader>

      <ul className="space-y-1">
        {actions.map(({ projectId, projectName, action, health }) => {
          const Icon = getActionIcon(action)
          return (
            <li key={projectId}>
              <Link
                to={`/projects/${projectId}`}
                className="flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] group"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)]/10">
                  <Icon className="h-4 w-4 text-[var(--color-accent)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{action}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)] truncate">{projectName}</p>
                </div>
                <HealthBadge health={health as ProjectHealth} showLabel={false} />
                <ArrowRight className="h-4 w-4 text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            </li>
          )
        })}
      </ul>

      {actions.length === 0 && (
        <Link
          to="/projects"
          onClick={() => setActiveFilter('all')}
          className="block text-sm text-[var(--color-muted-foreground)] py-8 text-center rounded-[var(--radius-md)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          All caught up — browse projects
        </Link>
      )}
    </Card>
  )
}
