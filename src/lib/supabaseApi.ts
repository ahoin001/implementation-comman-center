import type {
  Activity,
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
  Profile,
  ProjectTaskKey,
  ProjectTaskStatus,
  TaskComment,
  WaitingOn,
} from '@/types'
import type { LaunchTaskStatus } from '@/lib/launchTemplate'
import { PROJECT_TASK_LABELS } from '@/types'
import { generateId } from '@/lib/utils'
import { buildEventTitle, suggestAbbreviation } from '@/lib/calendar'
import { createDefaultTasks } from '@/lib/migrate'
import { createDefaultDeliverables } from '@/lib/deliverables'
import { createDefaultPathConfig } from '@/lib/pathConfig'
import { icc, isSupabaseConfigured, supabase } from '@/lib/supabase'
import { getActorId } from '@/lib/session'
import {
  type DbActivity,
  type DbCalendarEvent,
  type DbComment,
  type DbImplementation,
  type DbMemberFeatureDefinition,
  type DbNote,
  type DbProfile,
  type DbTask,
  type DbUserSettings,
  implementationToRow,
  mapActivity,
  mapCalendarEvent,
  mapComment,
  mapImplementation,
  mapMemberFeatureDefinition,
  mapProfile,
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
  memberFeatureDefinitions: MemberFeatureDefinition[]
  profiles: Profile[]
  favoriteIds: string[]
}> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured')
  }

  const actorId = getActorId()
  const [implRes, taskRes, noteRes, eventRes, activityRes, settingsRes, featureRes, profileRes, favoriteRes, commentRes] =
    await Promise.all([
      icc().from('implementations').select('*').order('updated_at', { ascending: false }),
      icc().from('implementation_tasks').select('*'),
      icc().from('notes').select('*').order('created_at', { ascending: false }),
      icc().from('calendar_events').select('*').order('event_date', { ascending: true }),
      icc().from('activities').select('*').order('created_at', { ascending: false }).limit(50),
      icc().from('user_settings').select('*').eq('user_id', actorId).maybeSingle(),
      icc()
        .from('member_feature_definitions')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      icc().from('profiles').select('id, display_name').order('display_name', { ascending: true }),
      icc().from('implementation_favorites').select('implementation_id'),
      icc().from('task_comments').select('*').order('created_at', { ascending: true }),
    ])

  if (implRes.error) throw new Error(`implementations: ${implRes.error.message}`)
  if (taskRes.error) throw new Error(`tasks: ${taskRes.error.message}`)
  if (noteRes.error) throw new Error(`notes: ${noteRes.error.message}`)
  if (eventRes.error) throw new Error(`events: ${eventRes.error.message}`)
  if (activityRes.error) throw new Error(`activities: ${activityRes.error.message}`)
  if (settingsRes.error) throw new Error(`settings: ${settingsRes.error.message}`)
  if (featureRes.error) throw new Error(`member features: ${featureRes.error.message}`)
  if (profileRes.error) throw new Error(`profiles: ${profileRes.error.message}`)
  if (favoriteRes.error) throw new Error(`favorites: ${favoriteRes.error.message}`)
  if (commentRes.error) throw new Error(`comments: ${commentRes.error.message}`)

  const implementations = (implRes.data ?? []) as DbImplementation[]
  const tasks = (taskRes.data ?? []) as DbTask[]
  const notes = (noteRes.data ?? []) as DbNote[]
  const comments = (commentRes.data ?? []) as DbComment[]
  const events = (eventRes.data ?? []) as DbCalendarEvent[]
  const activities = (activityRes.data ?? []) as DbActivity[]
  const featureDefs = (featureRes.data ?? []) as DbMemberFeatureDefinition[]

  const taskImplementation = new Map(tasks.map((task) => [task.id, task.implementation_id]))
  const commentsByImplementation = new Map<string, DbComment[]>()
  for (const comment of comments) {
    const implementationId = taskImplementation.get(comment.task_id)
    if (!implementationId) continue
    const list = commentsByImplementation.get(implementationId) ?? []
    list.push(comment)
    commentsByImplementation.set(implementationId, list)
  }

  const projects = implementations.map((impl) =>
    mapImplementation(
      impl,
      tasks.filter((t) => t.implementation_id === impl.id),
      notes.filter((n) => n.implementation_id === impl.id),
      commentsByImplementation.get(impl.id) ?? []
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
    memberFeatureDefinitions: featureDefs.map(mapMemberFeatureDefinition),
    profiles: ((profileRes.data ?? []) as DbProfile[]).map(mapProfile),
    favoriteIds: ((favoriteRes.data ?? []) as { implementation_id: string }[]).map(
      (row) => row.implementation_id
    ),
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
    deliverables: createDefaultDeliverables(),
    pathConfig: createDefaultPathConfig(),
    memberFeatures: {},
    waitingOn: 'none',
    outreachCount: 0,
    contact: { name: input.contactName ?? '', email: input.contactEmail ?? '' },
    links: {},
    notes: [],
    createdAt: now,
    updatedAt: now,
  }

  const { error } = await icc().from('implementations').insert(implementationToRow(project, getActorId()))
  if (error) throw new Error(`create project: ${error.message}`)

  // Trigger seeds tasks; fetch them
  const { data: taskRows } = await icc()
    .from('implementation_tasks')
    .select('*')
    .eq('implementation_id', id)

  return mapImplementation(
    {
      ...implementationToRow(project, getActorId()),
      created_at: now,
      updated_at: now,
    } as DbImplementation,
    (taskRows as DbTask[]) ?? []
  )
}

export async function insertImplementationFromChecklist(input: {
  name: string
  abbreviation?: string
  contactName?: string
  contactEmail?: string
  launchDate?: string
  tasks: { taskKey: string; status: LaunchTaskStatus; note?: string; dueDate?: string }[]
  leftoverNote?: string
}): Promise<Project> {
  const project = await insertImplementation(input)
  const byKey = new Map((project.launchTasks ?? []).map((task) => [task.key, task]))

  await Promise.all(
    input.tasks.map(async (item) => {
      const task = byKey.get(item.taskKey)
      if (!task) return
      await patchLaunchTask(task.id, {
        status: item.status,
        ...(item.dueDate ? { dueDate: item.dueDate } : {}),
      })
      if (item.note?.trim()) await insertTaskComment(task.id, item.note.trim())
    })
  )

  if (input.leftoverNote?.trim()) {
    await insertNote(project.id, input.leftoverNote.trim())
  }

  const [implRes, taskRes, noteRes, commentRes] = await Promise.all([
    icc().from('implementations').select('*').eq('id', project.id).single(),
    icc().from('implementation_tasks').select('*').eq('implementation_id', project.id),
    icc().from('notes').select('*').eq('implementation_id', project.id),
    icc().from('task_comments').select('*'),
  ])
  if (implRes.error || !implRes.data) throw new Error(`load project: ${implRes.error?.message ?? 'missing'}`)
  if (taskRes.error) throw new Error(`load tasks: ${taskRes.error.message}`)

  const taskIds = new Set(((taskRes.data ?? []) as DbTask[]).map((task) => task.id))
  const comments = ((commentRes.data ?? []) as DbComment[]).filter((comment) => taskIds.has(comment.task_id))

  return mapImplementation(
    implRes.data as DbImplementation,
    (taskRes.data ?? []) as DbTask[],
    (noteRes.data ?? []) as DbNote[],
    comments
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
    deliverables: ProjectDeliverables
    pathConfig: PathConfig
    memberFeatures: Record<string, boolean>
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
  if (updates.deliverables !== undefined) row.deliverables = updates.deliverables
  if (updates.pathConfig !== undefined) row.path_config = updates.pathConfig
  if (updates.memberFeatures !== undefined) row.member_features = updates.memberFeatures
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
  blockedReason?: string
): Promise<void> {
  const row: Record<string, unknown> = {
    user_id: getActorId(),
    implementation_id: implementationId,
    task_key: taskKey,
    status,
    blocked_reason:
      status === 'blocked' || status === 'pending' ? blockedReason?.trim() || null : null,
    completed_at: status === 'done' || status === 'not_needed' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }
  const { error } = await icc()
    .from('implementation_tasks')
    .upsert(row, { onConflict: 'implementation_id,task_key' })
  if (error) throw new Error(`update task: ${error.message}`)
}

export async function patchLaunchTask(
  taskId: string,
  patch: {
    status?: LaunchTaskStatus
    dueDate?: string | null
    assigneeId?: string | null
    description?: string
  }
): Promise<void> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.status !== undefined) {
    row.status = patch.status
    row.completed_at = patch.status === 'complete' ? new Date().toISOString() : null
  }
  if (patch.dueDate !== undefined) row.due_date = patch.dueDate
  if (patch.assigneeId !== undefined) row.assignee_id = patch.assigneeId
  if (patch.description !== undefined) row.description = patch.description
  const { error } = await icc().from('implementation_tasks').update(row).eq('id', taskId)
  if (error) throw new Error(`update launch task: ${error.message}`)
}

export async function insertTaskComment(taskId: string, body: string): Promise<TaskComment> {
  const id = generateId()
  const { data, error } = await icc()
    .from('task_comments')
    .insert({
      id,
      task_id: taskId,
      user_id: getActorId(),
      body,
    })
    .select('*')
    .single()
  assertOk(error, data, 'add comment')
  return mapComment(data as DbComment)
}

export async function setFavorite(implementationId: string, favorite: boolean): Promise<void> {
  if (favorite) {
    const { error } = await icc().from('implementation_favorites').upsert({
      user_id: getActorId(),
      implementation_id: implementationId,
    })
    if (error) throw new Error(`save favorite: ${error.message}`)
    return
  }
  const { error } = await icc()
    .from('implementation_favorites')
    .delete()
    .eq('user_id', getActorId())
    .eq('implementation_id', implementationId)
  if (error) throw new Error(`remove favorite: ${error.message}`)
}

export async function insertNote(
  implementationId: string,
  content: string,
  options?: { pinned?: boolean; isMeetingSummary?: boolean; severity?: NoteSeverity }
): Promise<Note> {
  const id = generateId()
  const severity = options?.severity ?? 'info'
  const row = {
    id,
    user_id: getActorId(),
    implementation_id: implementationId,
    content,
    pinned: options?.pinned ?? false,
    is_meeting_summary: options?.isMeetingSummary ?? false,
    severity,
  }
  const { data, error } = await icc().from('notes').insert(row).select('*').single()
  assertOk(error, data, 'add note')
  return {
    id: data.id,
    content: data.content,
    createdAt: data.created_at,
    authorId: data.user_id,
    pinned: data.pinned,
    isMeetingSummary: data.is_meeting_summary,
    severity: (data.severity as NoteSeverity) || 'info',
  }
}

export async function updateNote(
  noteId: string,
  updates: Partial<{ content: string; pinned: boolean; severity: NoteSeverity }>
): Promise<void> {
  const row: Record<string, unknown> = {}
  if (updates.content !== undefined) row.content = updates.content
  if (updates.pinned !== undefined) row.pinned = updates.pinned
  if (updates.severity !== undefined) row.severity = updates.severity
  if (Object.keys(row).length === 0) return
  const { error } = await icc().from('notes').update(row).eq('id', noteId)
  if (error) throw new Error(`update note: ${error.message}`)
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await icc().from('notes').delete().eq('id', noteId).eq('user_id', getActorId())
  if (error) throw new Error(`delete note: ${error.message}`)
}

export async function deleteTaskComment(commentId: string): Promise<void> {
  const { error } = await icc()
    .from('task_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', getActorId())
  if (error) throw new Error(`delete comment: ${error.message}`)
}

export async function insertMemberFeatureDefinition(label: string): Promise<MemberFeatureDefinition> {
  const trimmed = label.trim()
  if (!trimmed) throw new Error('Feature label is required')

  const { data: existing } = await icc()
    .from('member_feature_definitions')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = ((existing?.[0] as { sort_order?: number } | undefined)?.sort_order ?? -1) + 1
  const id = generateId()
  const { data, error } = await icc()
    .from('member_feature_definitions')
    .insert({
      id,
      user_id: getActorId(),
      label: trimmed,
      sort_order: nextOrder,
    })
    .select('*')
    .single()
  assertOk(error, data, 'add member feature')
  return mapMemberFeatureDefinition(data as DbMemberFeatureDefinition)
}

export async function deleteMemberFeatureDefinition(id: string): Promise<void> {
  const { error } = await icc().from('member_feature_definitions').delete().eq('id', id)
  if (error) throw new Error(`delete member feature: ${error.message}`)
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
      user_id: getActorId(),
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
      user_id: getActorId(),
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
    user_id: getActorId(),
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
    .on('postgres_changes', { event: '*', schema: 'app_implementation_center_v1', table: 'member_feature_definitions' }, handlers.onChange)
    .on('postgres_changes', { event: '*', schema: 'app_implementation_center_v1', table: 'task_comments' }, handlers.onChange)
    .on('postgres_changes', { event: '*', schema: 'app_implementation_center_v1', table: 'implementation_favorites' }, handlers.onChange)
    .on('postgres_changes', { event: '*', schema: 'app_implementation_center_v1', table: 'profiles' }, handlers.onChange)
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
