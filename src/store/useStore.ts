import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Project,
  Note,
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
} from '@/types'
import { PROJECT_TASK_LABELS } from '@/types'
import { createInitialState, defaultIntegrations } from './seedData'
import { generateId } from '@/lib/utils'
import { createDefaultTasks, migrateProjects } from '@/lib/migrate'
import { buildEventTitle, migrateCalendarEvents, suggestAbbreviation } from '@/lib/calendar'

interface StoreState {
  projects: Project[]
  activities: Activity[]
  calendarEvents: CalendarEvent[]
  settings: AppSettings
  searchQuery: string
  activeFilter: ProjectFilter

  setSearchQuery: (query: string) => void
  setActiveFilter: (filter: ProjectFilter) => void
  updateSettings: (settings: Partial<AppSettings>) => void

  getProject: (id: string) => Project | undefined
  updateProject: (id: string, updates: Partial<Project>) => void
  archiveProject: (id: string) => void
  addNote: (projectId: string, content: string, options?: { pinned?: boolean; isMeetingSummary?: boolean }) => void
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt'>) => void
  updateProjectTask: (projectId: string, taskKey: ProjectTaskKey, status: ProjectTaskStatus, blockedReason?: string) => void
  updateWaitingOn: (projectId: string, waitingOn: WaitingOn) => void
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

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      searchQuery: '',
      activeFilter: 'all',

      setSearchQuery: (query) => set({ searchQuery: query }),
      setActiveFilter: (filter) => set({ activeFilter: filter }),

      updateSettings: (updates) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...updates,
            integrations: {
              ...state.settings.integrations,
              ...(updates.integrations ?? {}),
            },
          },
        })),

      getProject: (id) => get().projects.find((p) => p.id === id),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),

      archiveProject: (id) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, archived: true, archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      addNote: (projectId, content, options) => {
        const note: Note = {
          id: generateId(),
          content,
          createdAt: new Date().toISOString(),
          ...options,
        }
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, notes: [note, ...p.notes], updatedAt: new Date().toISOString() } : p
          ),
        }))
        get().addActivity({ type: 'note', title: `Note added — ${get().getProject(projectId)?.name}`, projectId })
      },

      addActivity: (activity) => {
        const newActivity: Activity = {
          ...activity,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ activities: [newActivity, ...state.activities].slice(0, 50) }))
      },

      updateProjectTask: (projectId, taskKey, status, blockedReason) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p
            const tasks = { ...p.tasks }
            tasks[taskKey] = {
              status,
              blockedReason: status === 'blocked' ? blockedReason : undefined,
              completedAt: status === 'done' || status === 'not_needed' ? new Date().toISOString() : undefined,
            }
            return { ...p, tasks, updatedAt: new Date().toISOString() }
          }),
        }))
        get().addActivity({
          type: 'milestone',
          title: `${PROJECT_TASK_LABELS[taskKey]} → ${status} — ${get().getProject(projectId)?.name}`,
          projectId,
        })
      },

      updateWaitingOn: (projectId, waitingOn) => get().updateProject(projectId, { waitingOn }),

      updateProjectLinks: (projectId, links) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, links: { ...p.links, ...links }, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      updateProjectContact: (projectId, contact) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, contact: { ...p.contact, ...contact }, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      updateIntegrations: (integrations) =>
        set((state) => ({
          settings: {
            ...state.settings,
            integrations: { ...state.settings.integrations, ...integrations },
          },
        })),

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
          contact: {
            name: data.contactName ?? '',
            email: data.contactEmail ?? '',
          },
          links: {},
          notes: [],
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({ projects: [...state.projects, project] }))
        get().addActivity({ type: 'other', title: `Created project — ${project.abbreviation}`, projectId: id })
        return id
      },

      createProjects: (items) => {
        const now = new Date().toISOString()
        const created = items
          .filter((item) => item.name.trim())
          .map((item) => {
            const name = item.name.trim()
            const abbreviation = item.abbreviation?.trim() || suggestAbbreviation(name)
            const project: Project = {
              id: generateId(),
              name,
              abbreviation,
              tasks: createDefaultTasks(),
              waitingOn: 'none',
              contact: { name: '', email: '' },
              links: {},
              notes: [],
              createdAt: now,
              updatedAt: now,
            }
            return project
          })

        if (created.length === 0) return []

        set((state) => ({ projects: [...state.projects, ...created] }))
        get().addActivity({
          type: 'other',
          title: `Bulk added ${created.length} project${created.length === 1 ? '' : 's'}`,
        })
        return created.map((p) => p.id)
      },

      deleteProjects: (ids) => {
        if (ids.length === 0) return
        const idSet = new Set(ids)
        set((state) => ({
          projects: state.projects.filter((p) => !idSet.has(p.id)),
          calendarEvents: state.calendarEvents.filter((e) => !idSet.has(e.projectId)),
        }))
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
        get().addActivity({
          type: 'other',
          title: `Scheduled ${title}`,
          projectId: data.projectId,
        })
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
      },

      deleteCalendarEvent: (id) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.filter((e) => e.id !== id),
        }))
      },

      exportData: () => {
        const { projects, activities, calendarEvents, settings } = get()
        return JSON.stringify({ projects, activities, calendarEvents, settings }, null, 2)
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json)
          if (data.projects) {
            set({
              projects: migrateProjects(data.projects),
              activities: data.activities ?? [],
              calendarEvents: migrateCalendarEvents(data.calendarEvents ?? []),
              settings: {
                ...get().settings,
                ...data.settings,
                integrations: {
                  ...defaultIntegrations,
                  ...data.settings?.integrations,
                },
              },
            })
          }
          return true
        } catch {
          return false
        }
      },

      resetToSeed: () => set({ ...createInitialState(), searchQuery: '', activeFilter: 'all' }),
    }),
    {
      name: 'implementation-command-center',
      version: 3,
      partialize: (state) => ({
        projects: state.projects,
        activities: state.activities,
        calendarEvents: state.calendarEvents,
        settings: state.settings,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<StoreState>
        const rawProjects = p.projects ?? current.projects
        return {
          ...current,
          ...p,
          projects: migrateProjects(rawProjects as unknown[]),
          calendarEvents: migrateCalendarEvents((p.calendarEvents ?? current.calendarEvents) as CalendarEvent[]),
          settings: {
            ...current.settings,
            ...p.settings,
            integrations: {
              ...defaultIntegrations,
              ...p.settings?.integrations,
            },
          },
        }
      },
    }
  )
)
