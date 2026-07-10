import type {
  Activity,
  ActivityType,
  AppSettings,
  CalendarEvent,
  CalendarEventType,
  Contact,
  Note,
  Project,
  ProjectLinks,
  ProjectTaskKey,
  ProjectTaskStatus,
  ProjectTasks,
  WaitingOn,
} from '@/types'
import { PROJECT_TASK_KEYS } from '@/types'
import { createDefaultTasks } from '@/lib/migrate'
import { defaultIntegrations, defaultSettings } from '@/store/seedData'

export type DbImplementation = {
  id: string
  user_id: string
  name: string
  abbreviation: string
  logo_url: string | null
  launch_date: string | null
  waiting_on: WaitingOn
  outreach_count: number
  last_outreach_at: string | null
  contact: Contact
  links: ProjectLinks
  archived: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type DbTask = {
  id: string
  user_id: string
  implementation_id: string
  task_key: ProjectTaskKey
  status: ProjectTaskStatus
  blocked_reason: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type DbNote = {
  id: string
  user_id: string
  implementation_id: string
  content: string
  pinned: boolean
  is_meeting_summary: boolean
  created_at: string
}

export type DbCalendarEvent = {
  id: string
  user_id: string
  implementation_id: string
  title: string
  event_type: CalendarEventType
  event_date: string
  event_time: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type DbActivity = {
  id: string
  user_id: string
  implementation_id: string | null
  activity_type: ActivityType
  title: string
  created_at: string
}

export type DbUserSettings = {
  user_id: string
  user_name: string
  theme: AppSettings['theme']
  accent_color: string
  reminder_window_days: number
  notifications_enabled: boolean
  salesforce_instance_url: string
  jira_instance_url: string
  slack_workspace_url: string
  google_drive_folder_url: string
  created_at: string
  updated_at: string
}

export function tasksFromRows(rows: DbTask[]): ProjectTasks {
  const tasks = createDefaultTasks()
  for (const row of rows) {
    if (!PROJECT_TASK_KEYS.includes(row.task_key)) continue
    tasks[row.task_key] = {
      status: row.status,
      blockedReason: row.blocked_reason ?? undefined,
      completedAt: row.completed_at ?? undefined,
    }
  }
  return tasks
}

export function mapImplementation(
  row: DbImplementation,
  taskRows: DbTask[] = [],
  noteRows: DbNote[] = []
): Project {
  return {
    id: row.id,
    name: row.name,
    abbreviation: row.abbreviation || '',
    logoUrl: row.logo_url ?? undefined,
    launchDate: row.launch_date ?? undefined,
    waitingOn: row.waiting_on,
    outreachCount: row.outreach_count ?? 0,
    lastOutreachAt: row.last_outreach_at ?? undefined,
    contact: {
      name: row.contact?.name ?? '',
      email: row.contact?.email ?? '',
      phone: row.contact?.phone,
      timezone: row.contact?.timezone,
      notes: row.contact?.notes,
    },
    links: row.links ?? {},
    tasks: tasksFromRows(taskRows),
    notes: noteRows
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(mapNote),
    archived: row.archived,
    archivedAt: row.archived_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapNote(row: DbNote): Note {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    pinned: row.pinned,
    isMeetingSummary: row.is_meeting_summary,
  }
}

export function mapCalendarEvent(row: DbCalendarEvent): CalendarEvent {
  return {
    id: row.id,
    projectId: row.implementation_id,
    title: row.title,
    type: row.event_type,
    date: row.event_date,
    time: row.event_time ? row.event_time.slice(0, 5) : undefined,
    notes: row.notes ?? undefined,
  }
}

export function mapActivity(row: DbActivity): Activity {
  return {
    id: row.id,
    type: row.activity_type,
    title: row.title,
    createdAt: row.created_at,
    projectId: row.implementation_id ?? undefined,
  }
}

export function mapSettings(row: DbUserSettings | null): AppSettings {
  if (!row) return { ...defaultSettings, integrations: { ...defaultIntegrations } }
  return {
    userName: row.user_name,
    theme: row.theme,
    accentColor: row.accent_color,
    reminderWindowDays: row.reminder_window_days,
    notificationsEnabled: row.notifications_enabled,
    integrations: {
      salesforceInstanceUrl: row.salesforce_instance_url,
      salesforceApiKey: '',
      jiraInstanceUrl: row.jira_instance_url,
      jiraApiKey: '',
      slackWorkspaceUrl: row.slack_workspace_url,
      googleDriveFolderUrl: row.google_drive_folder_url,
    },
  }
}

export function implementationToRow(
  project: Project,
  userId: string
): Omit<DbImplementation, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string } {
  return {
    id: project.id,
    user_id: userId,
    name: project.name,
    abbreviation: project.abbreviation,
    logo_url: project.logoUrl ?? null,
    launch_date: project.launchDate ?? null,
    waiting_on: project.waitingOn,
    outreach_count: project.outreachCount ?? 0,
    last_outreach_at: project.lastOutreachAt ?? null,
    contact: project.contact,
    links: project.links,
    archived: Boolean(project.archived),
    archived_at: project.archivedAt ?? null,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  }
}
