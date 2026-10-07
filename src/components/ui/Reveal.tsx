import { useEffect, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/** True only for the first beat after `ready`, so later filter changes stay still. */
export function useEntrance(ready = true) {
  const [enter, setEnter] = useState(true)
  useEffect(() => {
    if (!ready) return
    const timer = window.setTimeout(() => setEnter(false), 560)
    return () => window.clearTimeout(timer)
  }, [ready])
  return ready && enter
}

/** One short entrance. Delay is only for the first few items in a list. */
export function Reveal({
  delay = 0,
  className,
  children,
}: {
  delay?: number
  className?: string
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <div
      className={cn(!reduce && 'rise-in', className)}
      style={!reduce && delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

export function staggerDelay(index: number) {
  return Math.min(index, 6) * 36
}
