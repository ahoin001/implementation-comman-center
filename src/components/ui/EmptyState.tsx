import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Panel } from '@/components/ui/Panel'

export function EmptyState({
  title,
  icon,
  children,
  className,
}: {
  title?: string
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Panel className={cn('rise-in px-6 py-14 text-center', className)}>
      {icon && (
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-field)] text-[var(--color-ink-soft)]">
          {icon}
        </div>
      )}
      {title && <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>}
      <div className={cn('text-sm leading-6 text-[var(--color-ink-soft)]', title && 'mt-1')}>{children}</div>
    </Panel>
  )
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <Panel className="rise-in px-5 py-6" role="status" aria-live="polite" aria-busy="true">
      <p className="text-sm font-medium text-[var(--color-ink)]">{label}</p>
      <div className="mt-4 space-y-3">
        <div className="skeleton-pulse h-3 w-2/5 rounded-full bg-[var(--color-field)]" />
        <div className="skeleton-pulse h-16 rounded-2xl bg-[var(--color-field)]" />
        <div className="skeleton-pulse h-16 rounded-2xl bg-[var(--color-field)]" />
        <div className="skeleton-pulse h-16 w-4/5 rounded-2xl bg-[var(--color-field)]" />
      </div>
    </Panel>
  )
}
