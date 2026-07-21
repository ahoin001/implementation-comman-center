import { useState } from 'react'
import { Check, Ban, Minus, AlertCircle, Rocket, ChevronDown } from 'lucide-react'
import type { DeliverableKey, Project, ProjectTaskKey, ProjectTaskStatus } from '@/types'
import {
  LAUNCH_TASK_KEY,
  PROJECT_TASK_KEYS,
  PROJECT_TASK_LABELS,
  PROJECT_TASK_STATUS_LABELS,
  TASK_DELIVERABLE_KEYS,
} from '@/types'
import {
  arePreLaunchTasksComplete,
  calculateProgress,
  canCompleteLaunch,
  getLaunchReadinessLabel,
  getTaskCounts,
  isTaskComplete,
} from '@/lib/progress'
import { getMissingRequiredDocs } from '@/lib/deliverables'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { DeliverableCheckbox, DeliverableChip, RequiredDocsCallout } from '@/components/project/DeliverableControls'
import { cn } from '@/lib/utils'

interface ProjectTaskDeskProps {
  project: Project
  onUpdateTask: (
    taskKey: ProjectTaskKey,
    status: ProjectTaskStatus,
    blockedReason?: string
  ) => void
  onUpdateDeliverable: (key: DeliverableKey, patch: { received?: boolean; note?: string }) => void
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

function notePlaceholder(status: ProjectTaskStatus) {
  return status === 'blocked' ? 'Why is this blocked?' : 'Add a note…'
}

function collapsedSummary(status: ProjectTaskStatus, blockedReason?: string): string {
  if (status === 'blocked' && blockedReason) {
    const snippet = blockedReason.length > 48 ? `${blockedReason.slice(0, 48)}…` : blockedReason
    return `Blocked — ${snippet}`
  }
  return PROJECT_TASK_STATUS_LABELS[status]
}

export function ProjectTaskDesk({ project, onUpdateTask, onUpdateDeliverable }: ProjectTaskDeskProps) {
  const [openKey, setOpenKey] = useState<ProjectTaskKey | null>(() => {
    const firstOpen = PROJECT_TASK_KEYS.find((k) => !isTaskComplete(project.tasks[k]?.status ?? 'pending'))
    return firstOpen ?? null
  })
  const [editingNote, setEditingNote] = useState<ProjectTaskKey | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const progress = calculateProgress(project)
  const label = getLaunchReadinessLabel(project)
  const counts = getTaskCounts(project)
  const launchUnlocked = canCompleteLaunch(project)
  const readyToLaunch = arePreLaunchTasksComplete(project) && project.tasks.launch?.status !== 'done'
  const missingDocs = getMissingRequiredDocs(project)

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

  const toggleRow = (taskKey: ProjectTaskKey) => {
    setOpenKey((prev) => (prev === taskKey ? null : taskKey))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <CardTitle>Launch Desk</CardTitle>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              Finish every step, then mark Launch when the site goes live
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{progress}%</p>
            <p
              className={cn(
                'text-xs',
                readyToLaunch || label === 'Launched'
                  ? 'text-[var(--color-accent)] font-medium'
                  : 'text-[var(--color-muted-foreground)]'
              )}
            >
              {label}
            </p>
          </div>
        </div>

        <div className="mt-4 h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-300 ease-[var(--ease-out)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-3 text-xs text-[var(--color-muted-foreground)]">
          <span>{counts.pending} to do</span>
          <span>{counts.blocked} blocked</span>
          <span>{counts.done} done</span>
          {counts.not_needed > 0 && <span>{counts.not_needed} n/a</span>}
        </div>

        {missingDocs.length > 0 && (
          <div className="mt-3">
            <RequiredDocsCallout
              missing={missingDocs}
              onFocusKickoff={() => setOpenKey('kickoff_call')}
            />
          </div>
        )}
      </CardHeader>

      <ul className="space-y-2">
        {PROJECT_TASK_KEYS.map((taskKey) => {
          const task = project.tasks[taskKey]
          if (!task) return null
          const isBlocked = task.status === 'blocked'
          const isComplete = isTaskComplete(task.status)
          const isLaunch = taskKey === LAUNCH_TASK_KEY
          const isOpen = openKey === taskKey
          const options = isLaunch
            ? statusOptions.filter((o) => o.value !== 'not_needed')
            : statusOptions
          const linkedKeys = TASK_DELIVERABLE_KEYS[taskKey] ?? []

          return (
            <li
              key={taskKey}
              className={cn(
                'rounded-[var(--radius-md)] border border-[var(--color-border)] transition-colors duration-150',
                isBlocked && 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/[0.03]',
                isLaunch && readyToLaunch && 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/[0.04]',
                isComplete && 'opacity-90'
              )}
            >
              <button
                type="button"
                onClick={() => toggleRow(taskKey)}
                className="w-full flex items-start gap-3 p-3 text-left"
                aria-expanded={isOpen}
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 mt-0.5 text-[var(--color-muted-foreground)] transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        'text-sm font-medium flex items-center gap-1.5',
                        isComplete && 'line-through text-[var(--color-muted-foreground)]'
                      )}
                    >
                      {isLaunch && <Rocket className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" />}
                      {PROJECT_TASK_LABELS[taskKey]}
                    </p>
                    <span
                      className={cn(
                        'text-[10px] font-medium rounded-full px-2 py-0.5',
                        task.status === 'done' && 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
                        task.status === 'blocked' && 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
                        task.status === 'pending' && 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
                        task.status === 'not_needed' && 'bg-black/5 dark:bg-white/10 text-[var(--color-muted-foreground)]'
                      )}
                    >
                      {collapsedSummary(task.status, task.blockedReason)}
                    </span>
                  </div>
                  {!isOpen && linkedKeys.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {linkedKeys.map((key) => (
                        <DeliverableChip
                          key={key}
                          deliverableKey={key}
                          received={Boolean(project.deliverables[key]?.received)}
                        />
                      ))}
                    </div>
                  )}
                  {!isOpen && isLaunch && !launchUnlocked && (
                    <p className="text-[11px] text-[var(--color-muted-foreground)]">
                      Complete or mark N/A on every step above first
                    </p>
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-3 pb-3 pt-0 space-y-3 border-t border-[var(--color-border)]/60 mt-0">
                  <div className="flex flex-wrap gap-1.5 pt-3">
                    {options.map(({ value, label: optLabel, icon: Icon, activeClass }) => {
                      const active = task.status === value
                      const lockedDone = isLaunch && value === 'done' && !launchUnlocked
                      return (
                        <button
                          key={value}
                          type="button"
                          disabled={lockedDone}
                          title={
                            lockedDone ? 'Finish all other Launch Desk items first' : undefined
                          }
                          onClick={() => handleStatus(taskKey, value)}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-transparent transition-[transform,background-color,color] duration-150 active:scale-[0.97]',
                            active
                              ? activeClass
                              : 'text-[var(--color-muted-foreground)] hover:bg-black/5 dark:hover:bg-white/5',
                            lockedDone &&
                              'opacity-40 cursor-not-allowed hover:bg-transparent active:scale-100'
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {optLabel}
                        </button>
                      )
                    })}
                  </div>

                  {isLaunch && launchUnlocked && task.status !== 'done' && (
                    <p className="text-[11px] text-[var(--color-accent)]">
                      Ready — mark Done when the site is live
                    </p>
                  )}

                  {linkedKeys.length > 0 && (
                    <div className="space-y-1 pl-0.5">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)] px-2">
                        Deliverables
                      </p>
                      {linkedKeys.map((key) => (
                        <DeliverableCheckbox
                          key={key}
                          deliverableKey={key}
                          project={project}
                          required={key === 'ach' || key === 'w9'}
                          onToggle={(k, received) => onUpdateDeliverable(k, { received })}
                          onNoteChange={(k, note) => onUpdateDeliverable(k, { note })}
                        />
                      ))}
                    </div>
                  )}

                  {task.blockedReason && editingNote !== taskKey && (isBlocked || task.status === 'pending') && (
                    <button
                      type="button"
                      onClick={() => openNoteEditor(taskKey, task.status)}
                      className={cn(
                        'text-xs flex items-start gap-1.5 text-left w-full rounded-sm hover:opacity-80 transition-opacity',
                        isBlocked ? 'text-[var(--color-danger)]' : 'text-[var(--color-muted-foreground)]'
                      )}
                    >
                      {isBlocked ? (
                        <Ban className="h-3 w-3 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                      )}
                      {task.blockedReason}
                    </button>
                  )}

                  {editingNote === taskKey && (
                    <div className="flex gap-2">
                      <Input
                        placeholder={notePlaceholder(task.status)}
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveNote(taskKey)}
                        autoFocus
                        className="text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => saveNote(taskKey)}
                        className="shrink-0 text-xs font-medium text-[var(--color-accent)] px-2 active:scale-95"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
