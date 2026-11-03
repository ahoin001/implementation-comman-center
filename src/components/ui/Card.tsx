import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'
import { Panel } from '@/components/ui/Panel'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <Panel pad="md" className={cn(className)} {...props} />
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props} />
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('m-0 text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink)]', className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('mt-1 text-sm leading-normal text-[var(--ink-3)]', className)} {...props} />
  )
}
