import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type StatusTone = 'neutral' | 'progress' | 'complete' | 'muted' | 'warning' | 'success' | 'danger'

const tones: Record<StatusTone, string> = {
  neutral: '',
  progress: 'safe',
  complete: 'safe',
  muted: 'low',
  warning: 'review',
  success: 'safe',
  danger: 'keep',
}

export function StatusPill({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: StatusTone
  icon?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <span className={cn('tag', tones[tone], className)}>
      {icon}
      {children}
    </span>
  )
}
