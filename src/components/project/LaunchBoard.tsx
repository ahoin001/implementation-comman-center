import { useEffect, useMemo, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import type { LaunchTask, Profile, Project } from '@/types'
import type { LaunchParty, LaunchTaskStatus } from '@/lib/launchTemplate'
import {
  LAUNCH_GROUPS,
  LAUNCH_PARTY_LABELS,
  LAUNCH_PHASES,
  LAUNCH_STATUS_LABELS,
  isLaunchApplicable,
  launchBoardProgress,
} from '@/lib/launchTemplate'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'

type BoardFilter = 'open' | 'mine' | 'client' | 'webscribble'

const STATUS_TONE: Record<LaunchTaskStatus, string> = {
  not_started: 'bg-black/5 text-[var(--color-muted-foreground)] dark:bg-white/10',
  in_progress: 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]',
  complete: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  na: 'bg-black/5 text-[var(--color-muted)] dark:bg-white/5',
  as_needed: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
}

function formatDue(value?: string) {
  if (!value) return 'No date'
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface LaunchBoardProps {
  project: Project
  profiles: Profile[]
  currentUserId: string | null
  onUpdateTask: (
    taskId: string,
    patch: {
      status?: LaunchTaskStatus
      dueDate?: string | null
      assigneeId?: string | null
      description?: string
    }
  ) => void
  onAddComment: (taskId: string, body: string) => void
}

export function LaunchBoard({
  project,
  profiles,
  currentUserId,
  onUpdateTask,
  onAddComment,
}: LaunchBoardProps) {
  const tasks = project.launchTasks ?? []
  const [phaseKey, setPhaseKey] = useState<string | null>(null)
  const [filters, setFilters] = useState<BoardFilter[]>([])
  const [openId, setOpenId] = useState<string | null>(null)

  const names = useMemo(() => {
    const map = new Map(profiles.map((profile) => [profile.id, profile.displayName]))
    return map
  }, [profiles])

  const toggleFilter = (filter: BoardFilter) => {
    setFilters((current) => {
      if (current.includes(filter)) return current.filter((item) => item !== filter)
      const withoutOpposite = current.filter((item) => {
        if (filter === 'client' && item === 'webscribble') return false
        if (filter === 'webscribble' && item === 'client') return false
        return true
      })
      return [...withoutOpposite, filter]
    })
  }

  const matches = (task: LaunchTask) => {
    if (task.legacy) return false
    if (phaseKey && task.phaseKey !== phaseKey) return false
    if (filters.includes('open') && task.status !== 'not_started' && task.status !== 'in_progress') {
      return false
    }
    if (filters.includes('mine') && task.assigneeId !== currentUserId) return false
    if (filters.includes('client') && task.party !== 'client') return false
    if (filters.includes('webscribble') && task.party !== 'webscribble') return false
    return true
  }

  const visible = tasks.filter(matches)
  const earlier = tasks.filter((task) => task.legacy)
  const activeFilters = filters.length > 0 || phaseKey !== null

  return (
    <section className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {LAUNCH_PHASES.map((phase) => {
          const phaseTasks = tasks.filter((task) => task.phaseKey === phase.key && !task.legacy)
          const progress = launchBoardProgress(phaseTasks)
          const selected = phaseKey === phase.key
          return (
            <button
              key={phase.key}
              type="button"
              onClick={() => setPhaseKey(selected ? null : phase.key)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-left transition-colors duration-150',
                selected
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                  : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/30'
              )}
            >
              <span className="block text-xs font-medium">{phase.title}</span>
              <span className="block text-[10px] tabular-nums text-[var(--color-muted-foreground)]">
                {progress}% applicable
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            { id: 'open' as const, label: 'Open' },
            { id: 'mine' as const, label: 'Assigned to me' },
            { id: 'client' as const, label: 'Client' },
            { id: 'webscribble' as const, label: 'Web Scribble' },
          ]
        ).map((filter) => {
          const on = filters.includes(filter.id)
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => toggleFilter(filter.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150',
                on
                  ? 'bg-[var(--color-foreground)] text-[var(--color-background)]'
                  : 'border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              )}
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      {LAUNCH_GROUPS.map((group) => {
        if (phaseKey && group.phaseKey !== phaseKey) return null
        const rows = visible
          .filter((task) => task.groupKey === group.key)
          .sort((a, b) => a.sort - b.sort)
        if (rows.length === 0) return null
        const applicable = rows.filter((task) => isLaunchApplicable(task.status))
        const done = applicable.filter((task) => task.status === 'complete').length
        return (
          <div key={group.key} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3 px-1 pt-2">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
                {group.title}
              </h3>
              <span className="text-[10px] tabular-nums text-[var(--color-muted)]">
                {applicable.length === 0 ? 'As needed' : `${done}/${applicable.length}`}
              </span>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] overflow-hidden">
              {rows.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  names={names}
                  profiles={profiles}
                  open={openId === task.id}
                  onToggle={() => setOpenId(openId === task.id ? null : task.id)}
                  onUpdate={(patch) => onUpdateTask(task.id, patch)}
                  onAddComment={(body) => onAddComment(task.id, body)}
                />
              ))}
            </div>
          </div>
        )
      })}

      {visible.length === 0 && (
        <p className="text-sm text-[var(--color-muted-foreground)] px-1">
          {activeFilters ? 'No tasks match these filters.' : 'No launch tasks yet.'}
        </p>
      )}

      {earlier.length > 0 && !activeFilters && (
        <details className="rounded-[var(--radius-lg)] border border-[var(--color-border)] px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-[var(--color-muted-foreground)]">
            Earlier tasks ({earlier.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {earlier.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 py-1 text-sm">
                <span>{task.title}</span>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_TONE[task.status])}>
                  {LAUNCH_STATUS_LABELS[task.status]}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

function TaskRow({
  task,
  names,
  profiles,
  open,
  onToggle,
  onUpdate,
  onAddComment,
}: {
  task: LaunchTask
  names: Map<string, string>
  profiles: Profile[]
  open: boolean
  onToggle: () => void
  onUpdate: (
    patch: {
      status?: LaunchTaskStatus
      dueDate?: string | null
      assigneeId?: string | null
      description?: string
    }
  ) => void
  onAddComment: (body: string) => void
}) {
  const [draft, setDraft] = useState('')
  const [guidance, setGuidance] = useState(task.description)

  useEffect(() => {
    setGuidance(task.description)
  }, [task.description])
  const assignee = task.assigneeId ? names.get(task.assigneeId) ?? 'Teammate' : 'Unassigned'

  return (
    <div className="border-b border-[var(--color-border)] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full grid-cols-1 gap-2 px-3 py-2.5 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center sm:gap-3"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{task.title}</span>
          <span className="mt-1 inline-flex items-center gap-2 sm:hidden">
            <PartyChip party={task.party} />
            <span className="text-[11px] text-[var(--color-muted-foreground)]">{assignee}</span>
          </span>
        </span>
        <span className="hidden sm:block">
          <PartyChip party={task.party} />
        </span>
        <span className="hidden text-xs text-[var(--color-muted-foreground)] sm:block sm:w-28 sm:truncate">
          {assignee}
          <span className="mx-1 text-[var(--color-muted)]">·</span>
          {formatDue(task.dueDate)}
        </span>
        <span className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="text-[11px] text-[var(--color-muted-foreground)] sm:hidden">
            {formatDue(task.dueDate)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            {task.comments.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] tabular-nums text-[var(--color-muted-foreground)]">
                <MessageSquare className="h-3 w-3" />
                {task.comments.length}
              </span>
            )}
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_TONE[task.status])}>
              {LAUNCH_STATUS_LABELS[task.status]}
            </span>
          </span>
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-[var(--color-border)] bg-black/[0.015] px-3 py-3 dark:bg-white/[0.02]">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Status</span>
              <select
                value={task.status}
                onChange={(event) => onUpdate({ status: event.target.value as LaunchTaskStatus })}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card-solid)] px-2 text-sm"
              >
                {(Object.keys(LAUNCH_STATUS_LABELS) as LaunchTaskStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {LAUNCH_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Due</span>
              <Input
                type="date"
                value={task.dueDate?.slice(0, 10) ?? ''}
                onChange={(event) => onUpdate({ dueDate: event.target.value || null })}
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Assignee</span>
              <select
                value={task.assigneeId ?? ''}
                onChange={(event) => onUpdate({ assigneeId: event.target.value || null })}
                className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card-solid)] px-2 text-sm"
              >
                <option value="">Unassigned</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.displayName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Guidance</span>
            <Textarea
              value={guidance}
              onChange={(event) => setGuidance(event.target.value)}
              onBlur={() => {
                if (guidance !== task.description) onUpdate({ description: guidance })
              }}
            />
          </label>

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">Comments</p>
            {task.comments.length === 0 && (
              <p className="text-xs text-[var(--color-muted-foreground)]">No comments yet.</p>
            )}
            <ul className="space-y-2">
              {task.comments.map((comment) => (
                <li key={comment.id} className="rounded-[var(--radius-md)] bg-[var(--color-card-solid)] px-3 py-2">
                  <p className="text-[11px] text-[var(--color-muted-foreground)]">
                    <span className="font-medium text-[var(--color-foreground)]">
                      {names.get(comment.userId) ?? 'Teammate'}
                    </span>
                    <span className="mx-1">·</span>
                    {formatWhen(comment.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
                </li>
              ))}
            </ul>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                if (!draft.trim()) return
                onAddComment(draft)
                setDraft('')
              }}
            >
              <Input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Add a comment"
              />
              <Button type="submit" size="sm" variant="secondary" disabled={!draft.trim()}>
                Send
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function PartyChip({ party }: { party: LaunchParty }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
        party === 'client'
          ? 'bg-black/5 text-[var(--color-foreground)] dark:bg-white/10'
          : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
      )}
    >
      {LAUNCH_PARTY_LABELS[party]}
    </span>
  )
}
