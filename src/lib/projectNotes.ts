import type { Note, NoteSeverity, Project } from '@/types'

const SEVERITY_RANK: Record<NoteSeverity, number> = {
  urgent: 0,
  warning: 1,
  info: 2,
}

export function noteSeverity(note: Note): NoteSeverity {
  return note.severity ?? 'info'
}

/** Notes that surface on the Projects list: pinned and/or Warning / Urgent */
export function isListStickyNote(note: Note): boolean {
  const severity = noteSeverity(note)
  return Boolean(note.pinned) || severity === 'warning' || severity === 'urgent'
}

export function getProjectStickyNotes(project: Project): Note[] {
  return (project.notes ?? [])
    .filter(isListStickyNote)
    .slice()
    .sort((a, b) => {
      const sevDiff = SEVERITY_RANK[noteSeverity(a)] - SEVERITY_RANK[noteSeverity(b)]
      if (sevDiff !== 0) return sevDiff
      const pinDiff = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
      if (pinDiff !== 0) return pinDiff
      return b.createdAt.localeCompare(a.createdAt)
    })
}

export function getTopStickyNote(project: Project): Note | null {
  return getProjectStickyNotes(project)[0] ?? null
}

export interface StickyNoteEntry {
  project: Project
  note: Note
}

export function collectStickyNotes(projects: Project[]): StickyNoteEntry[] {
  const entries: StickyNoteEntry[] = []
  for (const project of projects) {
    for (const note of getProjectStickyNotes(project)) {
      entries.push({ project, note })
    }
  }
  return entries.sort((a, b) => {
    const sevDiff = SEVERITY_RANK[noteSeverity(a.note)] - SEVERITY_RANK[noteSeverity(b.note)]
    if (sevDiff !== 0) return sevDiff
    const pinDiff = Number(Boolean(b.note.pinned)) - Number(Boolean(a.note.pinned))
    if (pinDiff !== 0) return pinDiff
    return b.note.createdAt.localeCompare(a.note.createdAt)
  })
}
