import { KeyRound } from 'lucide-react'
import type { Project } from '@/types'
import { needsSsoCredentials } from '@/lib/pathConfig'
import { calculateHealth } from '@/lib/health'
import { cn } from '@/lib/utils'

interface MissingCredentialsBadgeProps {
  project: Project
  className?: string
}

/** Shows when SSO is enabled but test credentials are not yet received */
export function MissingCredentialsBadge({ project, className }: MissingCredentialsBadgeProps) {
  if (project.archived || calculateHealth(project) === 'complete') return null
  if (!needsSsoCredentials(project)) return null

  return (
    <span
      title="SSO test credentials not yet received"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
        className
      )}
    >
      <KeyRound className="h-3 w-3" />
      Missing credentials
    </span>
  )
}
