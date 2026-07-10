import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  showLabel?: boolean
  layoutId?: string
}

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 4,
  className,
  showLabel = true,
  layoutId,
}: ProgressRingProps) {
  const shouldReduceMotion = useReducedMotion()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  const Wrapper = layoutId ? motion.div : 'div'
  const wrapperProps = layoutId ? { layoutId } : {}

  return (
    <Wrapper
      {...wrapperProps}
      className={cn('relative inline-flex items-center justify-center shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-black/5 dark:text-white/10"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={shouldReduceMotion ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.8 }}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-semibold tabular-nums tracking-tight">
          {Math.round(progress)}%
        </span>
      )}
    </Wrapper>
  )
}
