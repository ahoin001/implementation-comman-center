import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Workbench({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('icc-workbench card-w', className)} {...props} />
}
