import { useMemo, useState } from 'react'
import { CheckSquare, FolderOpen, ListPlus, Search, Star, Trash2, X } from 'lucide-react'
import type { Project, ProjectFilter, ProjectLayout } from '@/types'
import { FILTER_LABELS } from '@/types'
import { ProjectCard } from '@/components/project/ProjectCard'
import { NewProjectButton } from '@/components/project/NewProjectButton'
import { ProjectRefine } from '@/components/project/ProjectRefine'
import { BulkAddProjectsModal } from '@/components/project/BulkAddProjectsModal'
import { ProjectsStickyBoard } from '@/components/project/ProjectsStickyBoard'
import { Button } from '@/components/ui/Button'
import { EmptyState, LoadingState } from '@/components/ui/EmptyState'
import { useStore } from '@/store/useStore'
import { useActiveProjects, useFilteredProjects } from '@/hooks/useProjects'
import { useProjectListScroll } from '@/hooks/useProjectListScroll'
import { groupProjects } from '@/lib/projectGlance'
import { collectStickyNotes } from '@/lib/projectNotes'
import { GlobalSearch } from '@/components/search/GlobalSearch'

function ProjectGrid({
  projects,
  layout,
  selectMode,
  selectedIds,
  onToggleSelect,
}: {
  projects: Project[]
  layout: ProjectLayout
  selectMode: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
}) {
  return (
    <div className={layout === 'list' ? 'project-list' : 'project-board'}>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          selectable={selectMode}
          selected={selectedIds.has(project.id)}
          onToggleSelect={() => onToggleSelect(project.id)}
        />
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
  const projectLayout = useStore((s) => s.projectLayout)
  const setProjectLayout = useStore((s) => s.setProjectLayout)
  const listKey = `${favoritesOnly ? 'mine' : 'all'}:${activeFilter}`
  useProjectListScroll(listKey)

  const [inProgressFirst, setInProgressFirst] = useState(true)
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
  const [stickiesOpen, setStickiesOpen] = useState(false)

  const allVisibleSelected = projects.length > 0 && projects.every((p) => selectedIds.has(p.id))
  const selectedCount = useMemo(
    () => projects.filter((p) => selectedIds.has(p.id)).length,
    [projects, selectedIds]
  )
  const stickyCount = useMemo(() => collectStickyNotes(projects).length, [projects])
  const bands = useMemo(() => groupProjects(projects), [projects])

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
    <div className="screen">
      <header className="project-toolbar icc-chrome card-w">
        <div className="project-toolbar-title">
          <h1>{favoritesOnly ? 'My Projects' : 'Projects'}</h1>
          <span className="project-toolbar-count">{hydrated ? projects.length : '—'}</span>
        </div>
        <GlobalSearch className="project-toolbar-search" />
        <div className="project-toolbar-actions">
          {!selectMode ? (
            <>
              <ProjectRefine
                activeFilter={activeFilter}
                onSelectFilter={handleSelectFilter}
                layout={projectLayout}
                onLayout={setProjectLayout}
                inProgressFirst={inProgressFirst}
                onInProgressFirst={setInProgressFirst}
                attentionProjects={activeProjects}
                stickyCount={stickyCount}
                stickiesOpen={stickiesOpen}
                onToggleStickies={() => setStickiesOpen((open) => !open)}
                onSelectMode={() => setSelectMode(true)}
                onBulkAdd={() => setBulkAddOpen(true)}
                showImport={!favoritesOnly}
              />
              <NewProjectButton />
            </>
          ) : (
            <>
              <span className="project-toolbar-count">
                {selectedCount === 0 ? 'Select projects' : `${selectedCount} selected`}
              </span>
              <Button variant="ghost" size="sm" onClick={exitSelectMode}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button variant="secondary" size="sm" onClick={toggleSelectAll}>
                <CheckSquare className="h-4 w-4" />
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
                  Delete
                </Button>
              ) : (
                <>
                  <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                    Delete {selectedCount}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Keep
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </header>

      {activeFilter !== 'all' && (
        <button type="button" className="fx-chip project-live-filter" onClick={() => setActiveFilter('all')}>
          {FILTER_LABELS[activeFilter]}
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {hydrated && stickiesOpen && !selectMode && (
        <ProjectsStickyBoard
          projects={projects}
          onAddSticky={(projectId, content, severity) =>
            addNote(projectId, content, { pinned: true, severity })
          }
        />
      )}

      <div className="icc-stage">
      {!hydrated ? (
        <LoadingState label="Loading projects" />
      ) : projects.length > 0 ? (
        <div className="project-stages">
          {bands.map((band) => (
            <section key={band.id} className="project-band" aria-labelledby={`band-${listKey}-${band.id}`}>
              <header className="project-band-head">
                <h2 id={`band-${listKey}-${band.id}`} className="project-band-label">
                  {band.label}
                </h2>
                <span className="project-band-count">{band.projects.length}</span>
                <span className="project-band-rule" />
              </header>
              <ProjectGrid
                projects={band.projects}
                layout={projectLayout}
                selectMode={selectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            </section>
          ))}
        </div>
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
