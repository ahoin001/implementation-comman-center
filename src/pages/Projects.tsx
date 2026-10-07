import { useMemo, useState } from 'react'
import { CheckSquare, FolderOpen, GraduationCap, ListPlus, Search, Star, Trash2, X } from 'lucide-react'
import type { Project, ProjectFilter } from '@/types'
import { FILTER_LABELS, STATUS_FILTERS, TASK_FILTERS } from '@/types'
import { ProjectCard } from '@/components/project/ProjectCard'
import { NewProjectButton } from '@/components/project/NewProjectButton'
import { ImportChecklistButton } from '@/components/project/ImportChecklistModal'
import { BulkAddProjectsModal } from '@/components/project/BulkAddProjectsModal'
import { ProjectsStickyBoard } from '@/components/project/ProjectsStickyBoard'
import { AttentionStrip } from '@/components/project/AttentionStrip'
import { Button } from '@/components/ui/Button'
import { EmptyState, LoadingState } from '@/components/ui/EmptyState'
import { staggerDelay, useEntrance } from '@/components/ui/Reveal'
import { Panel } from '@/components/ui/Panel'
import { useStore } from '@/store/useStore'
import { useActiveProjects, useFilteredProjects } from '@/hooks/useProjects'
import { isLaunchedWithoutTraining } from '@/lib/progress'
import { cn } from '@/lib/utils'
import { GlobalSearch } from '@/components/search/GlobalSearch'

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
        'shrink-0 cursor-pointer rounded-full font-medium transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.97]',
        size === 'md' ? 'px-3.5 py-1.5 text-sm' : 'px-3 py-1 text-xs',
        active
          ? 'bg-[var(--color-wash-strong)] text-white'
          : 'bg-[var(--color-field)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
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
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex shrink-0 cursor-pointer items-center gap-2.5 rounded-full py-1 text-sm text-[var(--color-ink)]"
    >
      <span
        className={cn(
          'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ease-[var(--ease-out)]',
          checked
            ? activeTone === 'warning'
              ? 'bg-[var(--color-warning)]'
              : 'bg-[var(--color-wash-strong)]'
            : 'bg-[var(--color-field)] ring-1 ring-[color-mix(in_srgb,var(--color-ink)_14%,transparent)]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(29,36,51,0.28)] transition-transform duration-200 ease-[var(--ease-out)]',
            checked && 'translate-x-4'
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
  enter,
}: {
  projects: Project[]
  selectMode: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  emphasizeTrainingGap?: boolean
  enter?: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {projects.map((project, index) => (
        <div
          key={project.id}
          className={cn(
            enter && 'rise-in',
            emphasizeTrainingGap &&
              'rounded-[calc(var(--radius-lg)+2px)] ring-1 ring-[var(--color-warning)]/40 ring-offset-2 ring-offset-[var(--color-background)]'
          )}
          style={enter ? { animationDelay: `${staggerDelay(index)}ms` } : undefined}
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

export function ProjectsPage({ favoritesOnly = false }: { favoritesOnly?: boolean }) {
  const activeFilter = useStore((s) => s.activeFilter)
  const setActiveFilter = useStore((s) => s.setActiveFilter)
  const deleteProjects = useStore((s) => s.deleteProjects)
  const addNote = useStore((s) => s.addNote)
  const favoriteIds = useStore((s) => s.favoriteIds)
  const hydrated = useStore((s) => s.hydrated)
  const enter = useEntrance(hydrated)

  const [inProgressFirst, setInProgressFirst] = useState(true)
  const [groupTrainingGaps, setGroupTrainingGaps] = useState(readGroupTrainingToggle)
  const listed = useFilteredProjects({ inProgressFirst })
  const projects = useMemo(
    () => (favoritesOnly ? listed.filter((project) => favoriteIds.includes(project.id)) : listed),
    [listed, favoritesOnly, favoriteIds]
  )
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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="mb-1 text-2xl font-semibold tracking-tight">
            {favoritesOnly ? 'My Projects' : 'Projects'}
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {hydrated
              ? `${projects.length} implementation${projects.length !== 1 ? 's' : ''}`
              : 'Loading implementations'}
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
        <div className="flex flex-wrap items-center justify-end gap-2">
          <GlobalSearch className="max-w-xs" />
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
              {!favoritesOnly && <ImportChecklistButton />}
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
        <Panel className="mb-4 px-4 py-2.5 text-sm text-[var(--color-ink-soft)]">
          {selectedCount === 0
            ? 'Tap projects to select them for bulk delete.'
            : `${selectedCount} selected`}
        </Panel>
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

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <ViewToggle
              checked={inProgressFirst}
              onChange={setInProgressFirst}
              label="In progress first"
            />
            <ViewToggle
              checked={groupTrainingGaps}
              onChange={setGroupTraining}
              label="Group training gaps"
              activeTone="warning"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-[var(--color-ink-soft)]">Launch path</span>
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
              className="shrink-0 cursor-pointer rounded-full px-3 py-1 text-xs text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {hydrated && !selectMode && (
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

      {!hydrated ? (
        <LoadingState label="Loading projects" />
      ) : projects.length > 0 ? (
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
                enter={enter}
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
                  enter={enter}
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
            enter={enter}
          />
        )
      ) : (
        <EmptyState
          title={
            favoritesOnly
              ? 'No starred projects'
              : activeFilter === 'all'
                ? 'No projects yet'
                : 'Nothing matches'
          }
          icon={
            favoritesOnly ? (
              <Star className="h-5 w-5" />
            ) : activeFilter === 'all' ? (
              <FolderOpen className="h-5 w-5" />
            ) : (
              <Search className="h-5 w-5" />
            )
          }
        >
          <p>
            {favoritesOnly
              ? 'Star a project to keep it here.'
              : activeFilter === 'all'
                ? 'Add the implementations you are running.'
                : 'Try another filter, or clear this one to see the full list.'}
          </p>
          <div className="mt-5 flex justify-center">
            {!favoritesOnly && activeFilter === 'all' && (
              <Button variant="secondary" onClick={() => setBulkAddOpen(true)}>
                <ListPlus className="h-4 w-4" />
                Bulk Add Projects
              </Button>
            )}
            {activeFilter !== 'all' && (
              <Button variant="secondary" onClick={() => setActiveFilter('all')}>
                Clear filter
              </Button>
            )}
          </div>
        </EmptyState>
      )}

      <BulkAddProjectsModal open={bulkAddOpen} onClose={() => setBulkAddOpen(false)} />
    </div>
  )
}
