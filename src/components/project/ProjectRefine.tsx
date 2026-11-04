import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import type { Project, ProjectFilter, ProjectLayout } from '@/types'
import { FILTER_LABELS, STATUS_FILTERS, TASK_FILTERS } from '@/types'
import { AttentionStrip } from '@/components/project/AttentionStrip'
import { ImportChecklistButton } from '@/components/project/ImportChecklistModal'
import { Button } from '@/components/ui/Button'
import { FilterChip } from '@/components/ui/FilterChip'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Toggle } from '@/components/ui/Toggle'

interface ProjectRefineProps {
  activeFilter: ProjectFilter
  onSelectFilter: (filter: ProjectFilter) => void
  layout: ProjectLayout
  onLayout: (layout: ProjectLayout) => void
  inProgressFirst: boolean
  onInProgressFirst: (on: boolean) => void
  attentionProjects: Project[]
  stickyCount: number
  stickiesOpen: boolean
  onToggleStickies: () => void
  onSelectMode: () => void
  onBulkAdd: () => void
  showImport: boolean
}

export function ProjectRefine({
  activeFilter,
  onSelectFilter,
  layout,
  onLayout,
  inProgressFirst,
  onInProgressFirst,
  attentionProjects,
  stickyCount,
  stickiesOpen,
  onToggleStickies,
  onSelectMode,
  onBulkAdd,
  showImport,
}: ProjectRefineProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const pop = popRef.current
    if (!open || !pop) return
    const place = () => {
      pop.dataset.side = 'end'
      if (pop.getBoundingClientRect().left < 12) pop.dataset.side = 'start'
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const chooseFilter = (filter: ProjectFilter) => {
    onSelectFilter(filter)
    setOpen(false)
  }

  return (
    <div className="project-refine" ref={rootRef}>
      <Button
        variant="secondary"
        size="sm"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <SlidersHorizontal className="h-4 w-4" />
        View
        {stickyCount > 0 && !stickiesOpen && (
          <i className="project-refine-count">{stickyCount}</i>
        )}
      </Button>
      {open && (
        <div ref={popRef} className="project-refine-pop" role="dialog" aria-label="Project view">
          <p className="nav-label">Layout</p>
          <div className="project-refine-row">
            <SegmentedControl
              label="Project layout"
              value={layout}
              onChange={onLayout}
              options={[
                { id: 'grid', label: 'Grid' },
                { id: 'list', label: 'List' },
              ]}
            />
            <label className="project-refine-toggle">
              <Toggle checked={inProgressFirst} onChange={onInProgressFirst} label="In progress first" />
              In progress first
            </label>
          </div>

          <p className="nav-label">Status</p>
          <div className="project-refine-chips">
            {STATUS_FILTERS.map((filter) => (
              <FilterChip
                key={filter}
                pressed={activeFilter === filter}
                onClick={() => chooseFilter(activeFilter === filter && filter !== 'all' ? 'all' : filter)}
              >
                {FILTER_LABELS[filter]}
              </FilterChip>
            ))}
          </div>

          <p className="nav-label">Launch path</p>
          <div className="project-refine-chips">
            {TASK_FILTERS.map((filter) => (
              <FilterChip
                key={filter}
                pressed={activeFilter === filter}
                onClick={() => chooseFilter(activeFilter === filter ? 'all' : filter)}
              >
                {FILTER_LABELS[filter]}
              </FilterChip>
            ))}
          </div>

          <AttentionStrip
            bare
            projects={attentionProjects}
            activeFilter={activeFilter}
            onSelectFilter={chooseFilter}
          />

          <p className="nav-label">Tools</p>
          <div className="project-refine-tools">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onSelectMode()
                setOpen(false)
              }}
            >
              Select
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onBulkAdd()
                setOpen(false)
              }}
            >
              Bulk add
            </Button>
            {showImport && <ImportChecklistButton />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onToggleStickies()
                setOpen(false)
              }}
            >
              {stickiesOpen ? 'Hide stickies' : 'Stickies'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
