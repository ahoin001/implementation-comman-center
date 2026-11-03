import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

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
    <div className={cn('empty card-w', className)}>
      {icon && (
        <span className="chip-ico" style={{ width: 52, height: 52, borderRadius: 18 }}>
          {icon}
        </span>
      )}
      {title && <h3>{title}</h3>}
      <div className={cn('text-sm leading-6', title && 'mt-0')}>{children}</div>
    </div>
  )
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="fx-wait card-w" role="status" aria-live="polite" aria-busy="true">
      <span className="orb" aria-hidden>
        <span className="spinner" />
      </span>
      <h3>{label}</h3>
    </div>
  )
}
