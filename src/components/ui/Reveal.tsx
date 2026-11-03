import { useEffect, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/** Plays a rise/stagger beat after `ready`, and again whenever `resetKey` changes. */
export function useEntrance(ready = true, resetKey?: string | number) {
  const [enter, setEnter] = useState(true)
  useEffect(() => {
    if (!ready) return
    setEnter(true)
    const timer = window.setTimeout(() => setEnter(false), 700)
    return () => window.clearTimeout(timer)
  }, [ready, resetKey])
  return ready && enter
}

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
      className={cn(!reduce && 'rise', className)}
      style={!reduce && delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

export function staggerDelay(index: number) {
  return Math.min(index, 4) * 60
}
