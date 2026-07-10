import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
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
  abbreviation?: string
  onAbbreviationChange?: (value: string) => void
  subtitle?: string
  layoutId?: string
  size?: 'sm' | 'lg'
}

export function ProjectTitle({
  name,
  abbreviation,
  onAbbreviationChange,
  subtitle,
  layoutId,
  size = 'sm',
}: ProjectTitleProps) {
  const Component = layoutId ? motion.div : 'div'
  const props = layoutId ? { layoutId } : {}
  const editable = Boolean(onAbbreviationChange)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(abbreviation ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) setDraft(abbreviation ?? '')
  }, [abbreviation, editing])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const commit = () => {
    const next = draft.trim().toUpperCase()
    onAbbreviationChange?.(next)
    setEditing(false)
  }

  const cancel = () => {
    setDraft(abbreviation ?? '')
    setEditing(false)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      cancel()
    }
  }

  const abbrDisplay = abbreviation?.trim() || (editable ? 'ADD' : '')
  const titleClass = cn(
    'font-semibold tracking-tight text-[var(--color-foreground)] truncate',
    size === 'lg' ? 'text-2xl' : 'text-base group-hover:text-[var(--color-accent)] transition-colors duration-150'
  )

  const titleNode = layoutId ? (
    <motion.h1
      layoutId={`${layoutId}-text`}
      transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
      className={titleClass}
    >
      {name}
    </motion.h1>
  ) : (
    <h1 className={titleClass}>{name}</h1>
  )

  return (
    <Component
      {...props}
      {...(layoutId ? { transition: { type: 'spring' as const, bounce: 0, duration: 0.35 } } : {})}
      className="min-w-0"
    >
      <div className={cn('flex items-baseline gap-2 min-w-0', size === 'lg' ? 'mb-2' : '')}>
        {(abbrDisplay || editing) &&
          (editing ? (
            <span className="inline-flex items-baseline shrink-0 text-[var(--color-muted-foreground)]">
              <span className={size === 'lg' ? 'text-2xl font-semibold' : 'text-base font-semibold'}>(</span>
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value.toUpperCase())}
                onBlur={commit}
                onKeyDown={onKeyDown}
                maxLength={12}
                aria-label="Edit abbreviation"
                className={cn(
                  'bg-transparent border-b border-[var(--color-accent)] outline-none uppercase tracking-wide font-semibold text-[var(--color-accent)] tabular-nums',
                  size === 'lg' ? 'text-2xl w-[4.5ch]' : 'text-base w-[4ch]'
                )}
              />
              <span className={size === 'lg' ? 'text-2xl font-semibold' : 'text-base font-semibold'}>)</span>
            </span>
          ) : editable ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              title="Edit abbreviation"
              className={cn(
                'shrink-0 font-semibold tracking-wide uppercase text-[var(--color-muted-foreground)]',
                'rounded-sm hover:text-[var(--color-accent)] transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
                !abbreviation?.trim() && 'text-[var(--color-muted)] italic normal-case tracking-normal',
                size === 'lg' ? 'text-2xl' : 'text-base'
              )}
            >
              ({abbrDisplay})
            </button>
          ) : (
            <span
              className={cn(
                'shrink-0 font-semibold tracking-wide uppercase text-[var(--color-muted-foreground)]',
                size === 'lg' ? 'text-2xl' : 'text-base'
              )}
            >
              ({abbrDisplay})
            </span>
          ))}
        <div className="min-w-0 flex-1">{titleNode}</div>
      </div>
      {subtitle && (
        <p className={cn('text-[var(--color-muted-foreground)]', size === 'lg' ? 'text-sm' : 'text-xs')}>
          {subtitle}
        </p>
      )}
    </Component>
  )
}
