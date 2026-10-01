import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const padding = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-5',
} as const

export function Panel({
  className,
  pad = 'none',
  ...props
}: HTMLAttributes<HTMLDivElement> & { pad?: keyof typeof padding }) {
  return <div className={cn('float-panel', padding[pad], className)} {...props} />
}
