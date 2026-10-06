import { differenceInDays, parseISO, isPast, isToday, isTomorrow, format } from 'date-fns'
import type { Project, ProjectHealth } from '@/types'
import { isClientWaiting } from '@/types'
import { launchBoardProgress } from './launchTemplate'
import { calculateProgress, isProjectLaunchComplete, getTaskCounts } from './progress'

function implementationProgress(project: Project): { progress: number; complete: boolean; useBoard: boolean } {
  const board = (project.launchTasks ?? []).filter((task) => !task.legacy)
  if (board.length > 0) {
    const progress = launchBoardProgress(board)
    return { progress, complete: progress === 100, useBoard: true }
  }
  return {
    progress: calculateProgress(project),
    complete: isProjectLaunchComplete(project),
    useBoard: false,
  }
}

export function getDaysRemaining(launchDate?: string): number | null {
  if (!launchDate) return null
  return differenceInDays(parseISO(launchDate), new Date())
}

export function formatLaunchDate(launchDate?: string): string {
  if (!launchDate) return 'No date set'
  const date = parseISO(launchDate)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'MMM d, yyyy')
}

export function formatRelativeDate(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEEE, MMM d')
}

export function calculateHealth(project: Project): ProjectHealth {
  const { progress, complete, useBoard } = implementationProgress(project)
  if (project.archived || complete) {
    return 'complete'
  }

  const daysRemaining = getDaysRemaining(project.launchDate)
  const { blocked } = getTaskCounts(project)

  if ((!useBoard && blocked > 0) || (daysRemaining !== null && daysRemaining < 0 && progress < 100)) {
    return 'at_risk'
  }

  if (daysRemaining !== null && daysRemaining <= 7 && progress < 80) {
    return 'at_risk'
  }

  const clientWaiting = isClientWaiting(project.waitingOn)
  if (clientWaiting) return 'waiting_on_client'

  const meWaiting = ['internal_dev', 'qa', 'scheduling'].includes(project.waitingOn)
  if (meWaiting) return 'waiting_on_me'

  if (project.waitingOn === 'ready' && daysRemaining !== null && daysRemaining <= 14) {
    return 'waiting_on_me'
  }

  return 'healthy'
}

export function isLaunchOverdue(project: Project): boolean {
  if (!project.launchDate) return false
  return isPast(parseISO(project.launchDate)) && !implementationProgress(project).complete
}
