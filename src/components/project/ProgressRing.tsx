import { motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProgressRingProps {
  progress: number
  size?: number
  strokeWidth?: number
  className?: string
  showLabel?: boolean
  layoutId?: string
  /** Full green ring + check — project Launch path is complete */
  launched?: boolean
}

export function ProgressRing({
  progress,
  size = 64,
  strokeWidth = 4,
  className,
  showLabel = true,
  layoutId,
  launched = false,
}: ProgressRingProps) {
  const shouldReduceMotion = useReducedMotion()
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const displayProgress = launched ? 100 : progress
  const offset = circumference - (displayProgress / 100) * circumference
  const stroke = launched ? 'var(--color-success)' : 'var(--color-accent)'
  const checkSize = Math.max(12, Math.round(size * 0.34))

  const Wrapper = layoutId ? motion.div : 'div'
  const wrapperProps = layoutId
    ? { layoutId, transition: { type: 'spring' as const, bounce: 0, duration: 0.35 } }
    : {}

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
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          // Don't replay empty→full on every mount (causes flicker with shared layout)
          initial={false}
          animate={{ strokeDashoffset: offset }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.25, ease: [0.23, 1, 0.32, 1] }
          }
        />
      </svg>
      {showLabel &&
        (launched ? (
          <Check
            className="absolute text-[var(--color-success)]"
            style={{ width: checkSize, height: checkSize }}
            strokeWidth={2.75}
            aria-label="Launched"
          />
        ) : (
          <span className="absolute text-xs font-semibold tabular-nums tracking-tight">
            {Math.round(progress)}%
          </span>
        ))}
    </Wrapper>
  )
}
