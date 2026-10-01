import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type StatusTone = 'neutral' | 'progress' | 'complete' | 'muted' | 'warning' | 'success' | 'danger'

const tones: Record<StatusTone, string> = {
  neutral: 'bg-[var(--color-field)] text-[var(--color-ink)]',
  progress: 'bg-[color-mix(in_srgb,var(--color-success)_18%,var(--color-panel))] text-[var(--color-success)]',
  complete: 'bg-[var(--color-wash)] text-[var(--color-wash-strong)]',
  muted: 'bg-[var(--color-field)] text-[var(--color-ink-soft)]',
  warning: 'bg-[color-mix(in_srgb,var(--color-warning)_18%,var(--color-panel))] text-[var(--color-warning)]',
  success: 'bg-[color-mix(in_srgb,var(--color-success)_18%,var(--color-panel))] text-[var(--color-success)]',
  danger: 'bg-[color-mix(in_srgb,var(--color-danger)_16%,var(--color-panel))] text-[var(--color-danger)]',
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
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
        tones[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}
