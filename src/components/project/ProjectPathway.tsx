import { useMemo, useState } from 'react'
import { Check, Ban, Minus, AlertCircle, Rocket, ChevronDown } from 'lucide-react'
import type {
  DataAssetKey,
  DeliverableKey,
  ImageAssetsStatus,
  Project,
  ProjectTaskKey,
  ProjectTaskStatus,
} from '@/types'
import {
  DATA_ASSET_KEYS,
  DATA_ASSET_LABELS,
  DELIVERABLE_LABELS,
  LAUNCH_TASK_KEY,
  PROJECT_TASK_LABELS,
  PROJECT_TASK_STATUS_LABELS,
} from '@/types'
import {
  arePreLaunchTasksComplete,
  canCompleteLaunch,
  getLaunchReadinessLabel,
  getTaskCounts,
  isTaskComplete,
} from '@/lib/progress'
import { getDeliverableProgress, getMissingRequiredDocs } from '@/lib/deliverables'
import {
  getDataAssetsReceived,
  getImageAssetsLabel,
  isSsoEnabled,
  needsSsoCredentials,
} from '@/lib/pathConfig'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
  DeliverableCheckbox,
  DeliverableChip,
  RequiredDocsCallout,
} from '@/components/project/DeliverableControls'
import { cn } from '@/lib/utils'

interface ProjectLaunchPathProps {
  project: Project
  onUpdateTask: (
    taskKey: ProjectTaskKey,
    status: ProjectTaskStatus,
    blockedReason?: string
  ) => void
  onUpdateDeliverable: (key: DeliverableKey, patch: { received?: boolean; note?: string }) => void
  onSetSsoEnabled: (enabled: boolean) => void
  onSetImageAssets: (status: ImageAssetsStatus) => void
  onToggleDataAsset: (key: DataAssetKey, value: boolean) => void
}

type PhaseItem =
  | { kind: 'task'; key: ProjectTaskKey }
  | { kind: 'deliverable'; key: DeliverableKey; required?: boolean }
  | { kind: 'image_assets' }
  | { kind: 'data_assets' }

interface Phase {
  id: string
  title: string
  items: PhaseItem[]
}

function buildPhases(ssoOn: boolean): Phase[] {
  const buildItems: PhaseItem[] = [
    { kind: 'task', key: 'site_design' },
    { kind: 'image_assets' },
    { kind: 'task', key: 'data_import' },
    { kind: 'data_assets' },
  ]
  if (ssoOn) {
    buildItems.push(
      { kind: 'task', key: 'sso' },
      { kind: 'deliverable', key: 'sso_test_credentials', required: true }
    )
  }

  return [
    {
      id: 'kickoff',
      title: 'Kickoff & paperwork',
      items: [
        { kind: 'task', key: 'kickoff_call' },
        { kind: 'deliverable', key: 'ach', required: true },
        { kind: 'deliverable', key: 'w9', required: true },
      ],
    },
    {
      id: 'follow_up',
      title: 'Follow-up',
      items: [{ kind: 'task', key: 'follow_up_email' }],
    },
    {
      id: 'build',
      title: 'Build & access',
      items: buildItems,
    },
    {
      id: 'enablement',
      title: 'Enablement',
      items: [
        { kind: 'task', key: 'smartway_training' },
        { kind: 'deliverable', key: 'custom_categories', required: true },
        { kind: 'task', key: 'job_backfill' },
      ],
    },
    {
      id: 'golive',
      title: 'Go live',
      items: [{ kind: 'task', key: 'launch' }],
    },
  ]
}

const statusOptions: {
  value: ProjectTaskStatus
  label: string
  icon: typeof Check
  activeClass: string
}[] = [
  {
    value: 'done',
    label: 'Done',
    icon: Check,
    activeClass: 'bg-[var(--color-success)]/15 text-[var(--color-success)] ring-[var(--color-success)]/30',
  },
  {
    value: 'not_needed',
    label: 'N/A',
    icon: Minus,
    activeClass: 'bg-black/5 dark:bg-white/10 text-[var(--color-muted-foreground)] ring-black/10',
  },
  {
    value: 'blocked',
    label: 'Blocked',
    icon: Ban,
    activeClass: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] ring-[var(--color-danger)]/30',
  },
  {
    value: 'pending',
    label: 'To Do',
    icon: AlertCircle,
    activeClass: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] ring-[var(--color-accent)]/30',
  },
]

function itemComplete(project: Project, item: PhaseItem): boolean {
  if (item.kind === 'task') {
    return isTaskComplete(project.tasks[item.key]?.status ?? 'pending')
  }
  if (item.kind === 'deliverable') {
    return Boolean(project.deliverables[item.key]?.received)
  }
  if (item.kind === 'image_assets') {
    return project.pathConfig.imageAssets !== 'pending'
  }
  // data assets are informational — always "complete" for phase progress
  return true
}

function itemCountsTowardProgress(item: PhaseItem): boolean {
  return item.kind !== 'data_assets'
}

function phaseProgress(project: Project, phase: Phase): { done: number; total: number } {
  const countable = phase.items.filter(itemCountsTowardProgress)
  const done = countable.filter((item) => itemComplete(project, item)).length
  return { done, total: countable.length }
}

function phaseCollapsedChips(project: Project, phase: Phase): { label: string; ok: boolean }[] {
  const chips: { label: string; ok: boolean }[] = []
  for (const item of phase.items) {
    if (item.kind === 'task') {
      const task = project.tasks[item.key]
      if (!task) continue
      const ok = isTaskComplete(task.status)
      const status =
        task.status === 'blocked'
          ? 'Blocked'
          : PROJECT_TASK_STATUS_LABELS[task.status]
      chips.push({ label: `${PROJECT_TASK_LABELS[item.key]}: ${status}`, ok })
    } else if (item.kind === 'deliverable') {
      const ok = Boolean(project.deliverables[item.key]?.received)
      chips.push({
        label: ok ? `✓ ${DELIVERABLE_LABELS[item.key]}` : DELIVERABLE_LABELS[item.key],
        ok,
      })
    } else if (item.kind === 'image_assets') {
      const status = project.pathConfig.imageAssets
      chips.push({
        label: getImageAssetsLabel(status),
        ok: status !== 'pending',
      })
    } else if (item.kind === 'data_assets') {
      const got = getDataAssetsReceived(project)
      chips.push({
        label: got.length ? `Data: ${got.length}/${DATA_ASSET_KEYS.length}` : 'No data types yet',
        ok: got.length > 0 || project.tasks.data_import?.status === 'not_needed',
      })
    }
  }
  return chips
}

export function ProjectLaunchPath({
  project,
  onUpdateTask,
  onUpdateDeliverable,
  onSetSsoEnabled,
  onSetImageAssets,
  onToggleDataAsset,
}: ProjectLaunchPathProps) {
  const ssoOn = isSsoEnabled(project)
  const phases = useMemo(() => buildPhases(ssoOn), [ssoOn])

  const [openPhase, setOpenPhase] = useState<string | null>(() => {
    const first = phases.find((ph) => {
      const { done, total } = phaseProgress(project, ph)
      return done < total
    })
    return first?.id ?? phases[0]?.id ?? null
  })
  const [editingNote, setEditingNote] = useState<ProjectTaskKey | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const label = getLaunchReadinessLabel(project)
  const counts = getTaskCounts(project)
  const launchUnlocked = canCompleteLaunch(project)
  const readyToLaunch = arePreLaunchTasksComplete(project) && project.tasks.launch?.status !== 'done'
  const missingDocs = getMissingRequiredDocs(project)
  const deliverableProgress = getDeliverableProgress(project)
  const missingCreds = needsSsoCredentials(project)

  const openNoteEditor = (taskKey: ProjectTaskKey, status: ProjectTaskStatus) => {
    setEditingNote(taskKey)
    setNoteDraft(project.tasks[taskKey].blockedReason ?? '')
    onUpdateTask(taskKey, status, project.tasks[taskKey].blockedReason)
  }

  const handleStatus = (taskKey: ProjectTaskKey, status: ProjectTaskStatus) => {
    if (taskKey === LAUNCH_TASK_KEY) {
      if (status === 'not_needed') return
      if (status === 'done' && !launchUnlocked) return
    }
    if (status === 'blocked' || status === 'pending') {
      openNoteEditor(taskKey, status)
      return
    }
    setEditingNote(null)
    onUpdateTask(taskKey, status)
  }

  const saveNote = (taskKey: ProjectTaskKey) => {
    const status = project.tasks[taskKey].status
    const noteStatus = status === 'blocked' || status === 'pending' ? status : 'pending'
    const trimmed = noteDraft.trim()
    onUpdateTask(taskKey, noteStatus, trimmed || (noteStatus === 'blocked' ? 'Blocked' : undefined))
    setEditingNote(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <CardTitle>Launch Path</CardTitle>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Phases, required deliverables, and go-live readiness
              </p>
            </div>
            <div className="text-right shrink-0 space-y-0.5">
              <p className="text-sm font-medium text-[var(--color-foreground)]">{label}</p>
              <p className="text-xs text-[var(--color-muted-foreground)] tabular-nums">
                Deliverables {deliverableProgress.received}/{deliverableProgress.total}
                <span className="mx-1.5 text-[var(--color-muted)]">·</span>
                {counts.pending} to do · {counts.blocked} blocked
              </p>
            </div>
          </div>

          <label className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium">SSO enabled</p>
              <p className="text-[11px] text-[var(--color-muted-foreground)]">
                Turn off when this association will not use SSO
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={ssoOn}
              onClick={() => onSetSsoEnabled(!ssoOn)}
              className={cn(
                'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                ssoOn ? 'bg-[var(--color-accent)]' : 'bg-black/15 dark:bg-white/20'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                  ssoOn && 'translate-x-5'
                )}
              />
            </button>
          </label>

          {(missingDocs.length > 0 || missingCreds) && (
            <div className="space-y-2">
              {missingDocs.length > 0 && (
                <RequiredDocsCallout
                  missing={missingDocs}
                  onFocusKickoff={() => setOpenPhase('kickoff')}
                />
              )}
              {missingCreds && (
                <button
                  type="button"
                  onClick={() => setOpenPhase('build')}
                  className="w-full text-left rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/[0.06] px-3 py-2 text-xs text-[var(--color-warning)] transition-colors hover:bg-[var(--color-warning)]/[0.1]"
                >
                  Missing SSO test credentials
                </button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <div className="space-y-3 relative">
        <div
          className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--color-border)]"
          aria-hidden
        />

        {phases.map((phase) => {
          const { done, total } = phaseProgress(project, phase)
          const phaseComplete = done === total && total > 0
          const isOpen = openPhase === phase.id
          const chips = phaseCollapsedChips(project, phase)

          return (
            <section key={phase.id} className="relative pl-8">
              <span
                className={cn(
                  'absolute left-0 top-3 flex h-[22px] w-[22px] items-center justify-center rounded-full border text-[10px] font-semibold z-[1]',
                  phaseComplete
                    ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
                    : 'border-[var(--color-border)] bg-[var(--color-card-solid)] text-[var(--color-muted-foreground)]'
                )}
              >
                {phaseComplete ? <Check className="h-3 w-3" strokeWidth={3} /> : done}
              </span>

              <div
                className={cn(
                  'rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden',
                  phaseComplete && 'opacity-90'
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenPhase((prev) => (prev === phase.id ? null : phase.id))}
                  className="w-full flex items-start gap-2 p-3 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                  aria-expanded={isOpen}
                >
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 mt-0.5 text-[var(--color-muted-foreground)] transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-semibold tracking-tight">{phase.title}</h3>
                      <span className="text-[11px] text-[var(--color-muted-foreground)] tabular-nums shrink-0">
                        {done}/{total}
                      </span>
                    </div>
                    {!isOpen && (
                      <div className="flex flex-wrap gap-1.5">
                        {chips.slice(0, 6).map((chip) => (
                          <span
                            key={chip.label}
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                              chip.ok
                                ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
                                : 'bg-black/5 dark:bg-white/10 text-[var(--color-muted-foreground)]'
                            )}
                          >
                            {chip.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>

                {isOpen && (
                  <ul className="space-y-2 px-3 pb-3 border-t border-[var(--color-border)]/60 pt-3">
                    {phase.items.map((item) => {
                      if (item.kind === 'deliverable') {
                        return (
                          <li
                            key={`d-${item.key}`}
                            className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-2 py-1"
                          >
                            <DeliverableCheckbox
                              deliverableKey={item.key}
                              project={project}
                              required={item.required}
                              onToggle={(k, received) => onUpdateDeliverable(k, { received })}
                              onNoteChange={(k, note) => onUpdateDeliverable(k, { note })}
                            />
                          </li>
                        )
                      }

                      if (item.kind === 'image_assets') {
                        const status = project.pathConfig.imageAssets
                        return (
                          <li
                            key="image_assets"
                            className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium">Provided images</p>
                              <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
                                Optional
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--color-muted-foreground)]">
                              Some associations provide images; others skip this entirely
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {(
                                [
                                  { value: 'provided' as const, label: 'Provided' },
                                  { value: 'not_providing' as const, label: 'Not providing' },
                                  { value: 'pending' as const, label: 'Pending' },
                                ] as const
                              ).map(({ value, label: optLabel }) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => onSetImageAssets(value)}
                                  className={cn(
                                    'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                                    status === value
                                      ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                                      : 'text-[var(--color-muted-foreground)] hover:bg-black/5 dark:hover:bg-white/5'
                                  )}
                                >
                                  {optLabel}
                                </button>
                              ))}
                            </div>
                          </li>
                        )
                      }

                      if (item.kind === 'data_assets') {
                        const got = getDataAssetsReceived(project)
                        return (
                          <li
                            key="data_assets"
                            className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium">Data available</p>
                              <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
                                Inventory · {got.length}/{DATA_ASSET_KEYS.length}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--color-muted-foreground)]">
                              Mark what the association has — none are required
                            </p>
                            <div className="space-y-1">
                              {DATA_ASSET_KEYS.map((key) => {
                                const checked = Boolean(project.pathConfig.dataAssets[key])
                                return (
                                  <label
                                    key={key}
                                    className={cn(
                                      'flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-1.5 text-sm cursor-pointer',
                                      'hover:bg-black/5 dark:hover:bg-white/5',
                                      checked
                                        ? 'text-[var(--color-foreground)]'
                                        : 'text-[var(--color-muted-foreground)]'
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                                        checked
                                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                                          : 'border-[var(--color-border)]'
                                      )}
                                    >
                                      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                                    </span>
                                    <input
                                      type="checkbox"
                                      className="sr-only"
                                      checked={checked}
                                      onChange={(e) => onToggleDataAsset(key, e.target.checked)}
                                    />
                                    {DATA_ASSET_LABELS[key]}
                                  </label>
                                )
                              })}
                            </div>
                          </li>
                        )
                      }

                      const taskKey = item.key
                      const task = project.tasks[taskKey]
                      if (!task) return null
                      const isLaunch = taskKey === LAUNCH_TASK_KEY
                      const options = isLaunch
                        ? statusOptions.filter((o) => o.value !== 'not_needed')
                        : statusOptions
                      const isBlocked = task.status === 'blocked'
                      const linked =
                        taskKey === 'kickoff_call'
                          ? (['ach', 'w9'] as DeliverableKey[])
                          : taskKey === 'sso'
                            ? (['sso_test_credentials'] as DeliverableKey[])
                            : []

                      return (
                        <li
                          key={taskKey}
                          className={cn(
                            'rounded-[var(--radius-md)] border border-[var(--color-border)] p-3',
                            isBlocked && 'border-[var(--color-danger)]/30',
                            isLaunch && readyToLaunch && 'border-[var(--color-accent)]/40'
                          )}
                        >
                          <div className="flex flex-col gap-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={cn(
                                  'text-sm font-medium flex items-center gap-1.5',
                                  isTaskComplete(task.status) &&
                                    'line-through text-[var(--color-muted-foreground)]'
                                )}
                              >
                                {isLaunch && (
                                  <Rocket className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" />
                                )}
                                {PROJECT_TASK_LABELS[taskKey]}
                              </p>
                              <span className="text-[10px] text-[var(--color-muted-foreground)]">
                                {PROJECT_TASK_STATUS_LABELS[task.status]}
                              </span>
                              {linked.map((key) => (
                                <DeliverableChip
                                  key={key}
                                  deliverableKey={key}
                                  received={Boolean(project.deliverables[key]?.received)}
                                />
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {options.map(({ value, label: optLabel, icon: Icon, activeClass }) => {
                                const active = task.status === value
                                const lockedDone = isLaunch && value === 'done' && !launchUnlocked
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    disabled={lockedDone}
                                    onClick={() => handleStatus(taskKey, value)}
                                    className={cn(
                                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-transparent transition-[transform,background-color,color] duration-150 active:scale-[0.97]',
                                      active
                                        ? activeClass
                                        : 'text-[var(--color-muted-foreground)] hover:bg-black/5 dark:hover:bg-white/5',
                                      lockedDone && 'opacity-40 cursor-not-allowed'
                                    )}
                                  >
                                    <Icon className="h-3 w-3" />
                                    {optLabel}
                                  </button>
                                )
                              })}
                            </div>

                            {task.blockedReason &&
                              editingNote !== taskKey &&
                              (isBlocked || task.status === 'pending') && (
                                <button
                                  type="button"
                                  onClick={() => openNoteEditor(taskKey, task.status)}
                                  className={cn(
                                    'text-xs text-left',
                                    isBlocked
                                      ? 'text-[var(--color-danger)]'
                                      : 'text-[var(--color-muted-foreground)]'
                                  )}
                                >
                                  {task.blockedReason}
                                </button>
                              )}

                            {editingNote === taskKey && (
                              <div className="flex gap-2">
                                <Input
                                  placeholder={
                                    task.status === 'blocked'
                                      ? 'Why is this blocked?'
                                      : 'Add a note…'
                                  }
                                  value={noteDraft}
                                  onChange={(e) => setNoteDraft(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && saveNote(taskKey)}
                                  autoFocus
                                  className="text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => saveNote(taskKey)}
                                  className="shrink-0 text-xs font-medium text-[var(--color-accent)] px-2"
                                >
                                  Save
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </Card>
  )
}

/** @deprecated Use ProjectLaunchPath */
export const ProjectPathway = ProjectLaunchPath
