import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { useArchivedProjects } from '@/hooks/useProjects'
import { ProgressRing } from '@/components/project/ProgressRing'
import { calculateProgress } from '@/lib/progress'
import { Input } from '@/components/ui/Input'
import { useState } from 'react'
import { searchProjects } from '@/hooks/useProjects'

export function ArchivePage() {
  const archived = useArchivedProjects()
  const [query, setQuery] = useState('')
  const projects = query ? searchProjects(archived, query) : archived

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">Archive</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Completed implementations — read only
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
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="glass flex items-center gap-4 rounded-[var(--radius-lg)] p-4 transition-[transform,box-shadow] duration-200 hover:shadow-md active:scale-[0.99]"
            >
              <ProgressRing progress={calculateProgress(project)} size={48} strokeWidth={3} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{project.name}</p>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Launched {project.archivedAt ? format(parseISO(project.archivedAt), 'MMM d, yyyy') : '—'}
                </p>
              </div>
              <span className="text-xs text-[var(--color-muted-foreground)]">View →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
