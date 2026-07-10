import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProjectAvatarProps {
  name: string
  abbreviation?: string
  layoutId?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-10 w-10 text-sm rounded-[var(--radius-md)]',
  md: 'h-16 w-16 text-xl rounded-[var(--radius-lg)]',
  lg: 'h-20 w-20 text-3xl rounded-[var(--radius-xl)]',
}

export function ProjectAvatar({ name, abbreviation, layoutId, size = 'sm', className }: ProjectAvatarProps) {
  const Component = layoutId ? motion.div : 'div'
  const props = layoutId ? { layoutId } : {}
  const label = abbreviation?.trim() || name.charAt(0)

  return (
    <Component
      {...props}
      className={cn(
        'bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0',
        sizeClasses[size],
        className
      )}
    >
      <span className={cn('font-bold text-[var(--color-accent)]', abbreviation && 'tracking-wide uppercase text-xs sm:text-sm')}>
        {label}
      </span>
    </Component>
  )
}

interface ProjectTitleProps {
  name: string
  subtitle?: string
  layoutId?: string
  size?: 'sm' | 'lg'
}

export function ProjectTitle({ name, subtitle, layoutId, size = 'sm' }: ProjectTitleProps) {
  const Component = layoutId ? motion.div : 'div'
  const props = layoutId ? { layoutId } : {}

  return (
    <Component {...props} className="min-w-0">
      {layoutId ? (
        <motion.h1
          layoutId={`${layoutId}-text`}
          className={cn(
            'font-semibold tracking-tight text-[var(--color-foreground)] truncate',
            size === 'lg' ? 'text-2xl mb-2' : 'text-base group-hover:text-[var(--color-accent)] transition-colors duration-150'
          )}
        >
          {name}
        </motion.h1>
      ) : (
        <h1
          className={cn(
            'font-semibold tracking-tight text-[var(--color-foreground)] truncate',
            size === 'lg' ? 'text-2xl mb-2' : 'text-base'
          )}
        >
          {name}
        </h1>
      )}
      {subtitle && (
        <p className={cn('text-[var(--color-muted-foreground)]', size === 'lg' ? 'text-sm' : 'text-xs')}>
          {subtitle}
        </p>
      )}
    </Component>
  )
}
