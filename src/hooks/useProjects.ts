import { useMemo } from 'react'
import type { Project, ProjectFilter, ProjectTaskKey } from '@/types'
import { PROJECT_TASK_KEYS, PROJECT_TASK_LABELS } from '@/types'
import { calculateHealth, getDaysRemaining } from '@/lib/health'
import { isRequiredDocsComplete } from '@/lib/deliverables'
import {
  getPrimaryOpenTask,
  isProjectLaunchComplete,
  isTaskComplete,
} from '@/lib/progress'
import { useStore } from '@/store/useStore'

export function useActiveProjects(): Project[] {
  const projects = useStore((s) => s.projects)
  return useMemo(() => projects.filter((p) => !p.archived), [projects])
}

export function useArchivedProjects(): Project[] {
  const projects = useStore((s) => s.projects)
  return useMemo(() => projects.filter((p) => p.archived), [projects])
}

/** Task still needs work (not Done / N/A) */
export function taskNeedsWork(project: Project, key: ProjectTaskKey): boolean {
  return !isTaskComplete(project.tasks[key].status)
}

/** Pending or blocked task that has a note attached */
export function hasTaskNotes(project: Project): boolean {
  return PROJECT_TASK_KEYS.some((key) => {
    const task = project.tasks[key]
    return (
      (task.status === 'pending' || task.status === 'blocked') &&
      Boolean(task.blockedReason?.trim())
    )
  })
}

export function filterProjects(projects: Project[], filter: ProjectFilter): Project[] {
  switch (filter) {
    case 'launching_soon':
      return projects.filter((p) => {
        const days = getDaysRemaining(p.launchDate)
        return days !== null && days >= 0 && days <= 14
      })
    case 'needs_attention':
      return projects.filter(hasTaskNotes)
    case 'waiting_on_client':
      return projects.filter((p) => calculateHealth(p) === 'waiting_on_client')
    case 'completed':
      return projects.filter((p) => calculateHealth(p) === 'complete')
    case 'no_launch_date':
      return projects.filter((p) => !p.launchDate)
    case 'missing_required_docs':
      return projects.filter((p) => !isRequiredDocsComplete(p) && calculateHealth(p) !== 'complete')
    case 'needs_site_design':
      return projects.filter((p) => taskNeedsWork(p, 'site_design'))
    case 'needs_kickoff_call':
      return projects.filter((p) => taskNeedsWork(p, 'kickoff_call'))
    case 'needs_follow_up_email':
      return projects.filter((p) => taskNeedsWork(p, 'follow_up_email'))
    case 'needs_data_import':
      return projects.filter((p) => taskNeedsWork(p, 'data_import'))
    case 'needs_sso':
      return projects.filter((p) => taskNeedsWork(p, 'sso'))
    case 'needs_smartway_training':
      return projects.filter((p) => taskNeedsWork(p, 'smartway_training'))
    case 'needs_schedule':
      return projects.filter(
        (p) => taskNeedsWork(p, 'kickoff_call') || taskNeedsWork(p, 'smartway_training')
      )
    default:
      return projects
  }
}

function projectMatchesSearch(p: Project, q: string): boolean {
  if (
    p.name.toLowerCase().includes(q) ||
    p.abbreviation?.toLowerCase().includes(q) ||
    p.contact.name.toLowerCase().includes(q) ||
    p.contact.email.toLowerCase().includes(q) ||
    p.notes.some((n) => n.content.toLowerCase().includes(q)) ||
    p.links.salesforce?.toLowerCase().includes(q) ||
    p.links.jira?.toLowerCase().includes(q)
  ) {
    return true
  }

  const openTask = getPrimaryOpenTask(p)
  if (openTask?.label.toLowerCase().includes(q)) return true

  return Object.entries(p.tasks).some(([key, task]) => {
    const label = PROJECT_TASK_LABELS[key as ProjectTaskKey].toLowerCase()
    return label.includes(q) || task.blockedReason?.toLowerCase().includes(q)
  })
}

export function searchProjects(projects: Project[], query: string): Project[] {
  if (!query.trim()) return projects
  const q = query.toLowerCase()
  return projects.filter((p) => projectMatchesSearch(p, q))
}

/** Completed projects last, then alphabetical by name */
export function sortProjects(
  projects: Project[],
  options: { inProgressFirst?: boolean } = {}
): Project[] {
  const { inProgressFirst = true } = options
  return [...projects].sort((a, b) => {
    if (inProgressFirst) {
      const aDone = calculateHealth(a) === 'complete' ? 1 : 0
      const bDone = calculateHealth(b) === 'complete' ? 1 : 0
      if (aDone !== bDone) return aDone - bDone
    }
    const byName = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    if (byName !== 0) return byName
    return (a.abbreviation || '').localeCompare(b.abbreviation || '', undefined, {
      sensitivity: 'base',
    })
  })
}

export function useFilteredProjects(options: { inProgressFirst?: boolean } = {}): Project[] {
  const projects = useActiveProjects()
  const filter = useStore((s) => s.activeFilter)
  const query = useStore((s) => s.searchQuery)
  const inProgressFirst = options.inProgressFirst ?? true
  return useMemo(
    () => sortProjects(searchProjects(filterProjects(projects, filter), query), { inProgressFirst }),
    [projects, filter, query, inProgressFirst]
  )
}

export function useDashboardStats() {
  const projects = useActiveProjects()
  return useMemo(() => {
    const launchesThisWeek = projects.filter((p) => {
      const days = getDaysRemaining(p.launchDate)
      return days !== null && days >= 0 && days <= 7
    }).length

    const waitingOnClient = projects.filter((p) => calculateHealth(p) === 'waiting_on_client').length
    const needsAttention = projects.filter(hasTaskNotes).length

    return {
      activeProjects: projects.length,
      launchesThisWeek,
      waitingOnClient,
      needsAttention,
    }
  }, [projects])
}

export function useMyDayActions() {
  const projects = useActiveProjects()
  return useMemo(() => {
    const priority = projects
      .filter((p) => !isProjectLaunchComplete(p))
      .map((p) => ({ project: p, task: getPrimaryOpenTask(p) }))
      .filter((item) => item.task !== null)
      .sort((a, b) => {
        const healthOrder = { at_risk: 0, waiting_on_me: 1, healthy: 2, waiting_on_client: 3, complete: 4 }
        const ha = calculateHealth(a.project)
        const hb = calculateHealth(b.project)
        const diff = healthOrder[ha] - healthOrder[hb]
        if (diff !== 0) return diff
        if (a.task!.status === 'blocked' && b.task!.status !== 'blocked') return -1
        if (b.task!.status === 'blocked' && a.task!.status !== 'blocked') return 1
        const da = getDaysRemaining(a.project.launchDate) ?? 999
        const db = getDaysRemaining(b.project.launchDate) ?? 999
        return da - db
      })
      .slice(0, 6)

    return priority.map(({ project, task }) => ({
      projectId: project.id,
      projectName: project.name,
      action: task!.status === 'blocked' ? `${task!.label} (blocked)` : task!.label,
      health: calculateHealth(project),
    }))
  }, [projects])
}
