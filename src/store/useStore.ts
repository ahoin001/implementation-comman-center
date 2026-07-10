import { create } from 'zustand'
import type {
  Project,
  Activity,
  CalendarEvent,
  AppSettings,
  WaitingOn,
  ProjectFilter,
  ProjectLinks,
  Contact,
  IntegrationsConfig,
  ProjectTaskKey,
  ProjectTaskStatus,
  FollowUpSubstepKey,
} from '@/types'
import { FOLLOW_UP_TASK_KEY, PROJECT_TASK_LABELS } from '@/types'
import { defaultIntegrations, defaultSettings } from './seedData'
import { generateId } from '@/lib/utils'
import { buildEventTitle, suggestAbbreviation } from '@/lib/calendar'
import { createDefaultTasks } from '@/lib/migrate'
import { applyFollowUpStatus, applyFollowUpSubstep, canCompleteLaunch } from '@/lib/progress'
import { isSupabaseConfigured } from '@/lib/supabase'
import * as api from '@/lib/supabaseApi'

interface StoreState {
  projects: Project[]
  activities: Activity[]
  calendarEvents: CalendarEvent[]
  settings: AppSettings
  searchQuery: string
  activeFilter: ProjectFilter
  hydrated: boolean
  syncing: boolean
  syncError: string | null

  hydrate: () => Promise<void>
  refresh: () => Promise<void>
  setSearchQuery: (query: string) => void
  setActiveFilter: (filter: ProjectFilter) => void
  updateSettings: (settings: Partial<AppSettings>) => void

  getProject: (id: string) => Project | undefined
  updateProject: (id: string, updates: Partial<Project>) => void
  archiveProject: (id: string) => void
  addNote: (projectId: string, content: string, options?: { pinned?: boolean; isMeetingSummary?: boolean }) => void
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => void
  updateProjectTask: (projectId: string, taskKey: ProjectTaskKey, status: ProjectTaskStatus, blockedReason?: string) => void
  updateFollowUpSubstep: (projectId: string, substep: FollowUpSubstepKey, checked: boolean) => void
  updateWaitingOn: (projectId: string, waitingOn: WaitingOn) => void
  logOutreach: (projectId: string) => void
  undoOutreach: (projectId: string) => void
  updateProjectLinks: (projectId: string, links: Partial<ProjectLinks>) => void
  updateProjectContact: (projectId: string, contact: Partial<Contact>) => void
  updateIntegrations: (integrations: Partial<IntegrationsConfig>) => void
  createProject: (data: { name: string; abbreviation?: string; contactName?: string; contactEmail?: string; launchDate?: string }) => string
  createProjects: (items: { name: string; abbreviation?: string }[]) => string[]
  deleteProjects: (ids: string[]) => void
  addCalendarEvent: (data: Omit<CalendarEvent, 'id' | 'title'> & { title?: string }) => string
  updateCalendarEvent: (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => void
  deleteCalendarEvent: (id: string) => void
  exportData: () => string
  importData: (json: string) => boolean
  resetToSeed: () => void
}

function logSyncError(err: unknown) {
  console.error(err)
}

export const useStore = create<StoreState>()((set, get) => ({
  projects: [],
  activities: [],
  calendarEvents: [],
  settings: { ...defaultSettings, integrations: { ...defaultIntegrations } },
  searchQuery: '',
  activeFilter: 'all',
  hydrated: false,
  syncing: false,
  syncError: null,

  hydrate: async () => {
    if (!isSupabaseConfigured()) {
      set({
        hydrated: true,
        syncError: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY',
      })
      return
    }
    set({ syncing: true, syncError: null })
    try {
      const data = await api.fetchAllData()
      set({
        projects: data.projects,
        activities: data.activities,
        calendarEvents: data.calendarEvents,
        settings: data.settings,
        hydrated: true,
        syncing: false,
        syncError: null,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load from Supabase'
      set({ hydrated: true, syncing: false, syncError: message })
      logSyncError(err)
    }
  },

  refresh: async () => {
    if (!isSupabaseConfigured() || !get().hydrated) return
    try {
      const data = await api.fetchAllData()
      set({
        projects: data.projects,
        activities: data.activities,
        calendarEvents: data.calendarEvents,
        settings: data.settings,
        syncError: null,
      })
    } catch (err) {
      logSyncError(err)
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),

  updateSettings: (updates) => {
    const settings = {
      ...get().settings,
      ...updates,
      integrations: {
        ...get().settings.integrations,
        ...(updates.integrations ?? {}),
      },
    }
    set({ settings })
    void api.upsertSettings(settings).catch(logSyncError)
  },

  getProject: (id) => get().projects.find((p) => p.id === id),

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }))
    void api
      .patchImplementation(id, {
        name: updates.name,
        abbreviation: updates.abbreviation,
        launchDate: updates.launchDate,
        waitingOn: updates.waitingOn,
        outreachCount: updates.outreachCount,
        lastOutreachAt: updates.lastOutreachAt,
        contact: updates.contact,
        links: updates.links,
        archived: updates.archived,
        archivedAt: updates.archivedAt,
      })
      .catch(logSyncError)
  },

  archiveProject: (id) => {
    const archivedAt = new Date().toISOString()
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, archived: true, archivedAt, updatedAt: archivedAt } : p
      ),
    }))
    void api.patchImplementation(id, { archived: true, archivedAt }).catch(logSyncError)
  },

  addNote: (projectId, content, options) => {
    const tempId = generateId()
    const note = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      ...options,
    }
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, notes: [note, ...p.notes], updatedAt: new Date().toISOString() } : p
      ),
    }))
    void api
      .insertNote(projectId, content, options)
      .then((saved) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, notes: p.notes.map((n) => (n.id === tempId ? saved : n)) }
              : p
          ),
        }))
        get().addActivity({
          type: 'note',
          title: `Note added — ${get().getProject(projectId)?.abbreviation || get().getProject(projectId)?.name}`,
          projectId,
        })
      })
      .catch(logSyncError)
  },

  addActivity: (activity) => {
    const temp: Activity = {
      ...activity,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ activities: [temp, ...state.activities].slice(0, 50) }))
    void api
      .insertActivity(activity)
      .then((saved) => {
        set((state) => ({
          activities: state.activities.map((a) => (a.id === temp.id ? saved : a)).slice(0, 50),
        }))
      })
      .catch(logSyncError)
  },

  updateProjectTask: (projectId, taskKey, status, blockedReason) => {
    const project = get().getProject(projectId)
    if (!project) return

    if (taskKey === 'launch') {
      if (status === 'not_needed') return
      if (status === 'done' && !canCompleteLaunch(project)) return
    }

    const current = project.tasks[taskKey]
    const nextTask =
      taskKey === FOLLOW_UP_TASK_KEY
        ? applyFollowUpStatus(current, status, blockedReason)
        : {
            status,
            blockedReason:
              status === 'blocked' || status === 'pending' ? blockedReason || undefined : undefined,
            completedAt:
              status === 'done' || status === 'not_needed' ? new Date().toISOString() : undefined,
            substeps: current?.substeps,
          }

    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          tasks: { ...p.tasks, [taskKey]: nextTask },
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
    void api
      .upsertTask(projectId, taskKey, nextTask.status, nextTask.blockedReason, nextTask.substeps)
      .catch(logSyncError)
    get().addActivity({
      type: 'milestone',
      title: `${PROJECT_TASK_LABELS[taskKey]} → ${nextTask.status} — ${get().getProject(projectId)?.abbreviation || get().getProject(projectId)?.name}`,
      projectId,
    })
  },

  updateFollowUpSubstep: (projectId, substep, checked) => {
    const project = get().getProject(projectId)
    if (!project) return
    const current = project.tasks[FOLLOW_UP_TASK_KEY]
    if (!current) return

    const nextTask = applyFollowUpSubstep(current, substep, checked)
    set((state) => ({
      projects: state.projects.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          tasks: { ...p.tasks, [FOLLOW_UP_TASK_KEY]: nextTask },
          updatedAt: new Date().toISOString(),
        }
      }),
    }))
    void api
      .upsertTask(
        projectId,
        FOLLOW_UP_TASK_KEY,
        nextTask.status,
        nextTask.blockedReason,
        nextTask.substeps
      )
      .catch(logSyncError)
  },

  updateWaitingOn: (projectId, waitingOn) => get().updateProject(projectId, { waitingOn }),

  logOutreach: (projectId) => {
    const project = get().getProject(projectId)
    if (!project) return
    const now = new Date().toISOString()
    get().updateProject(projectId, {
      outreachCount: (project.outreachCount ?? 0) + 1,
      lastOutreachAt: now,
    })
    get().addActivity({
      type: 'email',
      title: `Reached out — ${project.abbreviation || project.name}`,
      projectId,
    })
  },

  undoOutreach: (projectId) => {
    const project = get().getProject(projectId)
    if (!project || (project.outreachCount ?? 0) <= 0) return
    const next = (project.outreachCount ?? 0) - 1
    get().updateProject(projectId, {
      outreachCount: next,
      lastOutreachAt: next === 0 ? undefined : project.lastOutreachAt,
    })
  },

  updateProjectLinks: (projectId, links) => {
    const project = get().getProject(projectId)
    if (!project) return
    get().updateProject(projectId, { links: { ...project.links, ...links } })
  },

  updateProjectContact: (projectId, contact) => {
    const project = get().getProject(projectId)
    if (!project) return
    get().updateProject(projectId, { contact: { ...project.contact, ...contact } })
  },

  updateIntegrations: (integrations) =>
    get().updateSettings({
      integrations: { ...get().settings.integrations, ...integrations },
    }),

  createProject: (data) => {
    const id = generateId()
    const now = new Date().toISOString()
    const project: Project = {
      id,
      name: data.name,
      abbreviation: data.abbreviation?.trim() || suggestAbbreviation(data.name),
      launchDate: data.launchDate,
      tasks: createDefaultTasks(),
      waitingOn: 'none',
      outreachCount: 0,
      contact: {
        name: data.contactName ?? '',
        email: data.contactEmail ?? '',
      },
      links: {},
      notes: [],
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({ projects: [project, ...state.projects] }))

    void api
      .insertImplementation({ ...data, id })
      .then((saved) => {
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? saved : p)),
        }))
        get().addActivity({
          type: 'other',
          title: `Created project — ${saved.abbreviation}`,
          projectId: saved.id,
        })
      })
      .catch(async (err) => {
        logSyncError(err)
        set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }))
        await get().refresh()
      })

    return id
  },

  createProjects: (items) => {
    const valid = items.filter((i) => i.name.trim())
    const ids: string[] = []
    for (const item of valid) {
      ids.push(
        get().createProject({
          name: item.name.trim(),
          abbreviation: item.abbreviation,
        })
      )
    }
    return ids
  },

  deleteProjects: (ids) => {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    set((state) => ({
      projects: state.projects.filter((p) => !idSet.has(p.id)),
      calendarEvents: state.calendarEvents.filter((e) => !idSet.has(e.projectId)),
    }))
    void api.deleteImplementations(ids).catch(logSyncError)
    get().addActivity({
      type: 'other',
      title: `Deleted ${ids.length} project${ids.length === 1 ? '' : 's'}`,
    })
  },

  addCalendarEvent: (data) => {
    const id = generateId()
    const project = get().getProject(data.projectId)
    const title = data.title ?? (project ? buildEventTitle(data.type, project) : 'Event')
    const event: CalendarEvent = { ...data, id, title }
    set((state) => ({ calendarEvents: [...state.calendarEvents, event] }))
    void api
      .insertCalendarEvent({
        ...data,
        title,
        project: project ? { abbreviation: project.abbreviation, name: project.name } : undefined,
      })
      .then((saved) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.map((e) => (e.id === id ? saved : e)),
        }))
        get().addActivity({
          type: 'other',
          title: `Scheduled ${saved.title}`,
          projectId: saved.projectId,
        })
      })
      .catch(logSyncError)
    return id
  },

  updateCalendarEvent: (id, updates) => {
    set((state) => ({
      calendarEvents: state.calendarEvents.map((e) => {
        if (e.id !== id) return e
        const merged = { ...e, ...updates }
        if (updates.type || updates.projectId) {
          const project = get().getProject(merged.projectId)
          if (project) merged.title = buildEventTitle(merged.type, project)
        }
        return merged
      }),
    }))
    const current = get().calendarEvents.find((e) => e.id === id)
    void api
      .patchCalendarEvent(id, {
        ...updates,
        title: current?.title,
      })
      .catch(logSyncError)
  },

  deleteCalendarEvent: (id) => {
    set((state) => ({
      calendarEvents: state.calendarEvents.filter((e) => e.id !== id),
    }))
    void api.removeCalendarEvent(id).catch(logSyncError)
  },

  exportData: () => {
    const { projects, activities, calendarEvents, settings } = get()
    return JSON.stringify({ projects, activities, calendarEvents, settings }, null, 2)
  },

  importData: (json) => {
    try {
      const data = JSON.parse(json)
      if (!data.projects) return false
      // Import is local-only preview; push via bulk create is safer as a follow-up
      set({
        projects: data.projects,
        activities: data.activities ?? [],
        calendarEvents: data.calendarEvents ?? [],
        settings: {
          ...get().settings,
          ...data.settings,
          integrations: {
            ...defaultIntegrations,
            ...data.settings?.integrations,
          },
        },
      })
      return true
    } catch {
      return false
    }
  },

  resetToSeed: () => {
    // Clears local view; does not wipe Supabase. Use bulk delete for that.
    void get().refresh()
  },
}))
