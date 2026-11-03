import type { Project } from '@/types'
import { getMissingRequiredDocs, isRequiredDocsComplete } from '@/lib/deliverables'
import { calculateHealth } from '@/lib/health'
import { currentLaunchStage, launchBoardProgress } from '@/lib/launchTemplate'
import { needsSsoCredentials } from '@/lib/pathConfig'
import { getTopStickyNote, noteSeverity } from '@/lib/projectNotes'
import {
  calculateProgress,
  getCurrentStageLabel,
  getOpenFlexibleBadgeLabels,
  getPrimaryOpenTask,
  isLaunchFullyWrapped,
  isProjectLaunchComplete,
} from '@/lib/progress'

export type CardSignalTone = 'danger' | 'warning' | 'info' | 'calm'

export interface CardSignal {
  tone: CardSignalTone
  label: string
}

export type ProjectBand = 'attention' | 'active' | 'launched'

export interface ProjectGlance {
  progress: number
  launched: boolean
  wrapped: boolean
  stage: string
  signal: CardSignal
  band: ProjectBand
}

function oneLine(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

/** One status for a project card. Detail pages keep the full badge row. */
export function getCardSignal(project: Project): CardSignal {
  if (project.archived) return { tone: 'calm', label: 'Archived' }

  const open = getPrimaryOpenTask(project)
  if (open?.status === 'blocked') {
    return { tone: 'danger', label: `${open.label} blocked` }
  }

  const settled = calculateHealth(project) === 'complete'
  if (!settled && needsSsoCredentials(project)) {
    return { tone: 'warning', label: 'Missing credentials' }
  }
  if (!settled && !isRequiredDocsComplete(project)) {
    const missing = getMissingRequiredDocs(project)
    return {
      tone: 'danger',
      label: missing.length ? `Missing ${missing.join(' · ')}` : 'Missing docs',
    }
  }

  const sticky = getTopStickyNote(project)
  if (sticky) {
    const severity = noteSeverity(sticky)
    if (severity === 'urgent' || severity === 'warning') {
      return {
        tone: severity === 'urgent' ? 'danger' : 'warning',
        label: oneLine(sticky.content),
      }
    }
  }

  const followUp = getOpenFlexibleBadgeLabels(project)[0]
  if (followUp) return { tone: 'warning', label: followUp }
  if (open) return { tone: 'info', label: open.label }
  return { tone: 'calm', label: 'All set' }
}

export function getProjectGlance(project: Project): ProjectGlance {
  const board = project.launchTasks ?? []
  const progress = board.length ? launchBoardProgress(board) : calculateProgress(project)
  const launched = board.length
    ? board.some((task) => task.key === 'launch_career_center' && task.status === 'complete')
    : isProjectLaunchComplete(project)
  const wrapped = board.length ? progress === 100 : isLaunchFullyWrapped(project)
  const stage = board.length ? currentLaunchStage(board) : getCurrentStageLabel(project)
  const signal = getCardSignal(project)
  const band: ProjectBand =
    signal.tone === 'danger' || signal.tone === 'warning'
      ? 'attention'
      : launched
        ? 'launched'
        : 'active'

  return { progress, launched, wrapped, stage, signal, band }
}

const BANDS: { id: ProjectBand; label: string }[] = [
  { id: 'attention', label: 'Needs attention' },
  { id: 'active', label: 'In flight' },
  { id: 'launched', label: 'Launched' },
]

/** Keeps the incoming order, so in-progress-first still applies inside each band. */
export function groupProjects(projects: Project[]) {
  const buckets: Record<ProjectBand, Project[]> = {
    attention: [],
    active: [],
    launched: [],
  }
  for (const project of projects) {
    buckets[getProjectGlance(project).band].push(project)
  }
  return BANDS.filter((band) => buckets[band.id].length > 0).map((band) => ({
    id: band.id,
    label: band.label,
    projects: buckets[band.id],
  }))
}

export function projectListPath(archived: boolean, from?: string) {
  if (archived) return '/archive'
  if (from === '/my-projects') return '/my-projects'
  return '/projects'
}
