import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const padding = {
  none: '',
  sm: 'p-3',
  md: 'panel',
} as const

export function Panel({
  className,
  pad = 'none',
  ...props
}: HTMLAttributes<HTMLDivElement> & { pad?: keyof typeof padding }) {
  return <div className={cn('card-w', padding[pad], className)} {...props} />
}
