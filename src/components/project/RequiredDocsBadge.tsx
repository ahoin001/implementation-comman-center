import { FileWarning } from 'lucide-react'
import type { Project } from '@/types'
import { getMissingRequiredDocs, isRequiredDocsComplete } from '@/lib/deliverables'
import { calculateHealth } from '@/lib/health'
import { cn } from '@/lib/utils'

interface RequiredDocsBadgeProps {
  project: Project
  className?: string
}

/** Shows when ACH or W-9 still missing (hidden for complete / archived) */
export function RequiredDocsBadge({ project, className }: RequiredDocsBadgeProps) {
  if (project.archived || calculateHealth(project) === 'complete') return null
  if (isRequiredDocsComplete(project)) return null

  const missing = getMissingRequiredDocs(project)
  const title = `Missing: ${missing.join(', ')}`

  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
        className
      )}
    >
      <FileWarning className="h-3 w-3" />
      Missing docs
    </span>
  )
}
