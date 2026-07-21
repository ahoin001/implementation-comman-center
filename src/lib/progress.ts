import type { Project, ProjectTaskKey, ProjectTaskStatus } from '@/types'
import {
  LAUNCH_TASK_KEY,
  PRE_LAUNCH_TASK_KEYS,
  PROJECT_TASK_KEYS,
  PROJECT_TASK_LABELS,
} from '@/types'

export function isTaskComplete(status: ProjectTaskStatus): boolean {
  return status === 'done' || status === 'not_needed'
}

/** All Launch Desk items except Launch itself are Done or N/A */
export function arePreLaunchTasksComplete(project: Project): boolean {
  return PRE_LAUNCH_TASK_KEYS.every((key) => {
    const task = project.tasks[key]
    return task ? isTaskComplete(task.status) : false
  })
}

/** Launch can only be marked Done once every other task is Done or N/A */
export function canCompleteLaunch(project: Project): boolean {
  return arePreLaunchTasksComplete(project)
}

export function calculateProgress(project: Project): number {
  const complete = PROJECT_TASK_KEYS.filter((k) => {
    const task = project.tasks[k]
    return task ? isTaskComplete(task.status) : false
  }).length
  return Math.round((complete / PROJECT_TASK_KEYS.length) * 100)
}

export function getLaunchReadinessLabel(project: Project): string {
  if (isProjectLaunchComplete(project)) return 'Launched'
  if (arePreLaunchTasksComplete(project)) return 'Ready to Launch'
  const percent = calculateProgress(project)
  if (percent >= 80) return 'Ready Soon'
  if (percent >= 50) return 'In Progress'
  return 'Getting Started'
}

export function getTaskCounts(project: Project) {
  const counts = { pending: 0, done: 0, not_needed: 0, blocked: 0 }
  for (const key of PROJECT_TASK_KEYS) {
    const task = project.tasks[key]
    if (task) counts[task.status]++
  }
  return counts
}

/** First actionable item for cards and dashboard */
export function getPrimaryOpenTask(project: Project): {
  key: ProjectTaskKey
  label: string
  status: ProjectTaskStatus
  blockedReason?: string
} | null {
  const blocked = PROJECT_TASK_KEYS.find((k) => project.tasks[k]?.status === 'blocked')
  if (blocked) {
    return {
      key: blocked,
      label: PROJECT_TASK_LABELS[blocked],
      status: 'blocked',
      blockedReason: project.tasks[blocked].blockedReason,
    }
  }

  const pending = PROJECT_TASK_KEYS.find((k) => project.tasks[k]?.status === 'pending')
  if (pending) {
    return { key: pending, label: PROJECT_TASK_LABELS[pending], status: 'pending' }
  }

  return null
}

export function getCurrentStageLabel(project: Project): string {
  if (isProjectLaunchComplete(project)) return 'Launched'
  if (arePreLaunchTasksComplete(project)) return 'Ready to Launch'
  const open = getPrimaryOpenTask(project)
  if (open) return open.label
  return 'In Progress'
}

/** Fully launched — Launch step Done (requires all other tasks Done/N/A) */
export function isProjectLaunchComplete(project: Project): boolean {
  const launch = project.tasks[LAUNCH_TASK_KEY]
  return launch?.status === 'done' && arePreLaunchTasksComplete(project)
}
