import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function FilterChip({
  pressed,
  count,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean; count?: number | string }) {
  return (
    <button type="button" aria-pressed={pressed} className={cn('fx-chip', className)} {...props}>
      {children}
      {count != null && <i>{count}</i>}
    </button>
  )
}
