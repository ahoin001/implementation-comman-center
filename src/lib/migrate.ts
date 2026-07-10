import type {
  Project,
  ProjectTaskKey,
  ProjectTaskStatus,
  ProjectTasks,
  MilestoneKey,
} from '@/types'

type LegacyLaunchChecklist = {
  design: boolean
  import: boolean
  training: boolean
  qa: boolean
  launchChecklist: boolean
}
import { PROJECT_TASK_KEYS } from '@/types'
import { suggestAbbreviation } from '@/lib/calendar'

export function createDefaultTasks(overrides: Partial<Record<ProjectTaskKey, Partial<ProjectTasks[ProjectTaskKey]>>> = {}): ProjectTasks {
  return PROJECT_TASK_KEYS.reduce((acc, key) => {
    acc[key] = { status: 'pending', ...overrides[key] }
    return acc
  }, {} as ProjectTasks)
}

const MILESTONE_TO_TASK: Partial<Record<MilestoneKey, ProjectTaskKey>> = {
  design: 'site_design',
  import: 'data_import',
  kickoff: 'kickoff_call',
  training: 'smartway_training',
  launch: 'job_backfill',
}

const CHECKLIST_TO_TASK: Partial<Record<keyof LegacyLaunchChecklist, ProjectTaskKey>> = {
  design: 'site_design',
  import: 'data_import',
  training: 'smartway_training',
}

function milestoneToTaskStatus(status?: string): ProjectTaskStatus {
  if (status === 'completed') return 'done'
  if (status === 'blocked') return 'blocked'
  return 'pending'
}

/** Migrate legacy projects (milestones / launchChecklist / nextAction) to tasks model */
export function migrateProject(raw: Record<string, unknown>): Project {
  const p = raw as unknown as Project & {
    milestones?: Record<MilestoneKey, { status: string; completedAt?: string }>
    launchChecklist?: LegacyLaunchChecklist
    nextAction?: string
    tasks?: ProjectTasks
  }

  if (p.tasks && PROJECT_TASK_KEYS.every((k) => p.tasks![k])) {
    return {
      ...(p as Project),
      abbreviation: p.abbreviation?.trim() || suggestAbbreviation(p.name),
    }
  }

  const overrides: Partial<Record<ProjectTaskKey, Partial<ProjectTasks[ProjectTaskKey]>>> = {}

  if (p.milestones) {
    for (const [milestone, taskKey] of Object.entries(MILESTONE_TO_TASK) as [MilestoneKey, ProjectTaskKey][]) {
      const m = p.milestones[milestone]
      if (m) {
        overrides[taskKey] = {
          status: milestoneToTaskStatus(m.status),
          completedAt: m.completedAt,
        }
      }
    }
  }

  if (p.launchChecklist) {
    for (const [checkKey, taskKey] of Object.entries(CHECKLIST_TO_TASK) as [keyof LegacyLaunchChecklist, ProjectTaskKey][]) {
      if (p.launchChecklist[checkKey]) {
        overrides[taskKey] = { status: 'done', completedAt: overrides[taskKey]?.completedAt }
      }
    }
  }

  const {
    milestones: _m,
    launchChecklist: _l,
    nextAction: _n,
    emails: _e,
    ...rest
  } = p as Record<string, unknown> & typeof p

  return {
    ...(rest as Omit<Project, 'tasks' | 'abbreviation'>),
    abbreviation: (p.abbreviation as string | undefined)?.trim() || suggestAbbreviation(p.name),
    tasks: createDefaultTasks(overrides),
  }
}

export function migrateProjects(projects: unknown[]): Project[] {
  return projects.map((p) => migrateProject(p as Record<string, unknown>))
}
