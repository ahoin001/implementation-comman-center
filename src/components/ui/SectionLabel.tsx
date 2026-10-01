import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function SectionLabel({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-soft)]',
        className
      )}
      {...props}
    />
  )
}
