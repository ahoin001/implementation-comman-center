import { cn } from '@/lib/utils'
import type { ProjectHealth } from '@/types'
import { HEALTH_LABELS } from '@/types'

const healthStyles: Record<ProjectHealth, string> = {
  healthy: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  waiting_on_me: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
  waiting_on_client: 'bg-[var(--color-warning)]/10 text-[#c93400]',
  at_risk: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
  complete: 'bg-black/5 dark:bg-white/10 text-[var(--color-muted-foreground)]',
}

const healthDots: Record<ProjectHealth, string> = {
  healthy: '🟢',
  waiting_on_me: '🟡',
  waiting_on_client: '🟠',
  at_risk: '🔴',
  complete: '⚪',
}

interface HealthBadgeProps {
  health: ProjectHealth
  showLabel?: boolean
  className?: string
}

export function HealthBadge({ health, showLabel = true, className }: HealthBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        healthStyles[health],
        className
      )}
    >
      <span aria-hidden>{healthDots[health]}</span>
      {showLabel && HEALTH_LABELS[health]}
    </span>
  )
}
