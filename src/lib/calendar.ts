import type { CalendarEvent, CalendarEventType, Project } from '@/types'
import { CALENDAR_EVENT_LABELS } from '@/types'

export function suggestAbbreviation(name: string): string {
  const skip = new Set(['association', 'society', 'federation', 'alliance', 'network', 'coalition', 'of', 'the', 'and'])
  const words = name.split(/\s+/).filter((w) => w.length > 0 && !skip.has(w.toLowerCase()))
  if (words.length >= 2) {
    return words
      .slice(0, 4)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
  }
  return name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'ORG'
}

export function getProjectLabel(project: Pick<Project, 'abbreviation' | 'name'>): string {
  return project.abbreviation?.trim() || project.name
}

export function buildEventTitle(type: CalendarEventType, project: Pick<Project, 'abbreviation' | 'name'>): string {
  return `${CALENDAR_EVENT_LABELS[type]} — ${getProjectLabel(project)}`
}

export function migrateCalendarEvent(event: CalendarEvent & { type?: string }): CalendarEvent {
  const rawType = event.type as string
  let type: CalendarEventType = 'adhoc'
  if (rawType === 'kickoff' || rawType === 'adhoc' || rawType === 'training') {
    type = rawType
  }
  return { ...event, type }
}

export function migrateCalendarEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events.map((e) => migrateCalendarEvent(e))
}
