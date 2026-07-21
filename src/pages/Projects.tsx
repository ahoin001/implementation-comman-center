import { useMemo, useState } from 'react'
import { CheckSquare, ListPlus, Trash2, X } from 'lucide-react'
import type { ProjectFilter } from '@/types'
import { FILTER_LABELS, STATUS_FILTERS, TASK_FILTERS } from '@/types'
import { ProjectCard } from '@/components/project/ProjectCard'
import { NewProjectButton } from '@/components/project/NewProjectButton'
import { BulkAddProjectsModal } from '@/components/project/BulkAddProjectsModal'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'
import { useFilteredProjects } from '@/hooks/useProjects'
import { cn } from '@/lib/utils'

function FilterChip({
  filter,
  active,
  onSelect,
  size = 'md',
}: {
  filter: ProjectFilter
  active: boolean
  onSelect: (filter: ProjectFilter) => void
  size?: 'md' | 'sm'
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(filter)}
      className={cn(
        'shrink-0 font-medium transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.97]',
        size === 'md' && 'rounded-full px-4 py-1.5 text-sm',
        size === 'sm' && 'rounded-md px-2.5 py-1 text-xs',
        active
          ? 'bg-[var(--color-accent)] text-white'
          : size === 'md'
            ? 'glass text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            : 'border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:border-[var(--color-accent)]/30'
      )}
    >
      {FILTER_LABELS[filter]}
    </button>
  )
}

export function ProjectsPage() {
  const activeFilter = useStore((s) => s.activeFilter)
  const setActiveFilter = useStore((s) => s.setActiveFilter)
  const deleteProjects = useStore((s) => s.deleteProjects)

  const [inProgressFirst, setInProgressFirst] = useState(true)
  const projects = useFilteredProjects({ inProgressFirst })

  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkAddOpen, setBulkAddOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const allVisibleSelected = projects.length > 0 && projects.every((p) => selectedIds.has(p.id))
  const selectedCount = useMemo(
    () => projects.filter((p) => selectedIds.has(p.id)).length,
    [projects, selectedIds]
  )
  const taskFilterActive = TASK_FILTERS.includes(activeFilter)

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
    setConfirmDelete(false)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        projects.forEach((p) => next.delete(p.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        projects.forEach((p) => next.add(p.id))
        return next
      })
    }
  }

  const handleBulkDelete = () => {
    const ids = projects.filter((p) => selectedIds.has(p.id)).map((p) => p.id)
    deleteProjects(ids)
    exitSelectMode()
  }

  const handleSelectFilter = (filter: ProjectFilter) => {
    setActiveFilter(activeFilter === filter && filter !== 'all' ? 'all' : filter)
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Projects</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {projects.length} implementation{projects.length !== 1 ? 's' : ''}
            {activeFilter !== 'all' && (
              <span className="text-[var(--color-muted)]"> · {FILTER_LABELS[activeFilter]}</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!selectMode ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setSelectMode(true)}>
                <CheckSquare className="h-4 w-4" />
                Select
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setBulkAddOpen(true)}>
                <ListPlus className="h-4 w-4" />
                Bulk Add
              </Button>
              <NewProjectButton />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={exitSelectMode}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button variant="secondary" size="sm" onClick={toggleSelectAll}>
                {allVisibleSelected ? 'Deselect all' : 'Select all'}
              </Button>
              {!confirmDelete ? (
                <Button
                  variant="danger"
                  size="sm"
                  disabled={selectedCount === 0}
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete {selectedCount > 0 ? selectedCount : ''}
                </Button>
              ) : (
                <>
                  <span className="text-sm text-[var(--color-danger)]">
                    Delete {selectedCount}?
                  </span>
                  <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                    Confirm
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Keep
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {selectMode && (
        <div className="glass rounded-[var(--radius-md)] px-4 py-2.5 mb-4 text-sm text-[var(--color-muted-foreground)]">
          {selectedCount === 0
            ? 'Tap projects to select them for bulk delete.'
            : `${selectedCount} selected`}
        </div>
      )}

      <div className="mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none flex-1 min-w-0">
            {STATUS_FILTERS.map((filter) => (
              <FilterChip
                key={filter}
                filter={filter}
                active={activeFilter === filter}
                onSelect={handleSelectFilter}
              />
            ))}
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={inProgressFirst}
            onClick={() => setInProgressFirst((v) => !v)}
            className={cn(
              'shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]',
              inProgressFirst
                ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            )}
          >
            <span
              className={cn(
                'relative h-4 w-7 rounded-full transition-colors duration-150',
                inProgressFirst ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-150',
                  inProgressFirst ? 'translate-x-3.5' : 'translate-x-0.5'
                )}
              />
            </span>
            In Progress First
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            Launch path
          </span>
          <div className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TASK_FILTERS.map((filter) => (
            <FilterChip
              key={filter}
              filter={filter}
              active={activeFilter === filter}
              onSelect={handleSelectFilter}
              size="sm"
            />
          ))}
          {taskFilterActive && (
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className="shrink-0 rounded-md px-2 py-1 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                selectable={selectMode}
                selected={selectedIds.has(project.id)}
                onToggleSelect={() => toggleSelect(project.id)}
              />
            ))}
          </div>
        ) : (
          <div className="glass rounded-[var(--radius-lg)] p-12 text-center">
            <p className="text-[var(--color-muted-foreground)] mb-4">No projects match this filter.</p>
            <Button variant="secondary" onClick={() => setBulkAddOpen(true)}>
              <ListPlus className="h-4 w-4" />
              Bulk Add Projects
            </Button>
          </div>
        )}

      <BulkAddProjectsModal open={bulkAddOpen} onClose={() => setBulkAddOpen(false)} />
    </div>
  )
}
