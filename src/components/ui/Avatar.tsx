import { cn } from '@/lib/utils'

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

export function Avatar({
  name,
  size = 'sm',
  className,
}: {
  name: string
  size?: 'xs' | 'sm' | 'md'
  className?: string
}) {
  return (
    <span className={cn('avatar', size, className)} aria-hidden>
      {initials(name)}
    </span>
  )
}
