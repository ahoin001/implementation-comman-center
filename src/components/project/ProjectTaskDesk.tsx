import { useState } from 'react'
import { Check, Ban, Minus, AlertCircle, Rocket } from 'lucide-react'
import type { FollowUpSubstepKey, Project, ProjectTaskKey, ProjectTaskStatus } from '@/types'
import {
  FOLLOW_UP_SUBSTEPS,
  FOLLOW_UP_TASK_KEY,
  LAUNCH_TASK_KEY,
  PROJECT_TASK_KEYS,
  PROJECT_TASK_LABELS,
  PROJECT_TASK_STATUS_LABELS,
} from '@/types'
import {
  areFollowUpSubstepsComplete,
  arePreLaunchTasksComplete,
  calculateProgress,
  canCompleteLaunch,
  getLaunchReadinessLabel,
  getTaskCounts,
} from '@/lib/progress'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface ProjectTaskDeskProps {
  project: Project
  onUpdateTask: (
    taskKey: ProjectTaskKey,
    status: ProjectTaskStatus,
    blockedReason?: string
  ) => void
  onUpdateFollowUpSubstep: (substep: FollowUpSubstepKey, checked: boolean) => void
}

const statusOptions: { value: ProjectTaskStatus; label: string; icon: typeof Check; activeClass: string }[] = [
  { value: 'done', label: 'Done', icon: Check, activeClass: 'bg-[var(--color-success)]/15 text-[var(--color-success)] ring-[var(--color-success)]/30' },
  { value: 'not_needed', label: 'N/A', icon: Minus, activeClass: 'bg-black/5 dark:bg-white/10 text-[var(--color-muted-foreground)] ring-black/10' },
  { value: 'blocked', label: 'Blocked', icon: Ban, activeClass: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] ring-[var(--color-danger)]/30' },
  { value: 'pending', label: 'To Do', icon: AlertCircle, activeClass: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] ring-[var(--color-accent)]/30' },
]

function notePlaceholder(status: ProjectTaskStatus) {
  return status === 'blocked' ? 'Why is this blocked?' : 'Add a note…'
}

export function ProjectTaskDesk({ project, onUpdateTask, onUpdateFollowUpSubstep }: ProjectTaskDeskProps) {
  const [editingNote, setEditingNote] = useState<ProjectTaskKey | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const progress = calculateProgress(project)
  const label = getLaunchReadinessLabel(project)
  const counts = getTaskCounts(project)
  const launchUnlocked = canCompleteLaunch(project)
  const readyToLaunch = arePreLaunchTasksComplete(project) && project.tasks.launch?.status !== 'done'

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
    onUpdateTask(
      taskKey,
      noteStatus,
      trimmed || (noteStatus === 'blocked' ? 'Blocked' : undefined)
    )
    setEditingNote(null)
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
      </CardHeader>

      <ul className="space-y-2">
        {PROJECT_TASK_KEYS.map((taskKey) => {
          const task = project.tasks[taskKey]
          if (!task) return null
          const isBlocked = task.status === 'blocked'
          const isComplete = task.status === 'done' || task.status === 'not_needed'
          const isLaunch = taskKey === LAUNCH_TASK_KEY
          const isFollowUp = taskKey === FOLLOW_UP_TASK_KEY
          const options = isLaunch
            ? statusOptions.filter((o) => o.value !== 'not_needed')
            : statusOptions
          const followUpProgress = isFollowUp
            ? `${[task.substeps?.email_sent, task.substeps?.documents_received].filter(Boolean).length}/2`
            : null

          return (
            <li
              key={taskKey}
              className={cn(
                'rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 transition-colors duration-150',
                isBlocked && 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/[0.03]',
                isLaunch && readyToLaunch && 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/[0.04]',
                isComplete && !isFollowUp && 'opacity-80'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium flex items-center gap-1.5',
                      task.status === 'done' && 'line-through text-[var(--color-muted-foreground)]',
                      task.status === 'not_needed' && 'line-through text-[var(--color-muted-foreground)]'
                    )}
                  >
                    {isLaunch && <Rocket className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" />}
                    {PROJECT_TASK_LABELS[taskKey]}
                    {isFollowUp && task.status !== 'not_needed' && (
                      <span className="text-[10px] font-normal text-[var(--color-muted-foreground)] no-underline">
                        {followUpProgress}
                      </span>
                    )}
                  </p>
                  {isLaunch && !launchUnlocked && (
                    <p className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5">
                      Complete or mark N/A on every step above first
                    </p>
                  )}
                  {isLaunch && launchUnlocked && task.status !== 'done' && (
                    <p className="text-[11px] text-[var(--color-accent)] mt-0.5">
                      Ready — mark Done when the site is live
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {options.map(({ value, label: optLabel, icon: Icon, activeClass }) => {
                    const active = task.status === value
                    const lockedDone = isLaunch && value === 'done' && !launchUnlocked
                    return (
                      <button
                        key={value}
                        type="button"
                        disabled={lockedDone}
                        title={
                          lockedDone
                            ? 'Finish all other Launch Desk items first'
                            : undefined
                        }
                        onClick={() => handleStatus(taskKey, value)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-transparent transition-[transform,background-color,color] duration-150 active:scale-[0.97]',
                          active ? activeClass : 'text-[var(--color-muted-foreground)] hover:bg-black/5 dark:hover:bg-white/5',
                          lockedDone && 'opacity-40 cursor-not-allowed hover:bg-transparent active:scale-100'
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {optLabel}
                      </button>
                    )
                  })}
                </div>
              </div>

              {isFollowUp && task.status !== 'not_needed' && (
                <div className="mt-3 space-y-1.5 pl-0.5">
                  {FOLLOW_UP_SUBSTEPS.map(({ key, label: subLabel }) => {
                    const checked = Boolean(task.substeps?.[key])
                    return (
                      <label
                        key={key}
                        className={cn(
                          'flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-1.5 text-sm cursor-pointer transition-colors duration-150',
                          'hover:bg-black/5 dark:hover:bg-white/5',
                          checked ? 'text-[var(--color-foreground)]' : 'text-[var(--color-muted-foreground)]'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-150',
                            checked
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                              : 'border-[var(--color-border)] bg-[var(--color-card-solid)]'
                          )}
                        >
                          {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={(e) => onUpdateFollowUpSubstep(key, e.target.checked)}
                        />
                        <span className={cn(checked && 'line-through opacity-70')}>{subLabel}</span>
                      </label>
                    )
                  })}
                  {!areFollowUpSubstepsComplete(task.substeps) && task.status !== 'blocked' && (
                    <p className="text-[11px] text-[var(--color-muted)] px-2 pt-0.5">
                      Both items required to complete this step
                    </p>
                  )}
                </div>
              )}

              {task.blockedReason && editingNote !== taskKey && (isBlocked || task.status === 'pending') && (
                <button
                  type="button"
                  onClick={() => openNoteEditor(taskKey, task.status)}
                  className={cn(
                    'mt-2 text-xs flex items-start gap-1.5 text-left w-full rounded-sm hover:opacity-80 transition-opacity',
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
                <div className="mt-3 flex gap-2">
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

              {task.status !== 'pending' && !isFollowUp && (
                <p className="mt-1.5 text-[10px] text-[var(--color-muted)]">
                  {PROJECT_TASK_STATUS_LABELS[task.status]}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
