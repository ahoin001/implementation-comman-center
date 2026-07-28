import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pin, Plus, X } from 'lucide-react'
import type { NoteSeverity, Project } from '@/types'
import { NOTE_SEVERITIES, NOTE_SEVERITY_LABELS } from '@/types'
import { collectStickyNotes, noteSeverity } from '@/lib/projectNotes'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface ProjectsStickyBoardProps {
  projects: Project[]
  onAddSticky: (projectId: string, content: string, severity: NoteSeverity) => void
}

const stickySurface: Record<NoteSeverity, string> = {
  info: 'bg-[var(--color-accent)]/[0.07] border-[var(--color-accent)]/25',
  warning: 'bg-[var(--color-warning)]/[0.1] border-[var(--color-warning)]/30',
  urgent: 'bg-[var(--color-danger)]/[0.08] border-[var(--color-danger)]/30',
}

const stickyLabel: Record<NoteSeverity, string> = {
  info: 'text-[var(--color-accent)]',
  warning: 'text-[var(--color-warning)]',
  urgent: 'text-[var(--color-danger)]',
}

const chipActive: Record<NoteSeverity, string> = {
  info: 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]',
  warning: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
  urgent: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
}

export function ProjectsStickyBoard({ projects, onAddSticky }: ProjectsStickyBoardProps) {
  const stickies = useMemo(() => collectStickyNotes(projects), [projects])
  const [composerOpen, setComposerOpen] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [content, setContent] = useState('')
  const [severity, setSeverity] = useState<NoteSeverity>('warning')

  const sortedProjects = useMemo(
    () =>
      [...projects].sort((a, b) =>
        (a.abbreviation || a.name).localeCompare(b.abbreviation || b.name, undefined, {
          sensitivity: 'base',
        })
      ),
    [projects]
  )

  const openComposer = () => {
    setProjectId(sortedProjects[0]?.id ?? '')
    setContent('')
    setSeverity('warning')
    setComposerOpen(true)
  }

  const closeComposer = () => {
    setComposerOpen(false)
    setContent('')
  }

  const submit = () => {
    if (!projectId || !content.trim()) return
    onAddSticky(projectId, content.trim(), severity)
    closeComposer()
  }

  if (stickies.length === 0 && !composerOpen && projects.length === 0) return null

  if (stickies.length === 0 && !composerOpen) {
    return (
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-muted-foreground)]">
          No stickies in this view — pin a note or mark Warning / Urgent
        </p>
        {projects.length > 0 && (
          <Button type="button" variant="secondary" size="sm" onClick={openComposer}>
            <Plus className="h-3.5 w-3.5" />
            Add sticky
          </Button>
        )}
      </div>
    )
  }

  return (
    <section className="mb-6 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Sticky notes</h2>
          <p className="text-[11px] text-[var(--color-muted-foreground)]">
            Pinned, warning, and urgent notes from projects in this view
          </p>
        </div>
        {projects.length > 0 && (
          <Button type="button" variant="secondary" size="sm" onClick={openComposer}>
            <Plus className="h-3.5 w-3.5" />
            Add sticky
          </Button>
        )}
      </div>

      {composerOpen && (
        <div className="glass rounded-[var(--radius-lg)] p-4 space-y-3 border border-[var(--color-border)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-[var(--color-foreground)]">New sticky</p>
            <button
              type="button"
              onClick={closeComposer}
              className="p-1 rounded-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              Project
            </span>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card-solid)] px-3 py-2 text-sm"
            >
              {sortedProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.abbreviation ? `${p.abbreviation} — ${p.name}` : p.name}
                </option>
              ))}
            </select>
          </label>
          <Textarea
            placeholder="Leave yourself a note…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="text-sm min-h-[72px]"
            autoFocus
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5">
              {NOTE_SEVERITIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-medium rounded-[calc(var(--radius-md)-2px)] transition-colors',
                    severity === s
                      ? chipActive[s]
                      : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                  )}
                >
                  {NOTE_SEVERITY_LABELS[s]}
                </button>
              ))}
            </div>
            <Button type="button" size="sm" disabled={!content.trim() || !projectId} onClick={submit}>
              Save sticky
            </Button>
          </div>
          <p className="text-[10px] text-[var(--color-muted)]">
            Saved as a pinned project note — also visible on the project detail Notes panel
          </p>
        </div>
      )}

      {stickies.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {stickies.map(({ project, note }) => {
            const severity = noteSeverity(note)
            return (
              <Link
                key={`${project.id}-${note.id}`}
                to={`/projects/${project.id}`}
                className={cn(
                  'shrink-0 w-[220px] rounded-[var(--radius-md)] border p-3 transition-[transform,box-shadow] duration-150',
                  'hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/20 active:scale-[0.98]',
                  stickySurface[severity]
                )}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[11px] font-semibold truncate">
                    {project.abbreviation || project.name}
                  </span>
                  <span className={cn('text-[10px] font-medium ml-auto shrink-0', stickyLabel[severity])}>
                    {NOTE_SEVERITY_LABELS[severity]}
                  </span>
                  {note.pinned && <Pin className="h-2.5 w-2.5 shrink-0 text-[var(--color-accent)]" />}
                </div>
                <p className="text-xs text-[var(--color-foreground)] line-clamp-3 whitespace-pre-wrap">
                  {note.content}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
