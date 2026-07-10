export type MilestoneStatus = 'todo' | 'in_progress' | 'completed' | 'blocked'

export type MilestoneKey = 'design' | 'import' | 'kickoff' | 'training' | 'launch'

export type ProjectTaskKey =
  | 'site_design'
  | 'kickoff_call'
  | 'follow_up_email'
  | 'data_import'
  | 'sso'
  | 'smartway_training'
  | 'job_backfill'

export type ProjectTaskStatus = 'pending' | 'done' | 'not_needed' | 'blocked'

export interface ProjectTask {
  status: ProjectTaskStatus
  blockedReason?: string
  completedAt?: string
}

export type ProjectTasks = Record<ProjectTaskKey, ProjectTask>

export const PROJECT_TASK_KEYS: ProjectTaskKey[] = [
  'site_design',
  'kickoff_call',
  'follow_up_email',
  'data_import',
  'sso',
  'smartway_training',
  'job_backfill',
]

export const PROJECT_TASK_LABELS: Record<ProjectTaskKey, string> = {
  site_design: 'Site Design',
  kickoff_call: 'Kickoff Call',
  follow_up_email: 'Follow-up Email',
  data_import: 'Data Import',
  sso: 'SSO',
  smartway_training: 'SmartWay Training',
  job_backfill: 'Enable Job Backfill',
}

export const PROJECT_TASK_STATUS_LABELS: Record<ProjectTaskStatus, string> = {
  pending: 'To Do',
  done: 'Done',
  not_needed: 'Not Needed',
  blocked: 'Blocked',
}

export type WaitingOn =
  | 'client_assets'
  | 'client_data'
  | 'membership'
  | 'internal_dev'
  | 'qa'
  | 'scheduling'
  | 'ready'
  | 'none'

export type ProjectHealth =
  | 'healthy'
  | 'waiting_on_me'
  | 'waiting_on_client'
  | 'at_risk'
  | 'complete'

export type ActivityType =
  | 'note'
  | 'milestone'
  | 'email'
  | 'launch'
  | 'import'
  | 'design'
  | 'training'
  | 'kickoff'
  | 'other'

export interface Milestone {
  status: MilestoneStatus
  completedAt?: string
}

export interface ProjectLinks {
  salesforce?: string
  jira?: string
  slack?: string
  googleDrive?: string
  stagingSite?: string
  liveSite?: string
  associationWebsite?: string
  adminLogin?: string
}

export interface Contact {
  name: string
  email: string
  phone?: string
  timezone?: string
  notes?: string
}

export interface Note {
  id: string
  content: string
  createdAt: string
  pinned?: boolean
  isMeetingSummary?: boolean
}

export interface EmailLog {
  id: string
  subject: string
  content?: string
  sentAt: string
}

export interface Activity {
  id: string
  type: ActivityType
  title: string
  createdAt: string
  projectId?: string
}

export type CalendarEventType = 'kickoff' | 'adhoc' | 'training'

export interface CalendarEvent {
  id: string
  projectId: string
  title: string
  type: CalendarEventType
  date: string
  time?: string
  notes?: string
}

export const CALENDAR_EVENT_LABELS: Record<CalendarEventType, string> = {
  kickoff: 'Kickoff',
  adhoc: 'Adhoc',
  training: 'SmartWay Training',
}

export interface Project {
  id: string
  name: string
  abbreviation: string
  logoUrl?: string
  launchDate?: string
  tasks: ProjectTasks
  waitingOn: WaitingOn
  contact: Contact
  links: ProjectLinks
  notes: Note[]
  archived?: boolean
  archivedAt?: string
  createdAt: string
  updatedAt: string
}

export interface IntegrationsConfig {
  salesforceInstanceUrl: string
  salesforceApiKey: string
  jiraInstanceUrl: string
  jiraApiKey: string
  slackWorkspaceUrl: string
  googleDriveFolderUrl: string
}

export interface AppSettings {
  userName: string
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  reminderWindowDays: number
  notificationsEnabled: boolean
  integrations: IntegrationsConfig
}

export interface AppState {
  projects: Project[]
  activities: Activity[]
  calendarEvents: CalendarEvent[]
  settings: AppSettings
}

export const MILESTONE_LABELS: Record<MilestoneKey, string> = {
  design: 'Design',
  import: 'Import',
  kickoff: 'Kickoff',
  training: 'Training',
  launch: 'Launch',
}

export const MILESTONE_WEIGHTS: Record<MilestoneKey, number> = {
  design: 20,
  import: 20,
  kickoff: 20,
  training: 20,
  launch: 20,
}

export const WAITING_ON_LABELS: Record<WaitingOn, string> = {
  client_assets: 'Waiting on Client Assets',
  client_data: 'Waiting on Client Data',
  membership: 'Waiting on Membership',
  internal_dev: 'Waiting on Internal Development',
  qa: 'Waiting on QA',
  scheduling: 'Waiting on Scheduling',
  ready: 'Ready',
  none: 'Nobody',
}

export const HEALTH_LABELS: Record<ProjectHealth, string> = {
  healthy: 'Healthy',
  waiting_on_me: 'Waiting on Me',
  waiting_on_client: 'Waiting on Client',
  at_risk: 'At Risk',
  complete: 'Complete',
}

export type ProjectFilter =
  | 'all'
  | 'launching_soon'
  | 'waiting_on_client'
  | 'waiting_on_me'
  | 'ready_for_launch'
  | 'completed'
  | 'no_launch_date'
  | 'needs_attention'

export const LINK_FIELD_LABELS: Record<keyof ProjectLinks, string> = {
  salesforce: 'Salesforce',
  jira: 'Jira',
  slack: 'Slack',
  googleDrive: 'Google Drive',
  stagingSite: 'Staging Site',
  liveSite: 'Live Site',
  associationWebsite: 'Association Website',
  adminLogin: 'Admin Login',
}

export const FILTER_LABELS: Record<ProjectFilter, string> = {
  all: 'All',
  launching_soon: 'Launching Soon',
  waiting_on_client: 'Waiting on Client',
  waiting_on_me: 'Waiting on Me',
  ready_for_launch: 'Ready for Launch',
  completed: 'Completed',
  no_launch_date: 'No Launch Date',
  needs_attention: 'Needs Attention',
}
