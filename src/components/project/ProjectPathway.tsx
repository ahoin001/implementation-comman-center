import { useState } from 'react'
import { Check, Ban, Minus, AlertCircle, Rocket } from 'lucide-react'
import type { DeliverableKey, Project, ProjectTaskKey, ProjectTaskStatus } from '@/types'
import {
  LAUNCH_TASK_KEY,
  PROJECT_TASK_LABELS,
  PROJECT_TASK_STATUS_LABELS,
} from '@/types'
import {
  arePreLaunchTasksComplete,
  canCompleteLaunch,
  getLaunchReadinessLabel,
  isTaskComplete,
} from '@/lib/progress'
import { getDeliverableProgress, getMissingRequiredDocs } from '@/lib/deliverables'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
  DeliverableCheckbox,
  RequiredDocsCallout,
} from '@/components/project/DeliverableControls'
import { cn } from '@/lib/utils'

interface ProjectPathwayProps {
  project: Project
  onUpdateTask: (
    taskKey: ProjectTaskKey,
    status: ProjectTaskStatus,
    blockedReason?: string
  ) => void
  onUpdateDeliverable: (key: DeliverableKey, patch: { received?: boolean; note?: string }) => void
}

type PhaseItem =
  | { kind: 'task'; key: ProjectTaskKey }
  | { kind: 'deliverable'; key: DeliverableKey; required?: boolean }

interface Phase {
  id: string
  title: string
  items: PhaseItem[]
}

const PHASES: Phase[] = [
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
    items: [
      { kind: 'task', key: 'site_design' },
      { kind: 'task', key: 'data_import' },
      { kind: 'task', key: 'sso' },
      { kind: 'deliverable', key: 'sso_test_credentials', required: true },
    ],
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

function phaseProgress(project: Project, phase: Phase): { done: number; total: number } {
  let done = 0
  const total = phase.items.length
  for (const item of phase.items) {
    if (item.kind === 'task') {
      if (isTaskComplete(project.tasks[item.key]?.status ?? 'pending')) done++
    } else if (project.deliverables[item.key]?.received) {
      done++
    }
  }
  return { done, total }
}

export function ProjectPathway({ project, onUpdateTask, onUpdateDeliverable }: ProjectPathwayProps) {
  const [editingNote, setEditingNote] = useState<ProjectTaskKey | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const label = getLaunchReadinessLabel(project)
  const launchUnlocked = canCompleteLaunch(project)
  const readyToLaunch = arePreLaunchTasksComplete(project) && project.tasks.launch?.status !== 'done'
  const missingDocs = getMissingRequiredDocs(project)
  const deliverableProgress = getDeliverableProgress(project)

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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <CardTitle>Pathway</CardTitle>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              Phases, required deliverables, and Launch Desk steps in one flow
            </p>
          </div>
          <div className="text-right shrink-0 space-y-0.5">
            <p className="text-sm font-medium text-[var(--color-foreground)]">{label}</p>
            <p className="text-xs text-[var(--color-muted-foreground)] tabular-nums">
              Deliverables {deliverableProgress.received}/{deliverableProgress.total}
            </p>
          </div>
        </div>
        {missingDocs.length > 0 && (
          <div className="mt-3">
            <RequiredDocsCallout missing={missingDocs} />
          </div>
        )}
      </CardHeader>

      <div className="space-y-6 relative">
        <div
          className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--color-border)]"
          aria-hidden
        />

        {PHASES.map((phase) => {
          const { done, total } = phaseProgress(project, phase)
          const phaseComplete = done === total

          return (
            <section key={phase.id} className="relative pl-8">
              <span
                className={cn(
                  'absolute left-0 top-1 flex h-[22px] w-[22px] items-center justify-center rounded-full border text-[10px] font-semibold',
                  phaseComplete
                    ? 'border-[var(--color-success)] bg-[var(--color-success)] text-white'
                    : 'border-[var(--color-border)] bg-[var(--color-card-solid)] text-[var(--color-muted-foreground)]'
                )}
              >
                {phaseComplete ? <Check className="h-3 w-3" strokeWidth={3} /> : done}
              </span>

              <header className="flex items-baseline justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold tracking-tight">{phase.title}</h3>
                <span className="text-[11px] text-[var(--color-muted-foreground)] tabular-nums">
                  {done}/{total}
                </span>
              </header>

              <ul className="space-y-2">
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

                  const taskKey = item.key
                  const task = project.tasks[taskKey]
                  if (!task) return null
                  const isLaunch = taskKey === LAUNCH_TASK_KEY
                  const options = isLaunch
                    ? statusOptions.filter((o) => o.value !== 'not_needed')
                    : statusOptions
                  const isBlocked = task.status === 'blocked'

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
                        <div className="flex flex-wrap items-center justify-between gap-2">
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
                            <span className="text-[10px] font-normal text-[var(--color-muted-foreground)] no-underline">
                              {PROJECT_TASK_STATUS_LABELS[task.status]}
                            </span>
                          </p>
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

                        {task.blockedReason && editingNote !== taskKey && (isBlocked || task.status === 'pending') && (
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
                                task.status === 'blocked' ? 'Why is this blocked?' : 'Add a note…'
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
            </section>
          )
        })}
      </div>
    </Card>
  )
}
