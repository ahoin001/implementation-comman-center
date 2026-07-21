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
  | 'launch'

export type ProjectTaskStatus = 'pending' | 'done' | 'not_needed' | 'blocked'

export interface ProjectTask {
  status: ProjectTaskStatus
  blockedReason?: string
  completedAt?: string
}

/** Client / ops deliverables tracked alongside Launch Path */
export type DeliverableKey =
  | 'ach'
  | 'w9'
  | 'sso_test_credentials'
  | 'custom_categories'

export interface DeliverableItem {
  received: boolean
  note?: string
  receivedAt?: string
}

export type ProjectDeliverables = Record<DeliverableKey, DeliverableItem>

export const DELIVERABLE_KEYS: DeliverableKey[] = [
  'ach',
  'w9',
  'sso_test_credentials',
  'custom_categories',
]

/** ACH + W-9 — Missing Docs badge / filter */
export const REQUIRED_DOC_KEYS: DeliverableKey[] = ['ach', 'w9']

export const DELIVERABLE_LABELS: Record<DeliverableKey, string> = {
  ach: 'ACH',
  w9: 'W-9',
  sso_test_credentials: 'SSO test credentials',
  custom_categories: 'Custom Categories',
}

/** Optional client image assets for Site Design */
export type ImageAssetsStatus = 'pending' | 'provided' | 'not_providing'

export type DataAssetKey =
  | 'jobseekers'
  | 'resumes'
  | 'employers'
  | 'transaction_history'
  | 'job_history'

export const DATA_ASSET_KEYS: DataAssetKey[] = [
  'jobseekers',
  'resumes',
  'employers',
  'transaction_history',
  'job_history',
]

export const DATA_ASSET_LABELS: Record<DataAssetKey, string> = {
  jobseekers: 'Jobseekers',
  resumes: 'Resumes',
  employers: 'Employers',
  transaction_history: 'Transaction History',
  job_history: 'Job History',
}

/** Path-level options (SSO on/off, images, import inventory) */
export interface PathConfig {
  ssoEnabled: boolean
  /** Optional — some associations provide images, some do not */
  imageAssets: ImageAssetsStatus
  /** Inventory of data types the association has (none required) */
  dataAssets: Record<DataAssetKey, boolean>
}

export const TASK_DELIVERABLE_KEYS: Partial<Record<ProjectTaskKey, DeliverableKey[]>> = {
  kickoff_call: ['ach', 'w9'],
  sso: ['sso_test_credentials'],
  smartway_training: ['custom_categories'],
  job_backfill: ['custom_categories'],
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
  'launch',
]

/** Everything except the final Launch step */
export const PRE_LAUNCH_TASK_KEYS: ProjectTaskKey[] = PROJECT_TASK_KEYS.filter((k) => k !== 'launch')

export const LAUNCH_TASK_KEY: ProjectTaskKey = 'launch'

export const PROJECT_TASK_LABELS: Record<ProjectTaskKey, string> = {
  site_design: 'Site Design',
  kickoff_call: 'Kickoff Call',
  follow_up_email: 'Follow-up Email',
  data_import: 'Data Import',
  sso: 'SSO',
  smartway_training: 'SmartWay Training',
  job_backfill: 'Enable Job Backfill',
  launch: 'Launch',
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
  | 'client_scheduling'
  | 'internal_dev'
  | 'qa'
  | 'scheduling'
  | 'ready'
  | 'none'

/** Reasons where you're blocked on the client — outreach tracking applies */
export const CLIENT_WAITING_REASONS: WaitingOn[] = [
  'client_assets',
  'client_data',
  'membership',
  'client_scheduling',
]

export function isClientWaiting(waitingOn: WaitingOn): boolean {
  return CLIENT_WAITING_REASONS.includes(waitingOn)
}

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
  deliverables: ProjectDeliverables
  pathConfig: PathConfig
  waitingOn: WaitingOn
  /** Times you've reached out while waiting on the client */
  outreachCount: number
  lastOutreachAt?: string
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
  client_assets: 'Client Assets',
  client_data: 'Client Data',
  membership: 'Membership',
  client_scheduling: 'Client Scheduling',
  internal_dev: 'Internal Development',
  qa: 'QA',
  scheduling: 'Internal Scheduling',
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
  | 'needs_attention'
  | 'waiting_on_client'
  | 'completed'
  | 'no_launch_date'
  | 'missing_required_docs'
  | 'missing_sso_credentials'
  | 'needs_site_design'
  | 'needs_kickoff_call'
  | 'needs_follow_up_email'
  | 'needs_data_import'
  | 'needs_sso'
  | 'needs_smartway_training'
  | 'needs_schedule'

/** Primary status filters shown as the main row */
export const STATUS_FILTERS: ProjectFilter[] = [
  'all',
  'launching_soon',
  'needs_attention',
  'waiting_on_client',
  'missing_required_docs',
  'missing_sso_credentials',
  'completed',
  'no_launch_date',
]

/**
 * Compact Launch Path task filters (excludes job backfill).
 * `needs_schedule` = kickoff or SmartWay training still open.
 */
export const TASK_FILTERS: ProjectFilter[] = [
  'needs_site_design',
  'needs_data_import',
  'needs_schedule',
  'needs_kickoff_call',
  'needs_follow_up_email',
  'needs_sso',
  'needs_smartway_training',
]

export const FILTER_LABELS: Record<ProjectFilter, string> = {
  all: 'All',
  launching_soon: 'Launching Soon',
  needs_attention: 'Needs Attention',
  waiting_on_client: 'Waiting on Client',
  missing_required_docs: 'Missing Docs',
  missing_sso_credentials: 'Missing SSO Creds',
  completed: 'Completed',
  no_launch_date: 'No Launch Date',
  needs_site_design: 'Site Design',
  needs_kickoff_call: 'Kickoff',
  needs_follow_up_email: 'Follow-up',
  needs_data_import: 'Data',
  needs_sso: 'SSO',
  needs_smartway_training: 'Training',
  needs_schedule: 'Schedule',
}

export const LINK_FIELD_LABELS = {
  associationWebsite: 'Association Website',
  googleDrive: 'Google Drive',
  jira: 'Jira',
  salesforce: 'Salesforce',
  stagingSite: 'Staging Site',
} as const satisfies Partial<Record<keyof ProjectLinks, string>>

export type EditableLinkKey = keyof typeof LINK_FIELD_LABELS

export const EDITABLE_LINK_KEYS = (
  Object.keys(LINK_FIELD_LABELS) as EditableLinkKey[]
).sort((a, b) => LINK_FIELD_LABELS[a].localeCompare(LINK_FIELD_LABELS[b]))

