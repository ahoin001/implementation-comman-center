import type { Project, ProjectTaskKey, ProjectTaskStatus } from '@/types'
import {
  FLEXIBLE_TASK_KEYS,
  LAUNCH_TASK_KEY,
  PRE_LAUNCH_TASK_KEYS,
  PROJECT_TASK_KEYS,
  PROJECT_TASK_LABELS,
} from '@/types'
import { isSsoEnabled } from '@/lib/pathConfig'

export function isTaskComplete(status: ProjectTaskStatus): boolean {
  return status === 'done' || status === 'not_needed'
}

export function isFlexibleTask(key: ProjectTaskKey): boolean {
  return FLEXIBLE_TASK_KEYS.includes(key)
}

/** Task keys that count toward overall progress (SSO skipped when disabled) */
export function getActiveTaskKeys(project: Project): ProjectTaskKey[] {
  return PROJECT_TASK_KEYS.filter((key) => {
    if (key === 'sso' && !isSsoEnabled(project)) return false
    return true
  })
}

/**
 * Tasks that must be Done/N/A before Launch Done unlocks.
 * Excludes SSO when off and flexible tasks (e.g. SmartWay Training).
 */
export function getActivePreLaunchKeys(project: Project): ProjectTaskKey[] {
  return PRE_LAUNCH_TASK_KEYS.filter((key) => {
    if (isFlexibleTask(key)) return false
    if (key === 'sso' && !isSsoEnabled(project)) return false
    return true
  })
}

function isTaskEffectivelyComplete(project: Project, key: ProjectTaskKey): boolean {
  if (key === 'sso' && !isSsoEnabled(project)) return true
  const task = project.tasks[key]
  return task ? isTaskComplete(task.status) : false
}

/** Launch-gating tasks complete (flexible tasks never block) */
export function arePreLaunchTasksComplete(project: Project): boolean {
  return getActivePreLaunchKeys(project).every((key) => isTaskEffectivelyComplete(project, key))
}

/** Launch can only be marked Done once launch-gating tasks are Done or N/A */
export function canCompleteLaunch(project: Project): boolean {
  return arePreLaunchTasksComplete(project)
}

export function calculateProgress(project: Project): number {
  const keys = getActiveTaskKeys(project)
  if (keys.length === 0) return 0
  const complete = keys.filter((k) => isTaskEffectivelyComplete(project, k)).length
  return Math.round((complete / keys.length) * 100)
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
  for (const key of getActiveTaskKeys(project)) {
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
  // Prefer launch-gating work over flexible training so cards stay go-live focused
  const keys = [
    ...getActivePreLaunchKeys(project),
    LAUNCH_TASK_KEY,
    ...FLEXIBLE_TASK_KEYS.filter((k) => !(k === 'sso' && !isSsoEnabled(project))),
  ]

  const blocked = keys.find((k) => project.tasks[k]?.status === 'blocked')
  if (blocked) {
    return {
      key: blocked,
      label: PROJECT_TASK_LABELS[blocked],
      status: 'blocked',
      blockedReason: project.tasks[blocked].blockedReason,
    }
  }

  const pending = keys.find((k) => {
    if (k === LAUNCH_TASK_KEY) {
      if (!canCompleteLaunch(project)) return false
      return project.tasks[k]?.status === 'pending'
    }
    return project.tasks[k]?.status === 'pending'
  })
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

/** Fully launched — Launch step Done (requires gating tasks Done/N/A; training optional) */
export function isProjectLaunchComplete(project: Project): boolean {
  const launch = project.tasks[LAUNCH_TASK_KEY]
  return launch?.status === 'done' && arePreLaunchTasksComplete(project)
}
