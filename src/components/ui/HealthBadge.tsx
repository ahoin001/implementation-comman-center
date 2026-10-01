import { AlertTriangle, Check, Clock, UserRound } from 'lucide-react'
import type { ProjectHealth } from '@/types'
import { HEALTH_LABELS } from '@/types'
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill'

const healthTone: Record<ProjectHealth, StatusTone> = {
  healthy: 'success',
  waiting_on_me: 'warning',
  waiting_on_client: 'warning',
  at_risk: 'danger',
  complete: 'success',
}

const healthIcon: Record<ProjectHealth, typeof Check> = {
  healthy: Check,
  waiting_on_me: Clock,
  waiting_on_client: UserRound,
  at_risk: AlertTriangle,
  complete: Check,
}

interface HealthBadgeProps {
  health: ProjectHealth
  showLabel?: boolean
  className?: string
}

export function HealthBadge({ health, showLabel = true, className }: HealthBadgeProps) {
  const Icon = healthIcon[health]
  return (
    <StatusPill
      tone={healthTone[health]}
      className={className}
      icon={<Icon className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden />}
    >
      {showLabel ? HEALTH_LABELS[health] : null}
    </StatusPill>
  )
}
