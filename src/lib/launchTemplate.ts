export type LaunchParty = 'client' | 'webscribble'

export type LaunchTaskStatus = 'not_started' | 'in_progress' | 'complete' | 'na' | 'as_needed'

export interface LaunchPhase {
  key: string
  title: string
}

export interface LaunchGroup {
  key: string
  phaseKey: string
  title: string
}

export interface LaunchTemplateTask {
  key: string
  phaseKey: string
  groupKey: string
  title: string
  description: string
  party: LaunchParty
  defaultStatus: LaunchTaskStatus
  sort: number
}

export const LAUNCH_PHASES: LaunchPhase[] = [
  { key: 'prelaunch', title: 'Prelaunch' },
  { key: 'launch', title: 'Launch' },
  { key: 'after', title: 'After launch' },
]

export const LAUNCH_GROUPS: LaunchGroup[] = [
  { key: 'data', phaseKey: 'prelaunch', title: 'Data' },
  { key: 'integrations', phaseKey: 'prelaunch', title: 'Integrations' },
  { key: 'marketing', phaseKey: 'prelaunch', title: 'Marketing' },
  { key: 'pricing', phaseKey: 'prelaunch', title: 'Offers and pricing' },
  { key: 'payment', phaseKey: 'prelaunch', title: 'Payment' },
  { key: 'sales', phaseKey: 'prelaunch', title: 'Sales' },
  { key: 'site', phaseKey: 'prelaunch', title: 'Site design and setup' },
  { key: 'smartway', phaseKey: 'prelaunch', title: 'Smartway' },
  { key: 'sso', phaseKey: 'prelaunch', title: 'SSO' },
  { key: 'resources', phaseKey: 'prelaunch', title: 'Resources' },
  { key: 'golive', phaseKey: 'launch', title: 'Go-live' },
  { key: 'tech_support', phaseKey: 'after', title: 'Technical support' },
  { key: 'client_success', phaseKey: 'after', title: 'Client success' },
]

const raw: Omit<LaunchTemplateTask, 'sort'>[] = [
  { key: 'send_initial_export', phaseKey: 'prelaunch', groupKey: 'data', title: 'Send initial data export', description: 'Client sends the first data export, excluding CVs and resumes.', party: 'client', defaultStatus: 'not_started' },
  { key: 'import_initial_data', phaseKey: 'prelaunch', groupKey: 'data', title: 'Import initial data', description: 'Web Scribble imports the first data export.', party: 'webscribble', defaultStatus: 'not_started' },
  { key: 'send_final_export', phaseKey: 'prelaunch', groupKey: 'data', title: 'Send final data export', description: 'Client sends the final data export, excluding CVs and resumes.', party: 'client', defaultStatus: 'not_started' },
  { key: 'send_resumes', phaseKey: 'prelaunch', groupKey: 'data', title: 'Send CVs and resumes', description: 'Client sends resume files when the site will include them.', party: 'client', defaultStatus: 'not_started' },
  { key: 'import_final_data', phaseKey: 'prelaunch', groupKey: 'data', title: 'Import final data', description: 'Web Scribble imports the final data export.', party: 'webscribble', defaultStatus: 'not_started' },
  { key: 'confirm_thrive', phaseKey: 'prelaunch', groupKey: 'integrations', title: 'Confirm Higher Logic Thrive Jobs', description: 'Client confirms whether the Thrive Jobs integration should be turned on. Mark N/A if they do not want it.', party: 'client', defaultStatus: 'not_started' },
  { key: 'thrive_credentials', phaseKey: 'prelaunch', groupKey: 'integrations', title: 'Provide Thrive Jobs test credentials', description: 'Needed only when the Thrive Jobs integration is on.', party: 'client', defaultStatus: 'not_started' },
  { key: 'setup_thrive', phaseKey: 'prelaunch', groupKey: 'integrations', title: 'Set up and test Thrive Jobs', description: 'Web Scribble configures and tests the integration when it is in scope.', party: 'webscribble', defaultStatus: 'not_started' },
  { key: 'test_thrive', phaseKey: 'prelaunch', groupKey: 'integrations', title: 'Client tests Thrive Jobs', description: 'Client verifies the integration and flags anything that needs a tweak.', party: 'client', defaultStatus: 'not_started' },
  { key: 'review_marketing', phaseKey: 'prelaunch', groupKey: 'marketing', title: 'Review marketing tools in Smartway', description: 'Walk through banner manager, event tracking, and the publishing suite.', party: 'webscribble', defaultStatus: 'not_started' },
  { key: 'ga4_tags', phaseKey: 'prelaunch', groupKey: 'marketing', title: 'Add Google Analytics tags', description: 'Client can add GA4 tags, or Web Scribble can assist.', party: 'client', defaultStatus: 'not_started' },
  { key: 'develop_offers', phaseKey: 'prelaunch', groupKey: 'pricing', title: 'Develop job posting offers and pricing', description: 'Web Scribble proposes offers and pricing.', party: 'webscribble', defaultStatus: 'not_started' },
  { key: 'review_offers', phaseKey: 'prelaunch', groupKey: 'pricing', title: 'Review offers, Job Watch, and partner benefits', description: 'Decide which offers and benefits to include.', party: 'webscribble', defaultStatus: 'not_started' },
  { key: 'approve_offers', phaseKey: 'prelaunch', groupKey: 'pricing', title: 'Approve offers and pricing', description: 'Client approves the final offers and pricing.', party: 'client', defaultStatus: 'not_started' },
  { key: 'update_pricing', phaseKey: 'prelaunch', groupKey: 'pricing', title: 'Update pricing on the career center', description: 'Implementation specialist updates pricing on the career center after offers are approved.', party: 'webscribble', defaultStatus: 'not_started' },
  { key: 'provide_ach_w9', phaseKey: 'prelaunch', groupKey: 'payment', title: 'Provide ACH and W-9', description: 'Client sends completed ACH and W-9 forms.', party: 'client', defaultStatus: 'not_started' },
  { key: 'sales_training', phaseKey: 'prelaunch', groupKey: 'sales', title: 'Sales training', description: 'Review the sales process with the client team.', party: 'client', defaultStatus: 'not_started' },
  { key: 'sales_coordination', phaseKey: 'prelaunch', groupKey: 'sales', title: 'Sales coordination', description: 'Coordinate sales based on the role Web Scribble will have.', party: 'webscribble', defaultStatus: 'not_started' },
  { key: 'branding', phaseKey: 'prelaunch', groupKey: 'site', title: 'Get branding guidelines and logos', description: 'Ask the client for logo files (jpg, png, eps) and brand guidelines.', party: 'client', defaultStatus: 'not_started' },
  { key: 'header_images', phaseKey: 'prelaunch', groupKey: 'site', title: 'Get custom header images', description: 'Ask the client for a logo plus homepage 1920x424, career resources 1920x334, and pricing 1920x257 images.', party: 'client', defaultStatus: 'not_started' },
  { key: 'job_categories', phaseKey: 'prelaunch', groupKey: 'site', title: 'Provide job categories', description: 'Client shares preferred categories. Web Scribble defaults can be customized.', party: 'client', defaultStatus: 'not_started' },
  { key: 'site_copy', phaseKey: 'prelaunch', groupKey: 'site', title: 'Provide site copy', description: 'Client reviews copy and sends edits.', party: 'client', defaultStatus: 'not_started' },
  { key: 'career_tools', phaseKey: 'prelaunch', groupKey: 'site', title: 'Confirm career tools', description: 'Career advice, guides, interview coach, and offer analyzer, and whether coach tools are gated.', party: 'client', defaultStatus: 'not_started' },
  { key: 'ofccp', phaseKey: 'prelaunch', groupKey: 'site', title: 'Confirm OFCCP', description: 'Client decides whether Office of Federal Contract Compliance Programs support is enabled.', party: 'client', defaultStatus: 'not_started' },
  { key: 'faqs', phaseKey: 'prelaunch', groupKey: 'site', title: 'Review and curate FAQs', description: 'Client updates FAQs when they want changes.', party: 'client', defaultStatus: 'as_needed' },
  { key: 'career_advice', phaseKey: 'prelaunch', groupKey: 'site', title: 'Review career advice articles', description: 'Default articles arrive by RSS. Client can hide them or add their own in Smartway.', party: 'client', defaultStatus: 'as_needed' },
  { key: 'review_design', phaseKey: 'prelaunch', groupKey: 'site', title: 'Review site design and UX', description: 'Review the staging site look, feel, and experience before launch.', party: 'client', defaultStatus: 'not_started' },
  { key: 'final_review', phaseKey: 'prelaunch', groupKey: 'site', title: 'Conduct final site review', description: 'Web Scribble runs the final review before go-live approval.', party: 'webscribble', defaultStatus: 'not_started' },
  { key: 'approve_golive', phaseKey: 'prelaunch', groupKey: 'site', title: 'Approve the site to go live', description: 'Client approves the site for launch.', party: 'client', defaultStatus: 'not_started' },
  { key: 'smartway_admins', phaseKey: 'prelaunch', groupKey: 'smartway', title: 'Create Smartway admin accounts', description: 'Web Scribble creates the Smartway admin accounts. Ask the client for the email addresses that need access.', party: 'webscribble', defaultStatus: 'not_started' },
  { key: 'conduct_smartway_training', phaseKey: 'prelaunch', groupKey: 'smartway', title: 'Conduct Smartway training', description: 'Tour of Smartway: reports, content, and marketing tools. Can happen before or after launch.', party: 'webscribble', defaultStatus: 'not_started' },
  { key: 'sso_credentials', phaseKey: 'prelaunch', groupKey: 'sso', title: 'Provide SSO test credentials', description: 'Member and non-member test accounts for SSO testing.', party: 'client', defaultStatus: 'not_started' },
  { key: 'setup_sso', phaseKey: 'prelaunch', groupKey: 'sso', title: 'Set up and test SSO', description: 'Web Scribble coordinates SSO setup and internal testing.', party: 'webscribble', defaultStatus: 'not_started' },
  { key: 'test_sso', phaseKey: 'prelaunch', groupKey: 'sso', title: 'Client tests SSO', description: 'Client confirms SSO and flags tweaks.', party: 'client', defaultStatus: 'not_started' },
  { key: 'knowledge_base', phaseKey: 'prelaunch', groupKey: 'resources', title: 'Share knowledge base', description: 'Send the Web Scribble knowledge base link and how to get support.', party: 'webscribble', defaultStatus: 'not_started' },
  { key: 'transfer_domain', phaseKey: 'launch', groupKey: 'golive', title: 'Transfer domain', description: 'Point the jobs CNAME to lb1.webscribble.co and tell Web Scribble when DNS is updated.', party: 'client', defaultStatus: 'not_started' },
  { key: 'launch_career_center', phaseKey: 'launch', groupKey: 'golive', title: 'Launch the career center', description: 'After DNS is updated, confirm the go-live moment.', party: 'webscribble', defaultStatus: 'not_started' },
  { key: 'widgets_rss', phaseKey: 'launch', groupKey: 'golive', title: 'Add widgets and RSS to the main site', description: 'Use the Smartway publishing suite for widgets, HTML, and RSS on high-traffic pages.', party: 'client', defaultStatus: 'as_needed' },
  { key: 'post_launch_troubleshooting', phaseKey: 'after', groupKey: 'tech_support', title: 'Post-launch troubleshooting', description: 'help@webscribble.com for issues right after launch.', party: 'webscribble', defaultStatus: 'as_needed' },
  { key: 'ongoing_tech_support', phaseKey: 'after', groupKey: 'tech_support', title: 'Ongoing technical support', description: 'Ongoing site support through help@webscribble.com.', party: 'webscribble', defaultStatus: 'as_needed' },
  { key: 'post_launch_meeting', phaseKey: 'after', groupKey: 'client_success', title: 'Set up the post-launch meeting', description: 'Move the weekly working session to a standing monthly meeting.', party: 'webscribble', defaultStatus: 'not_started' },
  { key: 'additional_training', phaseKey: 'after', groupKey: 'client_success', title: 'Additional training', description: 'Schedule more training when the client needs it.', party: 'webscribble', defaultStatus: 'as_needed' },
  { key: 'ongoing_success', phaseKey: 'after', groupKey: 'client_success', title: 'Ongoing client success', description: 'Named client-success contact stays available after launch.', party: 'webscribble', defaultStatus: 'as_needed' },
]

export const LAUNCH_TEMPLATE: LaunchTemplateTask[] = raw.map((task, index) => ({
  ...task,
  sort: (index + 1) * 10,
}))

/** Old task keys whose status should copy onto a template task. Hidden from Earlier tasks. */
export const LEGACY_STATUS_SOURCES: Record<string, string> = {
  review_design: 'site_design',
  import_initial_data: 'data_import',
  import_final_data: 'data_import',
  setup_sso: 'sso',
  conduct_smartway_training: 'smartway_training',
  develop_offers: 'pricing_plan',
  approve_offers: 'pricing_plan',
  launch_career_center: 'launch',
}

export const MAPPED_LEGACY_KEYS = new Set(Object.values(LEGACY_STATUS_SOURCES))

export const LAUNCH_STATUS_LABELS: Record<LaunchTaskStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  complete: 'Complete',
  na: 'N/A',
  as_needed: 'As needed',
}

export const LAUNCH_PARTY_LABELS: Record<LaunchParty, string> = {
  client: 'Client',
  webscribble: 'Web Scribble',
}

/** Tasks the implementation specialist does, or has to collect from the client. */
export const IMPLEMENTATION_TASK_KEYS = new Set([
  'import_initial_data',
  'import_final_data',
  'setup_thrive',
  'update_pricing',
  'job_categories',
  'branding',
  'header_images',
  'smartway_admins',
  'conduct_smartway_training',
  'sso_credentials',
  'setup_sso',
])

export type TeamRole = 'implementation' | 'csm'

export function taskTeamRole(task: { key: string; party: LaunchParty; groupKey: string }): TeamRole | null {
  if (task.groupKey === 'golive' || IMPLEMENTATION_TASK_KEYS.has(task.key)) return 'implementation'
  if (task.party === 'webscribble') return 'csm'
  return null
}

export function isLaunchApplicable(status: LaunchTaskStatus): boolean {
  return status !== 'na' && status !== 'as_needed'
}

const CLIENT_SENDS = /\bclients?\b(?:\s+\w+){0,2}\s+sends?\b/i
const WEB_SCRIBBLE_DOES =
  /\b(?:web scribble|ws)\s+(?:does|do|will|imports?|configures?|proposes?|runs?|coordinates?|creates?|conducts?|provides?|sets?\s+up|reviews?|launches?|handles?|completes?|walks?\s+through)\b/i

/** Client filter: “Client sends…”. Web Scribble filter: Web Scribble is the one doing the work. */
export function taskMatchesOwner(
  task: { title: string; description?: string; party: LaunchParty; comments?: { body: string }[] },
  owner: LaunchParty
): boolean {
  const text = [task.title, task.description ?? '', ...(task.comments ?? []).map((comment) => comment.body)].join('\n')
  const clientSends = CLIENT_SENDS.test(text)
  const webScribbleDoes = WEB_SCRIBBLE_DOES.test(text)
  if (clientSends || webScribbleDoes) {
    if (owner === 'client') return clientSends
    return webScribbleDoes
  }
  return task.party === owner
}

export function launchBoardProgress(tasks: { status: LaunchTaskStatus; legacy?: boolean }[]): number {
  const applicable = tasks.filter((task) => !task.legacy && isLaunchApplicable(task.status))
  if (applicable.length === 0) return 0
  const done = applicable.filter((task) => task.status === 'complete').length
  return Math.round((done / applicable.length) * 100)
}

export function currentLaunchStage(
  tasks: { phaseKey: string; status: LaunchTaskStatus; legacy?: boolean }[]
): string {
  for (const phase of LAUNCH_PHASES) {
    const applicable = tasks.filter(
      (task) => task.phaseKey === phase.key && !task.legacy && isLaunchApplicable(task.status)
    )
    if (applicable.some((task) => task.status !== 'complete')) return phase.title
  }
  return 'Complete'
}
