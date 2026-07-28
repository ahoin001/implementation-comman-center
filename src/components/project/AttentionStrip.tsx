import { useMemo } from 'react'
import type { Project, ProjectFilter } from '@/types'
import { FILTER_LABELS } from '@/types'
import { calculateHealth } from '@/lib/health'
import { isRequiredDocsComplete } from '@/lib/deliverables'
import { needsSsoCredentials } from '@/lib/pathConfig'
import { hasTaskNotes } from '@/hooks/useProjects'
import { cn } from '@/lib/utils'

interface AttentionStripProps {
  /** Active (non-archived) projects — counts are portfolio-wide */
  projects: Project[]
  activeFilter: ProjectFilter
  onSelectFilter: (filter: ProjectFilter) => void
}

interface AttentionItem {
  filter: ProjectFilter
  label: string
  count: number
  tone: 'danger' | 'warning'
}

export function AttentionStrip({ projects, activeFilter, onSelectFilter }: AttentionStripProps) {
  const items = useMemo((): AttentionItem[] => {
    const incomplete = projects.filter((p) => calculateHealth(p) !== 'complete')
    return [
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
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mr-1">
        Attention
      </span>
      {items.map((item) => {
        const active = activeFilter === item.filter
        return (
          <button
            key={item.filter}
            type="button"
            onClick={() => onSelectFilter(item.filter)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.97]',
              active
                ? 'bg-[var(--color-accent)] text-white'
                : item.tone === 'danger'
                  ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/15'
                  : 'bg-[var(--color-warning)]/15 text-[var(--color-warning)] hover:bg-[var(--color-warning)]/20'
            )}
          >
            {item.label}
            <span
              className={cn(
                'tabular-nums rounded-full px-1.5 py-0.5 text-[10px]',
                active ? 'bg-white/20' : 'bg-black/5 dark:bg-white/10'
              )}
            >
              {item.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
