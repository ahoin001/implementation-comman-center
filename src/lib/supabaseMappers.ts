import type {
  Activity,
  ActivityType,
  AppSettings,
  CalendarEvent,
  CalendarEventType,
  Contact,
  Note,
  NoteSeverity,
  MemberFeatureDefinition,
  Project,
  ProjectDeliverables,
  PathConfig,
  ProjectLinks,
  LaunchTask,
  Profile,
  ProjectTaskKey,
  ProjectTaskStatus,
  ProjectTasks,
  TaskComment,
  WaitingOn,
} from '@/types'
import { NOTE_SEVERITIES, PROJECT_TASK_KEYS, PROJECT_TASK_LABELS } from '@/types'
import { MAPPED_LEGACY_KEYS, type LaunchParty, type LaunchTaskStatus } from '@/lib/launchTemplate'
import { createDefaultTasks } from '@/lib/migrate'
import { normalizeDeliverables } from '@/lib/deliverables'
import { normalizePathConfig } from '@/lib/pathConfig'
import { normalizeMemberFeatures } from '@/lib/memberFeatures'
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
  deliverables: ProjectDeliverables | Record<string, unknown> | null
  path_config: PathConfig | Record<string, unknown> | null
  member_features: Record<string, boolean> | null
  archived: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export type DbMemberFeatureDefinition = {
  id: string
  user_id: string
  label: string
  sort_order: number
  created_at: string
}

export type DbTask = {
  id: string
  user_id: string
  implementation_id: string
  task_key: string
  status: string
  blocked_reason: string | null
  substeps: Record<string, boolean> | null
  completed_at: string | null
  phase_key: string | null
  group_key: string | null
  title: string | null
  description: string | null
  party: string | null
  due_date: string | null
  assignee_id: string | null
  sort_order: number | null
  created_at: string
  updated_at: string
}

export type DbComment = {
  id: string
  task_id: string
  user_id: string
  body: string
  created_at: string
}

export type DbProfile = {
  id: string
  display_name: string
}

export type DbNote = {
  id: string
  user_id: string
  implementation_id: string
  content: string
  pinned: boolean
  is_meeting_summary: boolean
  severity: string | null
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

const LEGACY_TASK_STATUSES: ProjectTaskStatus[] = ['pending', 'done', 'not_needed', 'blocked']

function isLegacyTaskStatus(status: string): status is ProjectTaskStatus {
  return (LEGACY_TASK_STATUSES as string[]).includes(status)
}

export function tasksFromRows(rows: DbTask[]): ProjectTasks {
  const tasks = createDefaultTasks()
  for (const row of rows) {
    if (!PROJECT_TASK_KEYS.includes(row.task_key as ProjectTaskKey)) continue
    if (!isLegacyTaskStatus(row.status)) continue
    tasks[row.task_key as ProjectTaskKey] = {
      status: row.status,
      blockedReason: row.blocked_reason ?? undefined,
      completedAt: row.completed_at ?? undefined,
    }
  }
  return tasks
}

function mapBoardStatus(status: string): LaunchTaskStatus {
  if (status === 'done' || status === 'complete') return 'complete'
  if (status === 'not_needed' || status === 'na') return 'na'
  if (status === 'blocked' || status === 'in_progress') return 'in_progress'
  if (status === 'as_needed') return 'as_needed'
  return 'not_started'
}

function isParty(value: string | null): value is LaunchParty {
  return value === 'client' || value === 'webscribble'
}

export function mapComment(row: DbComment): TaskComment {
  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    body: row.body,
    createdAt: row.created_at,
  }
}

export function mapProfile(row: DbProfile): Profile {
  return { id: row.id, displayName: row.display_name }
}

export function launchTasksFromRows(rows: DbTask[], comments: DbComment[] = []): LaunchTask[] {
  const byTask = new Map<string, TaskComment[]>()
  for (const row of comments) {
    const list = byTask.get(row.task_id) ?? []
    list.push(mapComment(row))
    byTask.set(row.task_id, list)
  }
  for (const list of byTask.values()) {
    list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  const board: LaunchTask[] = []
  for (const row of rows) {
    if (row.phase_key && row.group_key && row.title && isParty(row.party)) {
      board.push({
        id: row.id,
        key: row.task_key,
        phaseKey: row.phase_key,
        groupKey: row.group_key,
        title: row.title,
        description: row.description ?? '',
        party: row.party,
        status: mapBoardStatus(row.status),
        dueDate: row.due_date ?? undefined,
        assigneeId: row.assignee_id ?? undefined,
        sort: row.sort_order ?? 0,
        comments: byTask.get(row.id) ?? [],
      })
      continue
    }
    if (MAPPED_LEGACY_KEYS.has(row.task_key)) continue
    if (!PROJECT_TASK_KEYS.includes(row.task_key as ProjectTaskKey)) continue
    board.push({
      id: row.id,
      key: row.task_key,
      phaseKey: 'earlier',
      groupKey: 'earlier',
      title: PROJECT_TASK_LABELS[row.task_key as ProjectTaskKey] ?? row.task_key,
      description: row.blocked_reason ?? '',
      party: 'webscribble',
      status: mapBoardStatus(row.status),
      sort: 10000,
      legacy: true,
      comments: [],
    })
  }

  return board.sort((a, b) => a.sort - b.sort)
}

export function mapImplementation(
  row: DbImplementation,
  taskRows: DbTask[] = [],
  noteRows: DbNote[] = [],
  commentRows: DbComment[] = []
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
    deliverables: normalizeDeliverables(row.deliverables as ProjectDeliverables | null),
    pathConfig: normalizePathConfig(row.path_config as PathConfig | null),
    memberFeatures: normalizeMemberFeatures(row.member_features),
    tasks: tasksFromRows(taskRows),
    launchTasks: launchTasksFromRows(taskRows, commentRows),
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

function normalizeNoteSeverity(raw: string | null | undefined): NoteSeverity {
  if (raw && (NOTE_SEVERITIES as string[]).includes(raw)) return raw as NoteSeverity
  return 'info'
}

export function mapNote(row: DbNote): Note {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    pinned: row.pinned,
    isMeetingSummary: row.is_meeting_summary,
    severity: normalizeNoteSeverity(row.severity),
  }
}

export function mapMemberFeatureDefinition(row: DbMemberFeatureDefinition): MemberFeatureDefinition {
  return {
    id: row.id,
    label: row.label,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
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
    deliverables: project.deliverables,
    path_config: project.pathConfig,
    member_features: project.memberFeatures ?? {},
    archived: Boolean(project.archived),
    archived_at: project.archivedAt ?? null,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  }
}
