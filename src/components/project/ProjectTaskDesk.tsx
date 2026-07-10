import { useState } from 'react'
import { Check, Ban, Minus, AlertCircle } from 'lucide-react'
import type { Project, ProjectTaskKey, ProjectTaskStatus } from '@/types'
import { PROJECT_TASK_KEYS, PROJECT_TASK_LABELS, PROJECT_TASK_STATUS_LABELS } from '@/types'
import { calculateProgress, getLaunchReadinessLabel, getTaskCounts } from '@/lib/progress'
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
}

const statusOptions: { value: ProjectTaskStatus; label: string; icon: typeof Check; activeClass: string }[] = [
  { value: 'done', label: 'Done', icon: Check, activeClass: 'bg-[var(--color-success)]/15 text-[var(--color-success)] ring-[var(--color-success)]/30' },
  { value: 'not_needed', label: 'N/A', icon: Minus, activeClass: 'bg-black/5 dark:bg-white/10 text-[var(--color-muted-foreground)] ring-black/10' },
  { value: 'blocked', label: 'Blocked', icon: Ban, activeClass: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] ring-[var(--color-danger)]/30' },
  { value: 'pending', label: 'To Do', icon: AlertCircle, activeClass: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] ring-[var(--color-accent)]/30' },
]

export function ProjectTaskDesk({ project, onUpdateTask }: ProjectTaskDeskProps) {
  const [editingBlock, setEditingBlock] = useState<ProjectTaskKey | null>(null)
  const [blockDraft, setBlockDraft] = useState('')

  const progress = calculateProgress(project)
  const label = getLaunchReadinessLabel(progress)
  const counts = getTaskCounts(project)

  const handleStatus = (taskKey: ProjectTaskKey, status: ProjectTaskStatus) => {
    if (status === 'blocked') {
      setEditingBlock(taskKey)
      setBlockDraft(project.tasks[taskKey].blockedReason ?? '')
      onUpdateTask(taskKey, 'blocked', project.tasks[taskKey].blockedReason ?? '')
      return
    }
    setEditingBlock(null)
    onUpdateTask(taskKey, status)
  }

  const saveBlockReason = (taskKey: ProjectTaskKey) => {
    onUpdateTask(taskKey, 'blocked', blockDraft.trim() || 'Blocked')
    setEditingBlock(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <CardTitle>Launch Desk</CardTitle>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              Track what&apos;s done, blocked, or not needed before launch
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{progress}%</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
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
          const isBlocked = task.status === 'blocked'
          const isComplete = task.status === 'done' || task.status === 'not_needed'

          return (
            <li
              key={taskKey}
              className={cn(
                'rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 transition-colors duration-150',
                isBlocked && 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/[0.03]',
                isComplete && 'opacity-80'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <p
                  className={cn(
                    'flex-1 text-sm font-medium min-w-0',
                    task.status === 'done' && 'line-through text-[var(--color-muted-foreground)]',
                    task.status === 'not_needed' && 'line-through text-[var(--color-muted-foreground)]'
                  )}
                >
                  {PROJECT_TASK_LABELS[taskKey]}
                </p>

                <div className="flex flex-wrap gap-1.5 shrink-0">
                  {statusOptions.map(({ value, label: optLabel, icon: Icon, activeClass }) => {
                    const active = task.status === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleStatus(taskKey, value)}
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-transparent transition-[transform,background-color,color] duration-150 active:scale-[0.97]',
                          active ? activeClass : 'text-[var(--color-muted-foreground)] hover:bg-black/5 dark:hover:bg-white/5'
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {optLabel}
                      </button>
                    )
                  })}
                </div>
              </div>

              {isBlocked && task.blockedReason && editingBlock !== taskKey && (
                <p className="mt-2 text-xs text-[var(--color-danger)] flex items-start gap-1.5">
                  <Ban className="h-3 w-3 shrink-0 mt-0.5" />
                  {task.blockedReason}
                </p>
              )}

              {editingBlock === taskKey && (
                <div className="mt-3 flex gap-2">
                  <Input
                    placeholder="Why is this blocked?"
                    value={blockDraft}
                    onChange={(e) => setBlockDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveBlockReason(taskKey)}
                    autoFocus
                    className="text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => saveBlockReason(taskKey)}
                    className="shrink-0 text-xs font-medium text-[var(--color-accent)] px-2 active:scale-95"
                  >
                    Save
                  </button>
                </div>
              )}

              {task.status !== 'pending' && (
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
