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
import { FilterChip as Chip } from '@/components/ui/FilterChip'
import { ScreenHead } from '@/components/ui/ScreenHead'
import { Toggle } from '@/components/ui/Toggle'
import { Panel } from '@/components/ui/Panel'
import { Workbench } from '@/components/ui/Workbench'
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
}: {
  filter: ProjectFilter
  active: boolean
  onSelect: (filter: ProjectFilter) => void
}) {
  return (
    <Chip pressed={active} onClick={() => onSelect(filter)}>
      {FILTER_LABELS[filter]}
    </Chip>
  )
}

function ProjectGrid({
  projects,
  selectMode,
  selectedIds,
  onToggleSelect,
  emphasizeTrainingGap,
  listKey,
}: {
  projects: Project[]
  selectMode: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  emphasizeTrainingGap?: boolean
  listKey?: string
}) {
  return (
    <div key={listKey} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sy-stagger">
      {projects.map((project) => (
        <div
          key={project.id}
          className={cn(emphasizeTrainingGap && 'rounded-[28px] ring-1 ring-[var(--amber)]/40')}
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
  const listKey = `${favoritesOnly ? 'mine' : 'all'}:${activeFilter}`

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
    <div className="screen">
      <ScreenHead
        title={favoritesOnly ? 'My Projects' : 'Projects'}
        sub={
          hydrated
            ? `${projects.length} implementation${projects.length !== 1 ? 's' : ''}${
                activeFilter !== 'all' ? ` · ${FILTER_LABELS[activeFilter]}` : ''
              }${groupTrainingGaps && trainingGaps.length > 0 ? ` · ${trainingGaps.length} need training` : ''}`
            : 'Loading implementations'
        }
      >
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
      </ScreenHead>

      {selectMode && (
        <Panel className="mb-4 px-4 py-2.5 text-sm text-[var(--color-ink-soft)]">
          {selectedCount === 0
            ? 'Tap projects to select them for bulk delete.'
            : `${selectedCount} selected`}
        </Panel>
      )}

      <Workbench>
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
          <label className="inline-flex items-center gap-2.5 text-sm text-[var(--ink)]">
            <Toggle checked={inProgressFirst} onChange={setInProgressFirst} label="In progress first" />
            In progress first
          </label>
          <label className="inline-flex items-center gap-2.5 text-sm text-[var(--ink)]">
            <Toggle checked={groupTrainingGaps} onChange={setGroupTraining} label="Group training gaps" />
            Group training gaps
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-[var(--color-ink-soft)]">Launch path</span>
          {TASK_FILTERS.map((filter) => (
            <FilterChip
              key={filter}
              filter={filter}
              active={activeFilter === filter}
              onSelect={handleSelectFilter}
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
      </Workbench>

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

      <div className="icc-stage">
      {!hydrated ? (
        <LoadingState label="Loading projects" />
      ) : projects.length > 0 ? (
        groupTrainingGaps && trainingGaps.length > 0 ? (
          <div className="space-y-8">
            <section className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tag review">
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
                listKey={listKey}
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
                  listKey={listKey}
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
            listKey={listKey}
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
      </div>

      <BulkAddProjectsModal open={bulkAddOpen} onClose={() => setBulkAddOpen(false)} />
    </div>
  )
}
