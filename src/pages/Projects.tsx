import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { CheckSquare, ListPlus, Trash2, X } from 'lucide-react'
import type { ProjectFilter } from '@/types'
import { FILTER_LABELS } from '@/types'
import { ProjectCard } from '@/components/project/ProjectCard'
import { NewProjectButton } from '@/components/project/NewProjectButton'
import { BulkAddProjectsModal } from '@/components/project/BulkAddProjectsModal'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'
import { useFilteredProjects } from '@/hooks/useProjects'
import { cn } from '@/lib/utils'

export function ProjectsPage() {
  const activeFilter = useStore((s) => s.activeFilter)
  const setActiveFilter = useStore((s) => s.setActiveFilter)
  const deleteProjects = useStore((s) => s.deleteProjects)
  const projects = useFilteredProjects()

  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkAddOpen, setBulkAddOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const filters = Object.keys(FILTER_LABELS) as ProjectFilter[]
  const allVisibleSelected = projects.length > 0 && projects.every((p) => selectedIds.has(p.id))
  const selectedCount = useMemo(
    () => projects.filter((p) => selectedIds.has(p.id)).length,
    [projects, selectedIds]
  )

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

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Projects</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {projects.length} implementation{projects.length !== 1 ? 's' : ''}
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

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-[background-color,color,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.97]',
              activeFilter === filter
                ? 'bg-[var(--color-accent)] text-white'
                : 'glass text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            )}
          >
            {FILTER_LABELS[filter]}
          </button>
        ))}
      </div>

      <AnimatePresence mode="popLayout">
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={i}
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
      </AnimatePresence>

      <BulkAddProjectsModal open={bulkAddOpen} onClose={() => setBulkAddOpen(false)} />
    </div>
  )
}
