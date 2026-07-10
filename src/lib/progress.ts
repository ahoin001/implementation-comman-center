import type { Project, ProjectTaskKey, ProjectTaskStatus } from '@/types'
import { PROJECT_TASK_KEYS, PROJECT_TASK_LABELS } from '@/types'

export function isTaskComplete(status: ProjectTaskStatus): boolean {
  return status === 'done' || status === 'not_needed'
}

export function calculateProgress(project: Project): number {
  const complete = PROJECT_TASK_KEYS.filter((k) => isTaskComplete(project.tasks[k].status)).length
  return Math.round((complete / PROJECT_TASK_KEYS.length) * 100)
}

export function getLaunchReadinessLabel(percent: number): string {
  if (percent === 100) return 'Ready to Launch'
  if (percent >= 80) return 'Ready Soon'
  if (percent >= 50) return 'In Progress'
  return 'Getting Started'
}

export function getTaskCounts(project: Project) {
  const counts = { pending: 0, done: 0, not_needed: 0, blocked: 0 }
  for (const key of PROJECT_TASK_KEYS) {
    counts[project.tasks[key].status]++
  }
  return counts
}

/** First actionable item for cards and dashboard */
export function getPrimaryOpenTask(project: Project): { key: ProjectTaskKey; label: string; status: ProjectTaskStatus; blockedReason?: string } | null {
  const blocked = PROJECT_TASK_KEYS.find((k) => project.tasks[k].status === 'blocked')
  if (blocked) {
    return {
      key: blocked,
      label: PROJECT_TASK_LABELS[blocked],
      status: 'blocked',
      blockedReason: project.tasks[blocked].blockedReason,
    }
  }

  const pending = PROJECT_TASK_KEYS.find((k) => project.tasks[k].status === 'pending')
  if (pending) {
    return { key: pending, label: PROJECT_TASK_LABELS[pending], status: 'pending' }
  }

  return null
}

export function getCurrentStageLabel(project: Project): string {
  const open = getPrimaryOpenTask(project)
  if (open) return open.label
  return 'All tasks complete'
}

export function isProjectLaunchComplete(project: Project): boolean {
  return PROJECT_TASK_KEYS.every((k) => isTaskComplete(project.tasks[k].status))
}
