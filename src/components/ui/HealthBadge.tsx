import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProjectHealth } from '@/types'
import { HEALTH_LABELS } from '@/types'

const healthStyles: Record<ProjectHealth, string> = {
  healthy: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  waiting_on_me: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
  waiting_on_client: 'bg-[var(--color-warning)]/10 text-[#c93400]',
  at_risk: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
  complete: 'bg-[var(--color-success)]/12 text-[var(--color-success)]',
}

const healthDots: Record<Exclude<ProjectHealth, 'complete'>, string> = {
  healthy: '🟢',
  waiting_on_me: '🟡',
  waiting_on_client: '🟠',
  at_risk: '🔴',
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
      {health === 'complete' ? (
        <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />
      ) : (
        <span aria-hidden>{healthDots[health]}</span>
      )}
      {showLabel && HEALTH_LABELS[health]}
    </span>
  )
}
