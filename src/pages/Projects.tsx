import { AnimatePresence } from 'framer-motion'
import type { ProjectFilter } from '@/types'
import { FILTER_LABELS } from '@/types'
import { ProjectCard } from '@/components/project/ProjectCard'
import { NewProjectButton } from '@/components/project/NewProjectButton'
import { useStore } from '@/store/useStore'
import { useFilteredProjects } from '@/hooks/useProjects'
import { cn } from '@/lib/utils'

export function ProjectsPage() {
  const activeFilter = useStore((s) => s.activeFilter)
  const setActiveFilter = useStore((s) => s.setActiveFilter)
  const projects = useFilteredProjects()

  const filters = Object.keys(FILTER_LABELS) as ProjectFilter[]

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Projects</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {projects.length} implementation{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <NewProjectButton />
      </div>

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
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-[var(--radius-lg)] p-12 text-center">
            <p className="text-[var(--color-muted-foreground)]">No projects match this filter.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
