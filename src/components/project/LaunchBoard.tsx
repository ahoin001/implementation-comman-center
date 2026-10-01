import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronDown, MessageSquare, Search } from 'lucide-react'
import type { LaunchTask, Profile, Project } from '@/types'
import type { LaunchParty, LaunchTaskStatus } from '@/lib/launchTemplate'
import {
  LAUNCH_GROUPS,
  LAUNCH_PARTY_LABELS,
  LAUNCH_PHASES,
  LAUNCH_STATUS_LABELS,
  isLaunchApplicable,
} from '@/lib/launchTemplate'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'

type BoardView = 'all' | 'open' | 'mine' | 'client' | 'webscribble'

const VIEWS: { id: BoardView; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'mine', label: 'Mine' },
  { id: 'client', label: 'Client' },
  { id: 'webscribble', label: 'Web Scribble' },
]

const STATUS_TONE: Record<LaunchTaskStatus, string> = {
  not_started: 'bg-[#eef1f6] text-[#5c6784]',
  in_progress: 'bg-[#e5f8ee] text-[#178a45]',
  complete: 'bg-[#e7eefe] text-[#2451d6]',
  na: 'bg-[#eef1f6] text-[#8b95b2]',
  as_needed: 'bg-[#fff4e5] text-[#b86b00]',
}

const EASE = [0.23, 1, 0.32, 1] as const

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

function cycleStatus(status: LaunchTaskStatus): LaunchTaskStatus {
  if (status === 'not_started') return 'in_progress'
  if (status === 'in_progress') return 'complete'
  return 'not_started'
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
  const [view, setView] = useState<BoardView>('all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const names = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile.displayName])), [profiles])

  const matches = (task: LaunchTask) => {
    if (task.legacy) return false
    if (phaseKey && task.phaseKey !== phaseKey) return false
    if (query && !task.title.toLowerCase().includes(query.trim().toLowerCase())) return false
    if (view === 'open' && task.status !== 'not_started' && task.status !== 'in_progress') return false
    if (view === 'mine' && task.assigneeId !== currentUserId) return false
    if (view === 'client' && task.party !== 'client') return false
    if (view === 'webscribble' && task.party !== 'webscribble') return false
    return true
  }

  const visible = tasks.filter(matches)
  const earlier = tasks.filter((task) => task.legacy)
  const filtering = view !== 'all' || phaseKey !== null || query.trim().length > 0

  return (
    <section className="float-panel p-3 sm:p-4">
      <div className="flex flex-col gap-3 px-1 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold tracking-tight">Tasks</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-muted)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks"
              aria-label="Search tasks"
              className="h-9 w-44 rounded-full bg-[#f4f7fb] pl-8 sm:w-52"
            />
          </div>
          <div className="inline-flex rounded-full bg-[#f4f7fb] p-1">
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-[background-color,color,box-shadow] duration-150',
                  view === item.id
                    ? 'bg-[#1d2433] text-white shadow-sm'
                    : 'text-[#5c6784] hover:text-[#1d2433]'
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <PhaseChip label="Every phase" selected={phaseKey === null} onClick={() => setPhaseKey(null)} />
        {LAUNCH_PHASES.map((phase) => (
          <PhaseChip
            key={phase.key}
            label={phase.title}
            selected={phaseKey === phase.key}
            onClick={() => setPhaseKey(phaseKey === phase.key ? null : phase.key)}
          />
        ))}
      </div>

      <div className="space-y-5">
        {LAUNCH_GROUPS.map((group) => {
          if (phaseKey && group.phaseKey !== phaseKey) return null
          const rows = visible.filter((task) => task.groupKey === group.key).sort((a, b) => a.sort - b.sort)
          if (rows.length === 0) return null
          const applicable = rows.filter((task) => isLaunchApplicable(task.status))
          const done = applicable.filter((task) => task.status === 'complete').length
          return (
            <div key={group.key}>
              <div className="mb-1.5 flex items-baseline justify-between px-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b95b2]">
                  {group.title}
                </h3>
                <span className="text-[11px] tabular-nums text-[#8b95b2]">
                  {applicable.length === 0 ? 'As needed' : `${done}/${applicable.length}`}
                </span>
              </div>
              <div className="space-y-1.5">
                {rows.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    names={names}
                    profiles={profiles}
                    currentUserId={currentUserId}
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
      </div>

      {visible.length === 0 && (
        <p className="px-2 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
          {filtering ? 'Nothing matches. Clear a filter to see the rest of the board.' : 'No launch tasks yet.'}
        </p>
      )}

      {earlier.length > 0 && !filtering && (
        <details className="mt-4 rounded-2xl bg-[#f4f7fb] px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-[#5c6784]">
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

function PhaseChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150',
        selected ? 'bg-[#e7eeff] text-[#2451d6]' : 'text-[#5c6784] hover:bg-[#f4f7fb]'
      )}
    >
      {label}
    </button>
  )
}

function TaskRow({
  task,
  names,
  profiles,
  currentUserId,
  open,
  onToggle,
  onUpdate,
  onAddComment,
}: {
  task: LaunchTask
  names: Map<string, string>
  profiles: Profile[]
  currentUserId: string | null
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
  const reduce = useReducedMotion()
  const [draft, setDraft] = useState('')
  const [guidance, setGuidance] = useState(task.description)
  const assignee = task.assigneeId ? names.get(task.assigneeId) ?? 'Teammate' : 'Unassigned'

  useEffect(() => {
    setGuidance(task.description)
  }, [task.description])

  return (
    <div
      className={cn(
        'rounded-2xl transition-[background-color,box-shadow] duration-200',
        open ? 'bg-[#f7f9fd] shadow-[inset_0_0_0_1px_rgba(59,108,255,0.12)]' : 'hover:bg-[#f7f9fd]'
      )}
    >
      <div className="flex items-start gap-2 px-2 py-2">
        <button
          type="button"
          aria-label={`Mark ${task.title} ${LAUNCH_STATUS_LABELS[cycleStatus(task.status)].toLowerCase()}`}
          onClick={() => onUpdate({ status: cycleStatus(task.status) })}
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,transform] duration-150 active:scale-90',
            task.status === 'complete'
              ? 'border-[#3b6cff] bg-[#3b6cff] text-white'
              : task.status === 'in_progress'
                ? 'border-[#3b6cff] bg-[#e7eeff]'
                : 'border-[#c9d2e3] bg-white'
          )}
        >
          {task.status === 'complete' && <Check className="h-3 w-3" strokeWidth={3} />}
          {task.status === 'in_progress' && <span className="h-1.5 w-1.5 rounded-full bg-[#3b6cff]" />}
        </button>

        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <span className="flex items-start justify-between gap-3">
            <span
              className={cn(
                'text-sm font-medium leading-5',
                task.status === 'complete' && 'text-[#6d7896] line-through decoration-[#c9d2e3]'
              )}
            >
              {task.title}
            </span>
            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_TONE[task.status])}>
              {LAUNCH_STATUS_LABELS[task.status]}
            </span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#6d7896]">
            <PartyChip party={task.party} />
            <span>{assignee}</span>
            <span aria-hidden>·</span>
            <span>{formatDue(task.dueDate)}</span>
            {task.comments.length > 0 && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-0.5">
                  <MessageSquare className="h-3 w-3" />
                  {task.comments.length}
                </span>
              </>
            )}
          </span>
        </button>

        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? 'Collapse task' : 'Expand task'}
          onClick={onToggle}
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#8b95b2] hover:bg-white"
        >
          <ChevronDown className={cn('h-4 w-4 transition-transform duration-300 ease-[var(--ease-out)]', open && 'rotate-180')} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? { height: 0, opacity: 1 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.32, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="space-y-4 px-3 pb-4 pt-1 sm:pl-9">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#8b95b2]">Status</span>
                  <select
                    value={task.status}
                    onChange={(event) => onUpdate({ status: event.target.value as LaunchTaskStatus })}
                    className="h-10 w-full rounded-xl border border-[#e3e8f2] bg-white px-2 text-sm"
                  >
                    {(Object.keys(LAUNCH_STATUS_LABELS) as LaunchTaskStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {LAUNCH_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#8b95b2]">Due</span>
                  <Input
                    type="date"
                    value={task.dueDate?.slice(0, 10) ?? ''}
                    onChange={(event) => onUpdate({ dueDate: event.target.value || null })}
                    className="rounded-xl bg-white"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[#8b95b2]">Assignee</span>
                  <select
                    value={task.assigneeId ?? ''}
                    onChange={(event) => onUpdate({ assigneeId: event.target.value || null })}
                    className="h-10 w-full rounded-xl border border-[#e3e8f2] bg-white px-2 text-sm"
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
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#8b95b2]">Guidance</span>
                <Textarea
                  value={guidance}
                  onChange={(event) => setGuidance(event.target.value)}
                  onBlur={() => {
                    if (guidance !== task.description) onUpdate({ description: guidance })
                  }}
                  className="rounded-xl bg-white"
                />
              </label>

              <div className="space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[#8b95b2]">Comments</p>
                {task.comments.length === 0 && (
                  <p className="text-xs text-[#6d7896]">No comments yet. Leave a note for the next person.</p>
                )}
                <ul className="space-y-2">
                  {task.comments.map((comment) => {
                    const mine = comment.userId === currentUserId
                    return (
                      <li key={comment.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cn(
                            'max-w-[36rem] rounded-2xl px-3 py-2',
                            mine ? 'bg-[#e7eeff] text-[#1d2433]' : 'bg-white text-[#1d2433]'
                          )}
                        >
                          <p className="text-[11px] text-[#6d7896]">
                            <span className="font-medium text-[#1d2433]">
                              {names.get(comment.userId) ?? 'Teammate'}
                            </span>
                            <span className="mx-1">·</span>
                            {formatWhen(comment.createdAt)}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
                        </div>
                      </li>
                    )
                  })}
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
                    className="rounded-full bg-white"
                  />
                  <Button type="submit" size="sm" disabled={!draft.trim()} className="rounded-full">
                    Send
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PartyChip({ party }: { party: LaunchParty }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
        party === 'client' ? 'bg-white text-[#3c4663]' : 'bg-[#e7eeff] text-[#2451d6]'
      )}
    >
      {LAUNCH_PARTY_LABELS[party]}
    </span>
  )
}
