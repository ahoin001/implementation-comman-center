import { Link, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Archive, ArchiveRestore, Search } from 'lucide-react'
import { useState } from 'react'
import { useArchivedProjects, searchProjects } from '@/hooks/useProjects'
import { ProgressRing } from '@/components/project/ProgressRing'
import { calculateProgress, isLaunchFullyWrapped } from '@/lib/progress'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EmptyState, LoadingState } from '@/components/ui/EmptyState'
import { staggerDelay, useEntrance } from '@/components/ui/Reveal'
import { Panel } from '@/components/ui/Panel'
import { useStore } from '@/store/useStore'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { cn } from '@/lib/utils'

export function ArchivePage() {
  const archived = useArchivedProjects()
  const hydrated = useStore((s) => s.hydrated)
  const enter = useEntrance(hydrated)
  const unarchiveProject = useStore((s) => s.unarchiveProject)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const projects = query ? searchProjects(archived, query) : archived

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="mb-1 text-2xl font-semibold tracking-tight">Archive</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Completed implementations — open to view or restore
          </p>
        </div>
        <GlobalSearch className="max-w-xs" />
      </div>

      <div className="mb-6 max-w-md">
        <Input
          placeholder="Search archived projects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!hydrated ? (
        <LoadingState label="Loading archive" />
      ) : projects.length === 0 ? (
        <EmptyState
          title={query ? 'Nothing matches' : 'Nothing archived'}
          icon={query ? <Search className="h-5 w-5" /> : <Archive className="h-5 w-5" />}
        >
          <p>
            {query
              ? 'Try another name, or clear the search.'
              : 'Finished implementations land here when you archive them.'}
          </p>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {projects.map((project, index) => (
            <Panel
              key={project.id}
              className={cn('flex items-center gap-4 p-4', enter && 'rise-in')}
              style={enter ? { animationDelay: `${staggerDelay(index)}ms` } : undefined}
            >
              <Link
                to={`/projects/${project.id}`}
                className="flex flex-1 min-w-0 items-center gap-4 transition-[transform,opacity] duration-150 hover:opacity-90 active:scale-[0.99]"
              >
                <ProgressRing
                  progress={calculateProgress(project)}
                  size={48}
                  strokeWidth={3}
                  launched={isLaunchFullyWrapped(project)}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{project.name}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Archived{' '}
                    {project.archivedAt
                      ? format(parseISO(project.archivedAt), 'MMM d, yyyy')
                      : '—'}
                  </p>
                </div>
                <span className="text-xs text-[var(--color-muted-foreground)] shrink-0">
                  View →
                </span>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  unarchiveProject(project.id)
                  navigate(`/projects/${project.id}`)
                }}
              >
                <ArchiveRestore className="h-4 w-4" />
                Unarchive
              </Button>
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}
