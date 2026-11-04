import { useMemo } from 'react'
import type { Project, ProjectFilter } from '@/types'
import { FILTER_LABELS } from '@/types'
import { calculateHealth } from '@/lib/health'
import { isRequiredDocsComplete } from '@/lib/deliverables'
import { needsSsoCredentials } from '@/lib/pathConfig'
import { hasOpenFlexibleTasks } from '@/lib/progress'
import { hasTaskNotes } from '@/hooks/useProjects'
import { cn } from '@/lib/utils'

interface AttentionStripProps {
  /** Active (non-archived) projects — counts are portfolio-wide */
  projects: Project[]
  activeFilter: ProjectFilter
  onSelectFilter: (filter: ProjectFilter) => void
  /** Inside the view menu: no section label, no outer margin. */
  bare?: boolean
}

interface AttentionItem {
  filter: ProjectFilter
  label: string
  count: number
  tone: 'danger' | 'warning'
}

export function AttentionStrip({ projects, activeFilter, onSelectFilter, bare = false }: AttentionStripProps) {
  const items = useMemo((): AttentionItem[] => {
    const incomplete = projects.filter((p) => calculateHealth(p) !== 'complete')
    return [
      {
        filter: 'needs_smartway_training' as const,
        label: FILTER_LABELS.needs_smartway_training,
        count: projects.filter(hasOpenFlexibleTasks).length,
        tone: 'warning' as const,
      },
      {
        filter: 'missing_required_docs' as const,
        label: FILTER_LABELS.missing_required_docs,
        count: incomplete.filter((p) => !isRequiredDocsComplete(p)).length,
        tone: 'danger' as const,
      },
      {
        filter: 'missing_sso_credentials' as const,
        label: FILTER_LABELS.missing_sso_credentials,
        count: incomplete.filter((p) => needsSsoCredentials(p)).length,
        tone: 'warning' as const,
      },
      {
        filter: 'waiting_on_client' as const,
        label: FILTER_LABELS.waiting_on_client,
        count: projects.filter((p) => calculateHealth(p) === 'waiting_on_client').length,
        tone: 'warning' as const,
      },
      {
        filter: 'needs_attention' as const,
        label: FILTER_LABELS.needs_attention,
        count: projects.filter(hasTaskNotes).length,
        tone: 'danger' as const,
      },
    ].filter((item) => item.count > 0)
  }, [projects])

  if (items.length === 0) return null

  return (
    <div className={bare ? 'project-refine-chips' : 'mb-6 flex flex-wrap items-center gap-2'}>
      <span className="nav-label !p-0 mr-1">Attention</span>
      {items.map((item) => {
        const active = activeFilter === item.filter
        return (
          <button
            key={item.filter}
            type="button"
            aria-pressed={active}
            onClick={() => onSelectFilter(item.filter)}
            className={cn('fx-chip', item.tone === 'danger' && !active && 'text-[var(--danger)]')}
          >
            {item.label}
            <i>{item.count}</i>
          </button>
        )
      })}
    </div>
  )
}
