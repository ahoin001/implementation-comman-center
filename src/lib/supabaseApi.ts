import type {
  Activity,
  AppSettings,
  CalendarEvent,
  CalendarEventType,
  Contact,
  Note,
  Project,
  ProjectLinks,
  ProjectTask,
  ProjectTaskKey,
  ProjectTaskStatus,
  WaitingOn,
} from '@/types'
import { PROJECT_TASK_LABELS } from '@/types'
import { generateId } from '@/lib/utils'
import { buildEventTitle, suggestAbbreviation } from '@/lib/calendar'
import { createDefaultTasks } from '@/lib/migrate'
import { icc, isSupabaseConfigured, SOLO_USER_ID, supabase } from '@/lib/supabase'
import {
  type DbActivity,
  type DbCalendarEvent,
  type DbImplementation,
  type DbNote,
  type DbTask,
  type DbUserSettings,
  implementationToRow,
  mapActivity,
  mapCalendarEvent,
  mapImplementation,
  mapSettings,
} from '@/lib/supabaseMappers'

function assertOk<T>(error: { message: string } | null, data: T, label: string): T {
  if (error) throw new Error(`${label}: ${error.message}`)
  return data
}

export async function fetchAllData(): Promise<{
  projects: Project[]
  activities: Activity[]
  calendarEvents: CalendarEvent[]
  settings: AppSettings
}> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  const [implRes, taskRes, noteRes, eventRes, activityRes, settingsRes] = await Promise.all([
    icc().from('implementations').select('*').order('updated_at', { ascending: false }),
    icc().from('implementation_tasks').select('*'),
    icc().from('notes').select('*').order('created_at', { ascending: false }),
    icc().from('calendar_events').select('*').order('event_date', { ascending: true }),
    icc().from('activities').select('*').order('created_at', { ascending: false }).limit(50),
    icc().from('user_settings').select('*').eq('user_id', SOLO_USER_ID).maybeSingle(),
  ])

  if (implRes.error) throw new Error(`implementations: ${implRes.error.message}`)
  if (taskRes.error) throw new Error(`tasks: ${taskRes.error.message}`)
  if (noteRes.error) throw new Error(`notes: ${noteRes.error.message}`)
  if (eventRes.error) throw new Error(`events: ${eventRes.error.message}`)
  if (activityRes.error) throw new Error(`activities: ${activityRes.error.message}`)
  if (settingsRes.error) throw new Error(`settings: ${settingsRes.error.message}`)

  const implementations = (implRes.data ?? []) as DbImplementation[]
  const tasks = (taskRes.data ?? []) as DbTask[]
  const notes = (noteRes.data ?? []) as DbNote[]
  const events = (eventRes.data ?? []) as DbCalendarEvent[]
  const activities = (activityRes.data ?? []) as DbActivity[]

  const projects = implementations.map((impl) =>
    mapImplementation(
      impl,
      tasks.filter((t) => t.implementation_id === impl.id),
      notes.filter((n) => n.implementation_id === impl.id)
    )
  )

  let settings = mapSettings((settingsRes.data as DbUserSettings | null) ?? null)

  // Ensure settings row exists for solo user
  if (!settingsRes.data) {
    await upsertSettings(settings)
  }

  return {
    projects,
    activities: activities.map(mapActivity),
    calendarEvents: events.map(mapCalendarEvent),
    settings,
  }
}

export async function insertImplementation(input: {
  id?: string
  name: string
  abbreviation?: string
  contactName?: string
  contactEmail?: string
  launchDate?: string
}): Promise<Project> {
  const id = input.id ?? generateId()
  const now = new Date().toISOString()
  const project: Project = {
    id,
    name: input.name,
    abbreviation: input.abbreviation?.trim() || suggestAbbreviation(input.name),
    launchDate: input.launchDate,
    tasks: createDefaultTasks(),
    waitingOn: 'none',
    outreachCount: 0,
    contact: { name: input.contactName ?? '', email: input.contactEmail ?? '' },
    links: {},
    notes: [],
    createdAt: now,
    updatedAt: now,
  }

  const { error } = await icc().from('implementations').insert(implementationToRow(project, SOLO_USER_ID))
  if (error) throw new Error(`create project: ${error.message}`)

  // Trigger seeds tasks; fetch them
  const { data: taskRows } = await icc()
    .from('implementation_tasks')
    .select('*')
    .eq('implementation_id', id)

  return mapImplementation(
    {
      ...implementationToRow(project, SOLO_USER_ID),
      created_at: now,
      updated_at: now,
    } as DbImplementation,
    (taskRows as DbTask[]) ?? []
  )
}

export async function insertImplementations(
  items: { name: string; abbreviation?: string }[]
): Promise<Project[]> {
  const created: Project[] = []
  for (const item of items.filter((i) => i.name.trim())) {
    created.push(
      await insertImplementation({
        name: item.name.trim(),
        abbreviation: item.abbreviation,
      })
    )
  }
  return created
}

export async function patchImplementation(
  id: string,
  updates: Partial<{
    name: string
    abbreviation: string
    launchDate: string | undefined
    waitingOn: WaitingOn
    outreachCount: number
    lastOutreachAt: string | undefined
    contact: Contact
    links: ProjectLinks
    archived: boolean
    archivedAt: string | undefined
  }>
): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.name !== undefined) row.name = updates.name
  if (updates.abbreviation !== undefined) row.abbreviation = updates.abbreviation
  if (updates.launchDate !== undefined) row.launch_date = updates.launchDate ?? null
  if (updates.waitingOn !== undefined) row.waiting_on = updates.waitingOn
  if (updates.outreachCount !== undefined) {
    row.outreach_count = updates.outreachCount
    if (updates.outreachCount === 0) {
      row.last_outreach_at = null
    } else if (updates.lastOutreachAt !== undefined) {
      row.last_outreach_at = updates.lastOutreachAt
    }
  } else if (updates.lastOutreachAt !== undefined) {
    row.last_outreach_at = updates.lastOutreachAt ?? null
  }
  if (updates.contact !== undefined) row.contact = updates.contact
  if (updates.links !== undefined) row.links = updates.links
  if (updates.archived !== undefined) row.archived = updates.archived
  if (updates.archivedAt !== undefined) row.archived_at = updates.archivedAt ?? null

  const { error } = await icc().from('implementations').update(row).eq('id', id)
  if (error) throw new Error(`update project: ${error.message}`)
}

export async function deleteImplementations(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await icc().from('implementations').delete().in('id', ids)
  if (error) throw new Error(`delete projects: ${error.message}`)
}

export async function upsertTask(
  implementationId: string,
  taskKey: ProjectTaskKey,
  status: ProjectTaskStatus,
  blockedReason?: string,
  substeps?: ProjectTask['substeps']
): Promise<void> {
  const row: Record<string, unknown> = {
    user_id: SOLO_USER_ID,
    implementation_id: implementationId,
    task_key: taskKey,
    status,
    blocked_reason:
      status === 'blocked' || status === 'pending' ? blockedReason?.trim() || null : null,
    completed_at: status === 'done' || status === 'not_needed' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }
  if (substeps !== undefined) {
    row.substeps = substeps ?? {}
  }
  const { error } = await icc()
    .from('implementation_tasks')
    .upsert(row, { onConflict: 'implementation_id,task_key' })
  if (error) throw new Error(`update task: ${error.message}`)
}

export async function insertNote(
  implementationId: string,
  content: string,
  options?: { pinned?: boolean; isMeetingSummary?: boolean }
): Promise<Note> {
  const id = generateId()
  const row = {
    id,
    user_id: SOLO_USER_ID,
    implementation_id: implementationId,
    content,
    pinned: options?.pinned ?? false,
    is_meeting_summary: options?.isMeetingSummary ?? false,
  }
  const { data, error } = await icc().from('notes').insert(row).select('*').single()
  assertOk(error, data, 'add note')
  return {
    id: data.id,
    content: data.content,
    createdAt: data.created_at,
    pinned: data.pinned,
    isMeetingSummary: data.is_meeting_summary,
  }
}

export async function insertActivity(input: {
  type: Activity['type']
  title: string
  projectId?: string
}): Promise<Activity> {
  const id = generateId()
  const { data, error } = await icc()
    .from('activities')
    .insert({
      id,
      user_id: SOLO_USER_ID,
      implementation_id: input.projectId ?? null,
      activity_type: input.type,
      title: input.title,
    })
    .select('*')
    .single()
  assertOk(error, data, 'add activity')
  return mapActivity(data as DbActivity)
}

export async function insertCalendarEvent(input: {
  projectId: string
  type: CalendarEventType
  date: string
  time?: string
  notes?: string
  title?: string
  project?: Pick<Project, 'abbreviation' | 'name'>
}): Promise<CalendarEvent> {
  const id = generateId()
  const title =
    input.title ??
    (input.project ? buildEventTitle(input.type, input.project) : PROJECT_TASK_LABELS.kickoff_call)
  const { data, error } = await icc()
    .from('calendar_events')
    .insert({
      id,
      user_id: SOLO_USER_ID,
      implementation_id: input.projectId,
      title,
      event_type: input.type,
      event_date: input.date,
      event_time: input.time ? `${input.time}:00` : null,
      notes: input.notes ?? null,
    })
    .select('*')
    .single()
  assertOk(error, data, 'add event')
  return mapCalendarEvent(data as DbCalendarEvent)
}

export async function patchCalendarEvent(
  id: string,
  updates: Partial<{
    projectId: string
    type: CalendarEventType
    date: string
    time?: string
    notes?: string
    title: string
  }>
): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.projectId !== undefined) row.implementation_id = updates.projectId
  if (updates.type !== undefined) row.event_type = updates.type
  if (updates.date !== undefined) row.event_date = updates.date
  if (updates.time !== undefined) row.event_time = updates.time ? `${updates.time}:00` : null
  if (updates.notes !== undefined) row.notes = updates.notes ?? null
  if (updates.title !== undefined) row.title = updates.title

  const { error } = await icc().from('calendar_events').update(row).eq('id', id)
  if (error) throw new Error(`update event: ${error.message}`)
}

export async function removeCalendarEvent(id: string): Promise<void> {
  const { error } = await icc().from('calendar_events').delete().eq('id', id)
  if (error) throw new Error(`delete event: ${error.message}`)
}

export async function upsertSettings(settings: AppSettings): Promise<void> {
  const { error } = await icc().from('user_settings').upsert({
    user_id: SOLO_USER_ID,
    user_name: settings.userName,
    theme: settings.theme,
    accent_color: settings.accentColor,
    reminder_window_days: settings.reminderWindowDays,
    notifications_enabled: settings.notificationsEnabled,
    salesforce_instance_url: settings.integrations.salesforceInstanceUrl,
    jira_instance_url: settings.integrations.jiraInstanceUrl,
    slack_workspace_url: settings.integrations.slackWorkspaceUrl,
    google_drive_folder_url: settings.integrations.googleDriveFolderUrl,
    updated_at: new Date().toISOString(),
  })
  if (error) throw new Error(`save settings: ${error.message}`)
}

export function subscribeRealtime(handlers: {
  onChange: () => void
}): () => void {
  if (!isSupabaseConfigured()) return () => undefined

  const channel = supabase
    .channel('icc-realtime')
    .on('postgres_changes', { event: '*', schema: 'app_implementation_center_v1', table: 'implementations' }, handlers.onChange)
    .on('postgres_changes', { event: '*', schema: 'app_implementation_center_v1', table: 'implementation_tasks' }, handlers.onChange)
    .on('postgres_changes', { event: '*', schema: 'app_implementation_center_v1', table: 'notes' }, handlers.onChange)
    .on('postgres_changes', { event: '*', schema: 'app_implementation_center_v1', table: 'calendar_events' }, handlers.onChange)
    .on('postgres_changes', { event: '*', schema: 'app_implementation_center_v1', table: 'activities' }, handlers.onChange)
    .on('postgres_changes', { event: '*', schema: 'app_implementation_center_v1', table: 'user_settings' }, handlers.onChange)
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
