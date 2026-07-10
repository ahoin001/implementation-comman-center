import type { AppState, Project, Activity, CalendarEvent, ProjectTaskKey } from '@/types'
import { createDefaultTasks } from '@/lib/migrate'

const tasks = createDefaultTasks

export const seedProjects: Project[] = [
  {
    id: '1',
    name: 'American Staffing Association',
    abbreviation: 'ASA',
    launchDate: '2026-07-18',
    tasks: tasks({
      site_design: { status: 'done', completedAt: '2026-05-15' },
      kickoff_call: { status: 'done', completedAt: '2026-06-10' },
      follow_up_email: { status: 'done', completedAt: '2026-06-12' },
      data_import: { status: 'done', completedAt: '2026-06-01' },
      sso: { status: 'done', completedAt: '2026-06-05' },
      smartway_training: { status: 'pending' },
      job_backfill: { status: 'pending' },
    }),
    waitingOn: 'none',
    contact: {
      name: 'Sarah Mitchell',
      email: 'sarah.mitchell@americanstaffing.org',
      phone: '(703) 555-0142',
      timezone: 'America/New_York',
    },
    links: {
      salesforce: 'https://salesforce.com',
      jira: 'https://jira.atlassian.com',
      slack: 'https://slack.com',
      googleDrive: 'https://drive.google.com',
      stagingSite: 'https://staging.americanstaffing.org',
      associationWebsite: 'https://americanstaffing.org',
      adminLogin: 'https://staging.americanstaffing.org/admin',
    },
    notes: [
      { id: 'n1', content: 'Kickoff completed. Client excited about SmartWay integration.', createdAt: '2026-07-09T14:00:00Z' },
      { id: 'n2', content: 'Melissa sent branding assets.', createdAt: '2026-07-08T10:30:00Z' },
      { id: 'n3', content: 'Created staging site.', createdAt: '2026-07-06T09:00:00Z', pinned: true },
    ],
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-07-09T14:00:00Z',
  },
  {
    id: '2',
    name: 'ABC Association',
    abbreviation: 'ABC',
    launchDate: '2026-07-25',
    tasks: tasks({
      site_design: { status: 'done', completedAt: '2026-05-20' },
      kickoff_call: { status: 'done', completedAt: '2026-06-15' },
      follow_up_email: { status: 'done', completedAt: '2026-06-18' },
      data_import: { status: 'pending' },
      sso: { status: 'not_needed' },
      smartway_training: { status: 'blocked', blockedReason: 'Waiting on client to confirm training date' },
      job_backfill: { status: 'pending' },
    }),
    waitingOn: 'scheduling',
    contact: { name: 'John Davis', email: 'john@abcassociation.org', timezone: 'America/Chicago' },
    links: {
      salesforce: 'https://salesforce.com',
      jira: 'https://jira.atlassian.com',
      stagingSite: 'https://staging.abcassociation.org',
    },
    notes: [{ id: 'n4', content: 'Waiting on client to confirm training date.', createdAt: '2026-07-08T12:00:00Z' }],
    createdAt: '2026-04-15T00:00:00Z',
    updatedAt: '2026-07-08T12:00:00Z',
  },
  {
    id: '3',
    name: 'XYZ Association',
    abbreviation: 'XYZ',
    launchDate: '2026-08-01',
    tasks: tasks({
      site_design: { status: 'done', completedAt: '2026-06-01' },
      follow_up_email: { status: 'blocked', blockedReason: 'Waiting on branding assets from client' },
      data_import: { status: 'pending' },
    }),
    waitingOn: 'client_assets',
    contact: { name: 'Emily Chen', email: 'emily@xyzassociation.org', timezone: 'America/Los_Angeles' },
    links: { stagingSite: 'https://staging.xyzassociation.org' },
    notes: [],
    createdAt: '2026-05-01T00:00:00Z',
    updatedAt: '2026-07-07T09:00:00Z',
  },
  {
    id: '4',
    name: 'Healthcare Society',
    abbreviation: 'HCS',
    launchDate: '2026-07-15',
    tasks: tasks({
      site_design: { status: 'pending' },
    }),
    waitingOn: 'none',
    contact: { name: 'Dr. Robert Kim', email: 'rkim@healthcaresociety.org', timezone: 'America/New_York' },
    links: { stagingSite: 'https://staging.healthcaresociety.org' },
    notes: [{ id: 'n5', content: 'Homepage mockup in review.', createdAt: '2026-07-09T08:00:00Z' }],
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-07-09T08:00:00Z',
  },
  {
    id: '5',
    name: 'National Retail Federation',
    abbreviation: 'NRF',
    launchDate: '2026-06-28',
    tasks: tasks(
      Object.fromEntries(
        (['site_design', 'kickoff_call', 'follow_up_email', 'data_import', 'sso', 'smartway_training', 'job_backfill'] as ProjectTaskKey[]).map((k) => [
          k,
          { status: 'done' as const, completedAt: '2026-06-28' },
        ])
      )
    ),
    waitingOn: 'none',
    contact: { name: 'Lisa Wong', email: 'lwong@nrf.com', timezone: 'America/New_York' },
    links: { liveSite: 'https://nrf.com' },
    notes: [],
    archived: true,
    archivedAt: '2026-06-28T00:00:00Z',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-06-28T00:00:00Z',
  },
  {
    id: '6',
    name: 'Tech Innovators Alliance',
    abbreviation: 'TIA',
    launchDate: '2026-07-12',
    tasks: tasks({
      site_design: { status: 'done', completedAt: '2026-05-01' },
      kickoff_call: { status: 'done', completedAt: '2026-06-01' },
      follow_up_email: { status: 'done', completedAt: '2026-06-05' },
      data_import: { status: 'done', completedAt: '2026-05-20' },
      sso: { status: 'done', completedAt: '2026-06-10' },
      smartway_training: { status: 'done', completedAt: '2026-07-01' },
      job_backfill: { status: 'pending' },
    }),
    waitingOn: 'ready',
    contact: { name: 'Marcus Johnson', email: 'marcus@techinnovators.org', timezone: 'America/Denver' },
    links: {
      stagingSite: 'https://staging.techinnovators.org',
      liveSite: 'https://techinnovators.org',
    },
    notes: [{ id: 'n6', content: 'Final QA passed. Ready for launch.', createdAt: '2026-07-10T10:00:00Z', pinned: true }],
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-07-10T11:00:00Z',
  },
  {
    id: '7',
    name: 'Education Professionals Network',
    abbreviation: 'EPN',
    launchDate: undefined,
    tasks: tasks(),
    waitingOn: 'scheduling',
    contact: { name: 'Anna Rodriguez', email: 'anna@edpros.org', timezone: 'America/Chicago' },
    links: {},
    notes: [],
    createdAt: '2026-07-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
  },
  {
    id: '8',
    name: 'Green Energy Coalition',
    abbreviation: 'GEC',
    launchDate: '2026-08-15',
    tasks: tasks({
      site_design: { status: 'blocked', blockedReason: 'Waiting on logo files from client' },
    }),
    waitingOn: 'client_assets',
    contact: { name: 'David Green', email: 'david@greenenergy.org', timezone: 'America/Los_Angeles' },
    links: { stagingSite: 'https://staging.greenenergy.org' },
    notes: [{ id: 'n7', content: 'Design blocked — waiting on logo files from client.', createdAt: '2026-07-08T15:00:00Z' }],
    createdAt: '2026-06-15T00:00:00Z',
    updatedAt: '2026-07-08T16:00:00Z',
  },
]

export const seedActivities: Activity[] = [
  { id: 'a1', type: 'import', title: 'Imported Data — American Staffing', createdAt: '2026-07-09T14:00:00Z', projectId: '1' },
  { id: 'a2', type: 'design', title: 'Completed Design — ABC Association', createdAt: '2026-07-08T11:00:00Z', projectId: '2' },
  { id: 'a3', type: 'training', title: 'Scheduled Training — Healthcare Society', createdAt: '2026-07-07T09:30:00Z', projectId: '4' },
  { id: 'a4', type: 'email', title: 'Sent Reminder Email — XYZ Association', createdAt: '2026-07-07T09:00:00Z', projectId: '3' },
  { id: 'a5', type: 'launch', title: 'Launch Completed — National Retail Federation', createdAt: '2026-06-28T17:00:00Z', projectId: '5' },
]

export const seedCalendarEvents: CalendarEvent[] = [
  { id: 'c1', projectId: '4', title: 'Kickoff — HCS', type: 'kickoff', date: '2026-07-10', time: '10:00' },
  { id: 'c2', projectId: '2', title: 'SmartWay Training — ABC', type: 'training', date: '2026-07-10', time: '14:00' },
  { id: 'c3', projectId: '6', title: 'Adhoc — TIA', type: 'adhoc', date: '2026-07-11' },
  { id: 'c4', projectId: '1', title: 'Adhoc — ASA', type: 'adhoc', date: '2026-07-18' },
  { id: 'c5', projectId: '2', title: 'Kickoff — ABC', type: 'kickoff', date: '2026-07-25' },
]

export const defaultIntegrations: AppState['settings']['integrations'] = {
  salesforceInstanceUrl: '',
  salesforceApiKey: '',
  jiraInstanceUrl: '',
  jiraApiKey: '',
  slackWorkspaceUrl: '',
  googleDriveFolderUrl: '',
}

export const defaultSettings: AppState['settings'] = {
  userName: 'Alex',
  theme: 'system',
  accentColor: '#0071e3',
  reminderWindowDays: 14,
  notificationsEnabled: true,
  integrations: defaultIntegrations,
}

export function createInitialState(): AppState {
  return {
    projects: seedProjects,
    activities: seedActivities,
    calendarEvents: seedCalendarEvents,
    settings: defaultSettings,
  }
}
