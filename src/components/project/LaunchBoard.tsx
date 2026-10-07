import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Check, ChevronDown, MessageSquare, Search, Trash2 } from 'lucide-react'
import type { LaunchTask, Profile, Project } from '@/types'
import type { LaunchParty, LaunchTaskStatus } from '@/lib/launchTemplate'
import {
  LAUNCH_GROUPS,
  LAUNCH_PARTY_LABELS,
  LAUNCH_PHASES,
  LAUNCH_STATUS_LABELS,
  isLaunchDone,
  isLaunchTracked,
  taskMatchesOwner,
  taskTeamRole,
} from '@/lib/launchTemplate'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Panel } from '@/components/ui/Panel'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill'
import { Select } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { LaunchPlanSheet } from '@/components/project/LaunchPlanSheet'
import { taskMarkClass, taskStatusTriggerClass, taskTitleClass } from '@/components/project/taskGlance'
import { staggerDelay, useEntrance } from '@/components/ui/Reveal'

type TaskScope = 'all' | 'open' | 'mine'
type TaskOwner = 'any' | 'client' | 'webscribble'
type TaskRole = 'any' | 'implementation' | 'csm'
type BoardLayout = 'checklist' | 'plan'

const LAYOUT_KEY = 'icc-task-layout'

const LAYOUTS: { id: BoardLayout; label: string }[] = [
  { id: 'checklist', label: 'Checklist' },
  { id: 'plan', label: 'Plan' },
]

function readLayout(): BoardLayout {
  try {
    return localStorage.getItem(LAYOUT_KEY) === 'plan' ? 'plan' : 'checklist'
  } catch {
    return 'checklist'
  }
}

const SCOPES: { id: TaskScope; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'mine', label: 'Mine' },
]

const OWNERS: { id: TaskOwner; label: string }[] = [
  { id: 'any', label: 'Anyone' },
  { id: 'client', label: 'Client' },
  { id: 'webscribble', label: 'Web Scribble' },
]

const ROLES: { id: TaskRole; label: string }[] = [
  { id: 'any', label: 'Anyone' },
  { id: 'implementation', label: 'Implementation' },
  { id: 'csm', label: 'CSM' },
]

const STATUS_TONE: Record<LaunchTaskStatus, StatusTone> = {
  not_started: 'neutral',
  in_progress: 'progress',
  complete: 'complete',
  na: 'muted',
  as_needed: 'warning',
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
  onDeleteComment: (taskId: string, commentId: string) => void
}

export function LaunchBoard({
  project,
  profiles,
  currentUserId,
  onUpdateTask,
  onAddComment,
  onDeleteComment,
}: LaunchBoardProps) {
  const tasks = project.launchTasks ?? []
  const [phaseKey, setPhaseKey] = useState<string | null>(null)
  const [layout, setLayout] = useState<BoardLayout>(readLayout)
  const [scope, setScope] = useState<TaskScope>('all')
  const [owner, setOwner] = useState<TaskOwner>('any')
  const [role, setRole] = useState<TaskRole>('any')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [openGroupKeys, setOpenGroupKeys] = useState<string[] | null>(null)
  const enter = useEntrance()

  const names = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile.displayName])), [profiles])
  const toggleOpen = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id))
  }, [])

  const matches = (task: LaunchTask) => {
    if (task.legacy) return false
    if (phaseKey && task.phaseKey !== phaseKey) return false
    if (query && !task.title.toLowerCase().includes(query.trim().toLowerCase())) return false
    if (scope === 'open' && task.status !== 'not_started' && task.status !== 'in_progress') return false
    if (scope === 'mine' && task.assigneeId !== currentUserId) return false
    if (owner !== 'any' && !taskMatchesOwner(task, owner)) return false
    if (role !== 'any' && taskTeamRole(task) !== role) return false
    return true
  }

  const visible = tasks.filter(matches)
  const earlier = tasks.filter((task) => task.legacy)
  const filtering = scope !== 'all' || owner !== 'any' || role !== 'any' || phaseKey !== null || query.trim().length > 0

  const phaseTitle = (key: string) => LAUNCH_PHASES.find((phase) => phase.key === key)?.title

  const shownGroups = LAUNCH_GROUPS.flatMap((group) => {
    if (phaseKey && group.phaseKey !== phaseKey) return []
    const rows = visible.filter((task) => task.groupKey === group.key).sort((a, b) => a.sort - b.sort)
    if (rows.length === 0) return []
    const tracked = rows.filter((task) => isLaunchTracked(task.status))
    const done = tracked.filter((task) => isLaunchDone(task.status)).length
    return [{ group, rows, done, total: tracked.length }]
  })

  const isGroupOpen = (key: string, index: number) => {
    if (openGroupKeys === null) return index === 0
    return openGroupKeys.includes(key)
  }

  const toggleGroup = (key: string) => {
    setOpenGroupKeys((current) => {
      const base =
        current === null
          ? shownGroups[0]
            ? [shownGroups[0].group.key]
            : []
          : current
      return base.includes(key) ? base.filter((id) => id !== key) : [...base, key]
    })
  }

  return (
    <section className="space-y-3">
      <Panel pad="sm" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-semibold tracking-tight">Tasks</h2>
            <SegmentedControl
              value={layout}
              onChange={(next) => {
                setLayout(next)
                try {
                  localStorage.setItem(LAYOUT_KEY, next)
                } catch {
                  // Preference stays for this visit if storage is blocked.
                }
              }}
              options={LAYOUTS}
              label="Task layout"
            />
          </div>
          <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-muted)]" />
            <Input
              shape="pill"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks"
              aria-label="Search tasks"
              className="h-9 w-full pl-8"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <FilterCluster label="Show">
            <SegmentedControl value={scope} onChange={setScope} options={SCOPES} label="Which tasks" />
          </FilterCluster>
          <FilterCluster label="Lead">
            <SegmentedControl value={owner} onChange={setOwner} options={OWNERS} label="Who owns the task" />
          </FilterCluster>
          <FilterCluster label="Team">
            <SegmentedControl value={role} onChange={setRole} options={ROLES} label="Web Scribble role" />
          </FilterCluster>
        </div>

      <div className="flex gap-1.5 overflow-x-auto px-1">
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
      </Panel>

      {layout === 'plan' && shownGroups.length > 0 ? (
        <LaunchPlanSheet
          groups={shownGroups}
          profiles={profiles}
          names={names}
          currentUserId={currentUserId}
          onUpdateTask={onUpdateTask}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
        />
      ) : layout === 'checklist' ? (
        <div className="space-y-2.5">
          {shownGroups.map(({ group, rows, done, total }, index) => (
            <div
              key={group.key}
              className={cn(enter && 'rise-in')}
              style={enter ? { animationDelay: `${staggerDelay(index)}ms` } : undefined}
            >
            <GroupPanel
              title={group.title}
              phase={phaseKey === null ? phaseTitle(group.phaseKey) : undefined}
              done={done}
              total={total}
              open={isGroupOpen(group.key, index)}
              onToggle={() => toggleGroup(group.key)}
            >
              {checklistItems(rows).map((item) =>
                item.type === 'imports' ? (
                  <ImportDataRow
                    key="import-data"
                    initial={item.initial}
                    final={item.final}
                    names={names}
                    profiles={profiles}
                    currentUserId={currentUserId}
                    open={openId === 'import-data'}
                    onToggle={toggleOpen}
                    onUpdate={onUpdateTask}
                    onAddComment={onAddComment}
                    onDeleteComment={onDeleteComment}
                  />
                ) : (
                  <TaskRow
                    key={item.task.id}
                    task={item.task}
                    names={names}
                    profiles={profiles}
                    currentUserId={currentUserId}
                    open={openId === item.task.id}
                    onToggle={toggleOpen}
                    onUpdate={onUpdateTask}
                    onAddComment={onAddComment}
                    onDeleteComment={onDeleteComment}
                  />
                )
              )}
            </GroupPanel>
            </div>
          ))}
        </div>
      ) : null}

      {visible.length === 0 && (
        <p className="px-2 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
          {filtering ? 'Nothing matches. Clear a filter to see the rest of the board.' : 'No launch tasks yet.'}
        </p>
      )}

      {earlier.length > 0 && !filtering && (
        <details className="mt-4 rounded-2xl bg-[var(--color-field)] px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-[var(--color-ink-soft)]">
            Earlier tasks ({earlier.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {earlier.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 py-1 text-sm">
                <span>{task.title}</span>
                <StatusPill tone={STATUS_TONE[task.status]}>{LAUNCH_STATUS_LABELS[task.status]}</StatusPill>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}

function FilterCluster({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-[var(--color-ink-soft)]">{label}</span>
      {children}
    </div>
  )
}

function checklistItems(rows: LaunchTask[]): Array<
  { type: 'task'; task: LaunchTask } | { type: 'imports'; initial: LaunchTask; final: LaunchTask }
> {
  const initial = rows.find((task) => task.key === 'import_initial_data')
  const finalTask = rows.find((task) => task.key === 'import_final_data')
  if (!initial || !finalTask) return rows.map((task) => ({ type: 'task' as const, task }))
  const items: Array<
    { type: 'task'; task: LaunchTask } | { type: 'imports'; initial: LaunchTask; final: LaunchTask }
  > = []
  let placed = false
  for (const task of rows) {
    if (task.key === 'import_initial_data' || task.key === 'import_final_data') {
      if (!placed) {
        items.push({ type: 'imports', initial, final: finalTask })
        placed = true
      }
      continue
    }
    items.push({ type: 'task', task })
  }
  return items
}

const EXPAND_MS = 280

function Expand({
  open,
  reduce,
  children,
}: {
  open: boolean
  reduce: boolean
  children: ReactNode
}) {
  const innerRef = useRef<HTMLDivElement>(null)
  const skipEnter = useRef(open)
  const [shown, setShown] = useState(open)
  const [height, setHeight] = useState<number | 'auto'>(open ? 'auto' : 0)
  const [instant, setInstant] = useState(false)

  useLayoutEffect(() => {
    if (reduce) {
      setShown(open)
      setHeight(open ? 'auto' : 0)
      setInstant(true)
      return
    }

    if (open) {
      setShown(true)
      return
    }

    const el = innerRef.current
    if (!el) {
      setShown(false)
      setHeight(0)
      return
    }

    setInstant(true)
    setHeight(el.scrollHeight)
    let innerFrame = 0
    const frame = requestAnimationFrame(() => {
      setInstant(false)
      innerFrame = requestAnimationFrame(() => setHeight(0))
    })
    const timer = window.setTimeout(() => {
      setShown(false)
      setHeight(0)
    }, EXPAND_MS)
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(innerFrame)
      window.clearTimeout(timer)
    }
  }, [open, reduce])

  useLayoutEffect(() => {
    if (!open || reduce || !shown) return
    if (skipEnter.current) {
      skipEnter.current = false
      setHeight('auto')
      return
    }
    const el = innerRef.current
    if (!el) return
    setInstant(true)
    setHeight(0)
    let innerFrame = 0
    const frame = requestAnimationFrame(() => {
      const measured = innerRef.current?.scrollHeight ?? 0
      setInstant(false)
      innerFrame = requestAnimationFrame(() => setHeight(measured))
    })
    const timer = window.setTimeout(() => setHeight('auto'), EXPAND_MS)
    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(innerFrame)
      window.clearTimeout(timer)
    }
  }, [open, reduce, shown])

  if (!shown) return null

  return (
    <div
      className={cn('overflow-hidden', !open && 'pointer-events-none', !instant && !reduce && 'expand-panel')}
      style={{ height: height === 'auto' ? 'auto' : height }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  )
}

function GroupPanel({
  title,
  phase,
  done,
  total,
  open,
  onToggle,
  children,
}: {
  title: string
  phase?: string
  done: number
  total: number
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  const progress = total === 0 ? null : `${done} of ${total}`

  return (
    <Panel className="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-[var(--color-field)]"
      >
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[var(--color-ink-soft)] transition-transform duration-300 ease-[var(--ease-out)]',
            open && 'rotate-180 text-[var(--color-wash-strong)]'
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[15px] font-semibold tracking-tight text-[var(--color-foreground)]">{title}</span>
            {phase && <SectionLabel className="normal-case tracking-normal">{phase}</SectionLabel>}
          </span>
        </span>
        <span className="shrink-0 text-xs tabular-nums text-[var(--color-muted-foreground)]">
          {progress ?? 'As needed'}
        </span>
      </button>

      <Expand open={open} reduce={Boolean(reduce)}>
        <div className="divide-y divide-black/[0.05] border-t border-black/[0.06] dark:divide-white/10 dark:border-white/10">
          {children}
        </div>
      </Expand>
    </Panel>
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
        selected
          ? 'bg-[var(--color-wash)] text-[var(--color-wash-strong)]'
          : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-field)]'
      )}
    >
      {label}
    </button>
  )
}

function TaskFields({
  task,
  profiles,
  onUpdate,
  labeled = false,
  className,
}: {
  task: LaunchTask
  profiles: Profile[]
  onUpdate: (patch: {
    status?: LaunchTaskStatus
    dueDate?: string | null
    assigneeId?: string | null
  }) => void
  labeled?: boolean
  className?: string
}) {
  const statusOptions = (Object.keys(LAUNCH_STATUS_LABELS) as LaunchTaskStatus[]).map((status) => ({
    value: status,
    label: LAUNCH_STATUS_LABELS[status],
  }))
  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...profiles.map((profile) => ({ value: profile.id, label: profile.displayName })),
  ]

  return (
    <div className={cn('grid gap-2 sm:grid-cols-3', className)}>
      <label className="min-w-0 space-y-1.5">
        {labeled && <SectionLabel>Status</SectionLabel>}
        <Select
          ariaLabel={`Status for ${task.title}`}
          size={labeled ? 'md' : 'sm'}
          value={task.status}
          options={statusOptions}
          triggerClassName={taskStatusTriggerClass(task.status)}
          onChange={(value) => onUpdate({ status: value as LaunchTaskStatus })}
        />
      </label>
      <label className="min-w-0 space-y-1.5">
        {labeled && <SectionLabel>Due</SectionLabel>}
        <DatePicker
          aria-label={`Due date for ${task.title}`}
          value={task.dueDate?.slice(0, 10) ?? ''}
          placeholder="No date"
          onChange={(event) => onUpdate({ dueDate: event.target.value || null })}
          className={labeled ? undefined : 'h-9'}
        />
      </label>
      <label className="min-w-0 space-y-1.5">
        {labeled && <SectionLabel>Assignee</SectionLabel>}
        <Select
          ariaLabel={`Assignee for ${task.title}`}
          size={labeled ? 'md' : 'sm'}
          value={task.assigneeId ?? ''}
          options={assigneeOptions}
          onChange={(value) => onUpdate({ assigneeId: value || null })}
        />
      </label>
    </div>
  )
}

const ImportDataRow = memo(function ImportDataRow({
  initial,
  final: finalTask,
  names,
  profiles,
  currentUserId,
  open,
  onToggle,
  onUpdate,
  onAddComment,
  onDeleteComment,
}: {
  initial: LaunchTask
  final: LaunchTask
  names: Map<string, string>
  profiles: Profile[]
  currentUserId: string | null
  open: boolean
  onToggle: (id: string) => void
  onUpdate: LaunchBoardProps['onUpdateTask']
  onAddComment: LaunchBoardProps['onAddComment']
  onDeleteComment: LaunchBoardProps['onDeleteComment']
}) {
  const reduce = useReducedMotion()
  const steps = [
    { label: 'Initial import', task: initial },
    { label: 'Final import', task: finalTask },
  ]

  return (
    <div className={cn('transition-colors duration-200', open ? 'bg-[var(--color-field)]' : 'hover:bg-[var(--color-field)]')}>
      <div className="px-3 py-3 sm:px-4">
        <button type="button" onClick={() => onToggle('import-data')} aria-expanded={open} className="flex w-full items-start gap-1.5 text-left">
          <ChevronDown
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ink-soft)] transition-transform duration-300 ease-[var(--ease-out)]',
              open && 'rotate-180 text-[var(--color-wash-strong)]'
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium leading-5">Import data</span>
              <PartyChip party="webscribble" />
            </span>
            <span className="mt-0.5 block text-[13px] leading-5 text-[var(--color-ink-soft)]">
              Initial import and final import
            </span>
          </span>
        </button>
        <div className="mt-3 space-y-3 pl-5.5">
          {steps.map(({ label, task }) => (
            <div key={task.id} className="space-y-1.5">
              <p className={cn('text-xs leading-5', taskTitleClass(task.status))}>{label}</p>
              <TaskFields
                task={task}
                profiles={profiles}
                onUpdate={(patch) => onUpdate(task.id, patch)}
              />
            </div>
          ))}
        </div>
      </div>
      <Expand open={open} reduce={Boolean(reduce)}>
        <div className="space-y-5 px-4 pb-5 sm:pl-14">
          {steps.map(({ label, task }) => (
            <ImportStepNotes
              key={task.id}
              label={label}
              task={task}
              names={names}
              currentUserId={currentUserId}
              onAddComment={(body) => onAddComment(task.id, body)}
              onDeleteComment={(commentId) => onDeleteComment(task.id, commentId)}
            />
          ))}
        </div>
      </Expand>
    </div>
  )
})

function ImportStepNotes({
  label,
  task,
  names,
  currentUserId,
  onAddComment,
  onDeleteComment,
}: {
  label: string
  task: LaunchTask
  names: Map<string, string>
  currentUserId: string | null
  onAddComment: (body: string) => void
  onDeleteComment: (commentId: string) => void
}) {
  const [draft, setDraft] = useState('')
  return (
    <div className="space-y-2">
      <SectionLabel>{label}</SectionLabel>
      {task.description && <p className="text-sm text-[var(--color-ink-soft)]">{task.description}</p>}
      {task.comments.length === 0 ? (
        <p className="text-xs text-[var(--color-ink-soft)]">No comments yet.</p>
      ) : (
        <ul className="space-y-2">
          {task.comments.map((comment) => (
            <li key={comment.id} className="rounded-2xl bg-[var(--color-panel)] px-3 py-2 text-sm text-[var(--color-ink)]">
              <p className="text-[11px] text-[var(--color-ink-soft)]">
                <span className="font-medium text-[var(--color-ink)]">{names.get(comment.userId) ?? 'Teammate'}</span>
                <span> · {formatWhen(comment.createdAt)}</span>
                {comment.userId === currentUserId && (
                  <button
                    type="button"
                    title="Delete comment"
                    onClick={() => {
                      if (window.confirm('Delete this comment?')) onDeleteComment(comment.id)
                    }}
                    className="ml-1 text-[var(--color-ink-soft)] hover:text-[var(--color-danger)]"
                  >
                    <Trash2 className="inline h-3 w-3" />
                  </button>
                )}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}
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
          shape="pill"
          className="bg-[var(--color-panel)]"
        />
        <Button type="submit" size="sm" disabled={!draft.trim()} className="rounded-full">
          Send
        </Button>
      </form>
    </div>
  )
}

const TaskRow = memo(function TaskRow({
  task,
  names,
  profiles,
  currentUserId,
  open,
  onToggle,
  onUpdate,
  onAddComment,
  onDeleteComment,
}: {
  task: LaunchTask
  names: Map<string, string>
  profiles: Profile[]
  currentUserId: string | null
  open: boolean
  onToggle: (id: string) => void
  onUpdate: LaunchBoardProps['onUpdateTask']
  onAddComment: LaunchBoardProps['onAddComment']
  onDeleteComment: LaunchBoardProps['onDeleteComment']
}) {
  const reduce = useReducedMotion()
  const patchTask = (
    patch: {
      status?: LaunchTaskStatus
      dueDate?: string | null
      assigneeId?: string | null
      description?: string
    }
  ) => onUpdate(task.id, patch)
  const [draft, setDraft] = useState('')
  const [guidance, setGuidance] = useState(task.description)
  useEffect(() => {
    setGuidance(task.description)
  }, [task.description])

  return (
    <div
      className={cn(
        'transition-colors duration-200',
        open ? 'bg-[var(--color-field)]' : 'hover:bg-[var(--color-field)]'
      )}
    >
      <div className="px-3 py-3 sm:px-4">
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            aria-label={`Mark ${task.title} ${LAUNCH_STATUS_LABELS[cycleStatus(task.status)].toLowerCase()}`}
            onClick={() => patchTask({ status: cycleStatus(task.status) })}
            className={cn(
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,transform] duration-150 active:scale-90',
              taskMarkClass(task.status)
            )}
          >
            {isLaunchDone(task.status) && <Check className="h-3 w-3" strokeWidth={3} />}
            {task.status === 'in_progress' && (
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-wash-strong)]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onToggle(task.id)}
            aria-expanded={open}
            className="min-w-0 flex-1 cursor-pointer text-left"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="flex min-w-0 items-start gap-1.5">
                <ChevronDown
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0 text-[var(--color-ink-soft)] transition-transform duration-300 ease-[var(--ease-out)]',
                    open && 'rotate-180 text-[var(--color-wash-strong)]'
                  )}
                />
                <span className={cn('text-sm leading-5', taskTitleClass(task.status))}>
                  {task.title}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <PartyChip party={task.party} />
                {task.comments.length > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-xs text-[var(--color-ink-soft)]">
                    <MessageSquare className="h-3 w-3" />
                    {task.comments.length}
                  </span>
                )}
              </span>
            </span>
            {!open && task.description && (
              <span className="mt-0.5 block line-clamp-1 pl-5.5 text-[13px] leading-5 text-[var(--color-ink-soft)]">
                {task.description}
              </span>
            )}
          </button>
        </div>

        {!open && (
          <TaskFields task={task} profiles={profiles} onUpdate={patchTask} className="mt-2.5 pl-7 sm:pl-8" />
        )}
      </div>

      <Expand open={open} reduce={Boolean(reduce)}>
            <div className="space-y-5 px-4 pb-5 pt-1 sm:pl-14">
              <TaskFields task={task} profiles={profiles} onUpdate={patchTask} labeled />

              <label className="block space-y-1.5">
                <SectionLabel>Guidance</SectionLabel>
                <Textarea
                  value={guidance}
                  onChange={(event) => setGuidance(event.target.value)}
                  onBlur={() => {
                    if (guidance !== task.description) patchTask({ description: guidance })
                  }}
                  className="bg-[var(--color-panel)]"
                />
              </label>

              <div className="space-y-2.5">
                <SectionLabel>Comments</SectionLabel>
                {task.comments.length === 0 && (
                  <p className="text-xs text-[var(--color-ink-soft)]">No comments yet. Leave a note for the next person.</p>
                )}
                <ul className="space-y-2">
                  {task.comments.map((comment) => {
                    const mine = comment.userId === currentUserId
                    return (
                      <li key={comment.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                        <div
                          className={cn(
                            'max-w-[36rem] rounded-2xl px-3 py-2',
                            mine
                              ? 'bg-[var(--color-wash)] text-[var(--color-ink)]'
                              : 'bg-[var(--color-panel)] text-[var(--color-ink)]'
                          )}
                        >
                          <p className="flex items-center gap-1 text-[11px] text-[var(--color-ink-soft)]">
                            <span className="font-medium text-[var(--color-ink)]">
                              {names.get(comment.userId) ?? 'Teammate'}
                            </span>
                            <span aria-hidden>·</span>
                            <span>{formatWhen(comment.createdAt)}</span>
                            {mine && (
                              <button
                                type="button"
                                title="Delete comment"
                                onClick={() => {
                                  if (window.confirm('Delete this comment?')) onDeleteComment(task.id, comment.id)
                                }}
                                className="ml-1 rounded-full p-0.5 text-[var(--color-ink-soft)] hover:text-[var(--color-danger)]"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
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
                    onAddComment(task.id, draft)
                    setDraft('')
                  }}
                >
                  <Input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Add a comment"
                    shape="pill"
                    className="bg-[var(--color-panel)]"
                  />
                  <Button type="submit" size="sm" disabled={!draft.trim()} className="rounded-full">
                    Send
                  </Button>
                </form>
              </div>
            </div>
      </Expand>
    </div>
  )
})

function PartyChip({ party }: { party: LaunchParty }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium',
        party === 'client'
          ? 'bg-[var(--color-panel)] text-[var(--color-ink)]'
          : 'bg-[var(--color-wash)] text-[var(--color-wash-strong)]'
      )}
    >
      {LAUNCH_PARTY_LABELS[party]}
    </span>
  )
}
