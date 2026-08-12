import { useMemo, useState } from 'react'
import { CheckSquare, GraduationCap, ListPlus, Trash2, X } from 'lucide-react'
import type { Project, ProjectFilter } from '@/types'
import { FILTER_LABELS, STATUS_FILTERS, TASK_FILTERS } from '@/types'
import { ProjectCard } from '@/components/project/ProjectCard'
import { NewProjectButton } from '@/components/project/NewProjectButton'
import { BulkAddProjectsModal } from '@/components/project/BulkAddProjectsModal'
import { ProjectsStickyBoard } from '@/components/project/ProjectsStickyBoard'
import { AttentionStrip } from '@/components/project/AttentionStrip'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'
import { useActiveProjects, useFilteredProjects } from '@/hooks/useProjects'
import { isLaunchedWithoutTraining } from '@/lib/progress'
import { cn } from '@/lib/utils'

const GROUP_TRAINING_KEY = 'icc-projects-group-training'

function readGroupTrainingToggle(): boolean {
  try {
    return sessionStorage.getItem(GROUP_TRAINING_KEY) === '1'
  } catch {
    return false
  }
}

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

function ViewToggle({
  checked,
  onChange,
  label,
  activeTone = 'accent',
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  activeTone?: 'accent' | 'warning'
}) {
  const on =
    activeTone === 'warning'
      ? {
          border: 'border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
          track: 'bg-[var(--color-warning)]',
        }
      : {
          border: 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
          track: 'bg-[var(--color-accent)]',
        }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]',
        checked
          ? on.border
          : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
      )}
    >
      <span
        className={cn(
          'relative h-4 w-7 rounded-full transition-colors duration-150',
          checked ? on.track : 'bg-[var(--color-border)]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-150',
            checked ? 'translate-x-3.5' : 'translate-x-0.5'
          )}
        />
      </span>
      {label}
    </button>
  )
}

function ProjectGrid({
  projects,
  selectMode,
  selectedIds,
  onToggleSelect,
  emphasizeTrainingGap,
}: {
  projects: Project[]
  selectMode: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  emphasizeTrainingGap?: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {projects.map((project) => (
        <div
          key={project.id}
          className={cn(
            emphasizeTrainingGap &&
              'rounded-[calc(var(--radius-lg)+2px)] ring-1 ring-[var(--color-warning)]/40 ring-offset-2 ring-offset-[var(--color-background)]'
          )}
        >
          <ProjectCard
            project={project}
            selectable={selectMode}
            selected={selectedIds.has(project.id)}
            onToggleSelect={() => onToggleSelect(project.id)}
          />
        </div>
      ))}
    </div>
  )
}

export function ProjectsPage() {
  const activeFilter = useStore((s) => s.activeFilter)
  const setActiveFilter = useStore((s) => s.setActiveFilter)
  const deleteProjects = useStore((s) => s.deleteProjects)
  const addNote = useStore((s) => s.addNote)

  const [inProgressFirst, setInProgressFirst] = useState(true)
  const [groupTrainingGaps, setGroupTrainingGaps] = useState(readGroupTrainingToggle)
  const projects = useFilteredProjects({ inProgressFirst })
  const activeProjects = useActiveProjects()

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

  const { trainingGaps, otherProjects } = useMemo(() => {
    if (!groupTrainingGaps) {
      return { trainingGaps: [] as Project[], otherProjects: projects }
    }
    const gaps: Project[] = []
    const others: Project[] = []
    for (const p of projects) {
      if (isLaunchedWithoutTraining(p)) gaps.push(p)
      else others.push(p)
    }
    return { trainingGaps: gaps, otherProjects: others }
  }, [projects, groupTrainingGaps])

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

  const setGroupTraining = (on: boolean) => {
    setGroupTrainingGaps(on)
    try {
      sessionStorage.setItem(GROUP_TRAINING_KEY, on ? '1' : '0')
    } catch {
      /* ignore */
    }
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
            {groupTrainingGaps && trainingGaps.length > 0 && (
              <span className="text-[var(--color-warning)]">
                {' '}
                · {trainingGaps.length} need training
              </span>
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
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {STATUS_FILTERS.map((filter) => (
              <FilterChip
                key={filter}
                filter={filter}
                active={activeFilter === filter}
                onSelect={handleSelectFilter}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ViewToggle
              checked={inProgressFirst}
              onChange={setInProgressFirst}
              label="In Progress First"
            />
            <ViewToggle
              checked={groupTrainingGaps}
              onChange={setGroupTraining}
              label="Group training gaps"
              activeTone="warning"
            />
          </div>
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

      {!selectMode && (
        <>
          <AttentionStrip
            projects={activeProjects}
            activeFilter={activeFilter}
            onSelectFilter={handleSelectFilter}
          />
          <ProjectsStickyBoard
            projects={projects}
            onAddSticky={(projectId, content, severity) =>
              addNote(projectId, content, { pinned: true, severity })
            }
          />
        </>
      )}

      {projects.length > 0 ? (
        groupTrainingGaps && trainingGaps.length > 0 ? (
          <div className="space-y-8">
            <section className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-warning)]/15 px-2.5 py-1 text-xs font-medium text-[var(--color-warning)]">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Launched · Needs training
                </span>
                <span className="text-xs tabular-nums text-[var(--color-muted-foreground)]">
                  {trainingGaps.length}
                </span>
                <div className="h-px flex-1 min-w-[2rem] bg-[var(--color-warning)]/25" />
              </div>
              <p className="text-[11px] text-[var(--color-muted-foreground)] -mt-1">
                Site is live; SmartWay Training still open
              </p>
              <ProjectGrid
                projects={trainingGaps}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                emphasizeTrainingGap
              />
            </section>

            {otherProjects.length > 0 && (
              <section className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                    Other projects
                  </span>
                  <span className="text-xs tabular-nums text-[var(--color-muted-foreground)]">
                    {otherProjects.length}
                  </span>
                  <div className="h-px flex-1 min-w-[2rem] bg-[var(--color-border)]" />
                </div>
                <ProjectGrid
                  projects={otherProjects}
                  selectMode={selectMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                />
              </section>
            )}
          </div>
        ) : (
          <ProjectGrid
            projects={projects}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        )
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
