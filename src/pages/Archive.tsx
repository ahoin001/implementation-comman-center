import { Link, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ArchiveRestore } from 'lucide-react'
import { useState } from 'react'
import { useArchivedProjects, searchProjects } from '@/hooks/useProjects'
import { ProgressRing } from '@/components/project/ProgressRing'
import { calculateProgress, isLaunchFullyWrapped } from '@/lib/progress'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'

export function ArchivePage() {
  const archived = useArchivedProjects()
  const unarchiveProject = useStore((s) => s.unarchiveProject)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const projects = query ? searchProjects(archived, query) : archived

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Archive</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Completed implementations — open to view or restore
        </p>
      </div>

      <div className="mb-6 max-w-md">
        <Input
          placeholder="Search archived projects…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {projects.length === 0 ? (
        <div className="glass rounded-[var(--radius-lg)] p-12 text-center">
          <p className="text-[var(--color-muted-foreground)]">No archived projects yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="glass flex items-center gap-4 rounded-[var(--radius-lg)] p-4"
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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
