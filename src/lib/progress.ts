import type { Project, ProjectTaskKey, ProjectTaskStatus } from '@/types'
import {
  FLEXIBLE_TASK_KEYS,
  LAUNCH_TASK_KEY,
  POST_LAUNCH_TASK_KEYS,
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

export function isPostLaunchTask(key: ProjectTaskKey): boolean {
  return POST_LAUNCH_TASK_KEYS.includes(key)
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
 * Excludes SSO when off, flexible tasks, and post-launch steps.
 */
export function getActivePreLaunchKeys(project: Project): ProjectTaskKey[] {
  return PRE_LAUNCH_TASK_KEYS.filter((key) => {
    if (key === 'sso' && !isSsoEnabled(project)) return false
    return true
  })
}

function isTaskEffectivelyComplete(project: Project, key: ProjectTaskKey): boolean {
  if (key === 'sso' && !isSsoEnabled(project)) return true
  const task = project.tasks[key]
  return task ? isTaskComplete(task.status) : false
}

/** Launch-gating tasks complete (flexible / post-launch never block) */
export function arePreLaunchTasksComplete(project: Project): boolean {
  return getActivePreLaunchKeys(project).every((key) => isTaskEffectivelyComplete(project, key))
}

/** Launch can only be marked Done once launch-gating tasks are Done or N/A */
export function canCompleteLaunch(project: Project): boolean {
  return arePreLaunchTasksComplete(project)
}

/** Post-launch steps unlock after Launch is Done */
export function canCompletePostLaunchTask(project: Project): boolean {
  return project.tasks[LAUNCH_TASK_KEY]?.status === 'done'
}

export function calculateProgress(project: Project): number {
  const keys = getActiveTaskKeys(project)
  if (keys.length === 0) return 0
  const complete = keys.filter((k) => isTaskEffectivelyComplete(project, k)).length
  return Math.round((complete / keys.length) * 100)
}

export type OpenWorkTask = {
  key: ProjectTaskKey
  label: string
  status: ProjectTaskStatus
  blockedReason?: string
}

/**
 * Flexible tasks still open — required client work that does not gate Launch.
 * e.g. SmartWay Training before or after go-live.
 */
export function getOpenFlexibleTasks(project: Project): OpenWorkTask[] {
  return FLEXIBLE_TASK_KEYS.flatMap((key) => {
    const task = project.tasks[key]
    if (!task || isTaskComplete(task.status)) return []
    return [
      {
        key,
        label: PROJECT_TASK_LABELS[key],
        status: task.status,
        blockedReason: task.blockedReason,
      },
    ]
  })
}

export function hasOpenFlexibleTasks(project: Project): boolean {
  return getOpenFlexibleTasks(project).length > 0
}

/** Site is live but SmartWay Training is still open — high-visibility portfolio bucket */
export function isLaunchedWithoutTraining(project: Project): boolean {
  if (!isProjectLaunchComplete(project)) return false
  const training = project.tasks.smartway_training
  return !training || !isTaskComplete(training.status)
}

/** Post-launch go-live follow-ups still open (e.g. Salesforce Sync) */
export function getOpenPostLaunchTasks(project: Project): OpenWorkTask[] {
  return POST_LAUNCH_TASK_KEYS.flatMap((key) => {
    const task = project.tasks[key]
    if (!task || isTaskComplete(task.status)) return []
    return [
      {
        key,
        label: PROJECT_TASK_LABELS[key],
        status: task.status,
        blockedReason: task.blockedReason,
      },
    ]
  })
}

export function hasOpenPostLaunchTasks(project: Project): boolean {
  return getOpenPostLaunchTasks(project).length > 0
}

/** Short badge labels for open flexible work */
export function getOpenFlexibleBadgeLabels(project: Project): string[] {
  return getOpenFlexibleTasks(project).map((t) => {
    if (t.key === 'smartway_training') {
      return t.status === 'blocked' ? 'Training blocked' : 'Needs training'
    }
    if (t.key === 'pricing_plan') {
      return t.status === 'blocked' ? 'Pricing blocked' : 'Needs pricing plan'
    }
    return t.status === 'blocked' ? `${t.label} blocked` : t.label
  })
}

/** Launch Done + no open post-launch or flexible follow-up */
export function isLaunchFullyWrapped(project: Project): boolean {
  return (
    isProjectLaunchComplete(project) &&
    !hasOpenPostLaunchTasks(project) &&
    !hasOpenFlexibleTasks(project)
  )
}

export function getLaunchReadinessLabel(project: Project): string {
  if (isProjectLaunchComplete(project)) {
    const post = getOpenPostLaunchTasks(project)[0]
    if (post) return `Launched · ${post.label}`
    if (hasOpenFlexibleTasks(project)) {
      const training = getOpenFlexibleTasks(project).find((t) => t.key === 'smartway_training')
      if (training) return 'Launched · Needs training'
      return 'Launched · Follow-up open'
    }
    return 'Launched'
  }
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
  // Prefer launch-gating → Launch → post-launch → flexible training
  const keys = [
    ...getActivePreLaunchKeys(project),
    LAUNCH_TASK_KEY,
    ...POST_LAUNCH_TASK_KEYS,
    ...FLEXIBLE_TASK_KEYS,
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
    if (isPostLaunchTask(k)) {
      // Only surface once Launch is Done so queue stays sequential
      if (!canCompletePostLaunchTask(project)) return false
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
  if (isProjectLaunchComplete(project)) {
    const post = getOpenPostLaunchTasks(project)[0]
    if (post) return `Launched · ${post.label}`
    if (hasOpenFlexibleTasks(project)) {
      const open = getOpenFlexibleTasks(project)[0]
      return open ? `Launched · ${open.label}` : 'Launched · Follow-up open'
    }
    return 'Launched'
  }
  if (arePreLaunchTasksComplete(project)) return 'Ready to Launch'
  const open = getPrimaryOpenTask(project)
  if (open) return open.label
  return 'In Progress'
}

/** Fully launched — Launch step Done (requires gating tasks Done/N/A; post-launch flexible) */
export function isProjectLaunchComplete(project: Project): boolean {
  const launch = project.tasks[LAUNCH_TASK_KEY]
  return launch?.status === 'done' && arePreLaunchTasksComplete(project)
}
