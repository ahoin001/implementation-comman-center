import { GraduationCap } from 'lucide-react'
import type { Project } from '@/types'
import { getOpenFlexibleBadgeLabels, getOpenFlexibleTasks } from '@/lib/progress'
import { cn } from '@/lib/utils'

interface FlexibleFollowUpBadgesProps {
  project: Project
  className?: string
  /** Prefer compact single-chip when space is tight */
  compact?: boolean
}

/**
 * At-a-glance badges for necessary client work that can run anytime
 * (e.g. SmartWay Training) — still shown after Launch.
 */
export function FlexibleFollowUpBadges({
  project,
  className,
  compact = false,
}: FlexibleFollowUpBadgesProps) {
  if (project.archived) return null

  const open = getOpenFlexibleTasks(project)
  if (open.length === 0) return null

  const labels = getOpenFlexibleBadgeLabels(project)
  const hasBlocked = open.some((t) => t.status === 'blocked')

  if (compact) {
    const label = labels[0] ?? 'Follow-up open'
    return (
      <span
        title={open.map((t) => t.label).join(' · ')}
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
          hasBlocked
            ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
            : 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
          className
        )}
      >
        <GraduationCap className="h-3 w-3 shrink-0" />
        {label}
      </span>
    )
  }

  return (
    <>
      {labels.map((label, i) => {
        const task = open[i]
        const blocked = task?.status === 'blocked'
        return (
          <span
            key={task?.key ?? label}
            title={
              blocked && task?.blockedReason
                ? task.blockedReason
                : 'Required client work — can complete before or after launch'
            }
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
              blocked
                ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
                : 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
              className
            )}
          >
            <GraduationCap className="h-3 w-3 shrink-0" />
            {label}
          </span>
        )
      })}
    </>
  )
}

/** Soft chip for task rows in Anytime sections */
export function AnytimeTaskBadge({
  status,
  className,
}: {
  status: 'open' | 'blocked' | 'done'
  className?: string
}) {
  if (status === 'done') {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
          'bg-[var(--color-success)]/10 text-[var(--color-success)]',
          className
        )}
      >
        Done · Anytime
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        status === 'blocked'
          ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
          : 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
        className
      )}
    >
      {status === 'blocked' ? 'Required · Blocked' : 'Required · Anytime'}
    </span>
  )
}
