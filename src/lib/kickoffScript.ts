import type { Project } from '@/types'

export interface KickoffRecord {
  hiddenChapters: string[]
  hiddenSteps: string[]
  hiddenPrompts: string[]
  answers: Record<string, string>
}

export type KickoffSync = 'launchDate' | 'contactName' | 'contactEmail' | 'sso'

export interface KickoffChoice {
  value: string
  label: string
}

export interface KickoffPrompt {
  id: string
  label: string
  kind: 'text' | 'long' | 'date' | 'choice'
  placeholder?: string
  choices?: KickoffChoice[]
  /** Words to read to the client. */
  read?: string
  /** Stage direction. Not read aloud. */
  cue?: string
  when?: { prompt: string; is: string[] }
  /** Stage direction shown only for these answers. */
  cueWhen?: { prompt: string; is: string[] }
  sync?: KickoffSync
}

export interface KickoffBlock {
  read?: string
  cue?: string
}

export interface KickoffStep {
  id: string
  title: string
  blocks: KickoffBlock[]
  prompts: KickoffPrompt[]
}

export interface KickoffChapter {
  id: string
  title: string
  steps: KickoffStep[]
}

const yesNo = (later = false): KickoffChoice[] => [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  ...(later ? [{ value: 'later', label: 'Decide later' }] : []),
  { value: 'unsure', label: 'Not sure' },
]

export const KICKOFF: KickoffChapter[] = [
  {
    id: 'intro',
    title: 'Introductions',
    steps: [
      {
        id: 'intro',
        title: 'Introductions',
        blocks: [
          {
            cue: 'Ask each person on the Web Scribble team to introduce themselves and their role, then ask the client-side participants to do the same.',
          },
        ],
        prompts: [
          {
            id: 'attendees',
            label: 'Who is on the call',
            kind: 'long',
            placeholder: 'Name, role, and which side they are on',
          },
        ],
      },
    ],
  },
  {
    id: 'framing',
    title: 'Framing',
    steps: [
      {
        id: 'framing',
        title: 'Framing the conversation',
        blocks: [
          {
            read: 'Today, we’ll be getting to know you better and covering the information we need to get your career center up and running, what we need you to review and approve prior to launch, and the next steps between now and launch.',
          },
          {
            read: 'As we go, we may find that we need another meeting for an essential pre-launch topic. If that happens, we will work with you so it fits your schedule and we use the time well. We know you’re busy.',
          },
        ],
        prompts: [
          {
            id: 'extra-meetings',
            label: 'Meetings to set up',
            kind: 'long',
            placeholder: 'Topic, who should be there, and any timing',
          },
        ],
      },
    ],
  },
  {
    id: 'contacts',
    title: 'Key contacts',
    steps: [
      {
        id: 'contacts',
        title: 'Key contacts',
        blocks: [
          {
            read: 'We are excited to be partnering with you, and we want to be sure we have the key contact information for your team.',
          },
        ],
        prompts: [
          {
            id: 'sponsor',
            label: 'Executive sponsor',
            kind: 'long',
            placeholder: 'Name, title, and how involved they are',
            read: 'Who is the executive sponsor for your career center? By that we mean the person on your executive team who has oversight and interest in the career center’s results. This role matters for success, so if you don’t have a sponsor yet, we would like to help identify the right person.',
          },
          {
            id: 'day-to-day',
            label: 'Day-to-day contact',
            kind: 'text',
            placeholder: 'Name',
            read: 'Who is the day-to-day contact?',
            sync: 'contactName',
          },
          {
            id: 'day-to-day-email',
            label: 'Email',
            kind: 'text',
            placeholder: 'name@association.org',
            sync: 'contactEmail',
          },
        ],
      },
    ],
  },
  {
    id: 'know',
    title: 'Getting to know you',
    steps: [
      {
        id: 'know',
        title: 'Getting to know you',
        blocks: [
          {
            read: 'Our colleagues on the sales team have shared some foundational knowledge. We would like to learn more, and to hear it directly from you.',
          },
        ],
        prompts: [
          {
            id: 'org',
            label: 'About the organization',
            kind: 'long',
            placeholder: 'Membership structure, membership total, anything we should know',
            read: 'What is important for us to know about your organization? For example, membership structure and membership total.',
          },
          {
            id: 'goals',
            label: 'Goals for the career center',
            kind: 'long',
            placeholder: 'Member benefit, revenue, new members, or something else',
            read: 'What are your goals for the career center? Is it a member benefit, a revenue stream, a way to get new members, all of these, or something else?',
          },
        ],
      },
    ],
  },
  {
    id: 'running',
    title: 'Up and running',
    steps: [
      {
        id: 'vendor',
        title: 'Previous vendor',
        blocks: [
          {
            cue: 'Ask this only when they are leaving another career-center vendor.',
          },
        ],
        prompts: [
          {
            id: 'has-vendor',
            label: 'Current vendor',
            kind: 'choice',
            read: 'Are you moving off a current career-center vendor?',
            choices: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'unsure', label: 'Not sure' },
            ],
          },
          {
            id: 'contract-end',
            label: 'Contract ends',
            kind: 'date',
            read: 'When is your contract up with your current vendor?',
            when: { prompt: 'has-vendor', is: ['yes'] },
          },
          {
            id: 'vendor-notice',
            label: 'Notice given',
            kind: 'choice',
            read: 'Have you given notice to your current vendor?',
            choices: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'Not yet' },
            ],
            when: { prompt: 'has-vendor', is: ['yes'] },
          },
          {
            id: 'vendor-note',
            label: 'Vendor notes',
            kind: 'long',
            placeholder: 'Vendor name, notice timing, who is handling it',
            cue: 'If they have not given notice, tell them this is the most important step.',
            cueWhen: { prompt: 'vendor-notice', is: ['no'] },
            when: { prompt: 'has-vendor', is: ['yes'] },
          },
        ],
      },
      {
        id: 'launch',
        title: 'Launch date',
        blocks: [],
        prompts: [
          {
            id: 'launch-date',
            label: 'Target launch',
            kind: 'date',
            read: 'When are you looking to launch your career center with Web Scribble?',
            sync: 'launchDate',
          },
          {
            id: 'launch-note',
            label: 'Timing notes',
            kind: 'long',
            placeholder: 'Events, a board meeting, or a date they cannot miss',
          },
        ],
      },
      {
        id: 'branding',
        title: 'Branding',
        blocks: [
          {
            read: 'To keep the career center and related materials aligned with your branding, we will need brand guidelines, your logo in eps, jpg, and png, and guidance on imagery. You can also send us images to use.',
          },
          {
            read: 'We will recap this in the first follow-up after this meeting, so you don’t need to do anything about it right now.',
          },
        ],
        prompts: [
          {
            id: 'brand-note',
            label: 'Brand notes',
            kind: 'long',
            placeholder: 'Who will send files, or any guidance they offered',
          },
        ],
      },
      {
        id: 'data',
        title: 'Data',
        blocks: [
          {
            read: 'To build the new career center, we gather transactional data and data about existing employers, job seekers, and active job postings, so they move over smoothly. We also need Google Analytics data.',
          },
        ],
        prompts: [
          {
            id: 'data-access',
            label: 'Who can pull the data',
            kind: 'choice',
            read: 'Can you access this career-center data on your own, or do you need to work with another partner?',
            choices: [
              { value: 'self', label: 'They can pull it' },
              { value: 'partner', label: 'They need a partner' },
              { value: 'na', label: 'Not applicable' },
            ],
          },
          {
            id: 'data-note',
            label: 'Data notes',
            kind: 'long',
            placeholder: 'Who will request it, and any system names',
            cue: 'If they can pull it: you will send the fields we need and instructions for downloading. If they cannot: give them a clear list of the data points and reports, and tell them to submit the request as soon as possible and follow up more than once.',
            when: { prompt: 'data-access', is: ['self', 'partner'] },
          },
        ],
      },
      {
        id: 'technical',
        title: 'Technical',
        blocks: [],
        prompts: [
          {
            id: 'tech-contact',
            label: 'Technical contact',
            kind: 'text',
            placeholder: 'Name and how to reach them',
            read: 'Who will be our technical point of contact, so launch stays smooth?',
          },
          {
            id: 'keep-url',
            label: 'Keep the current URL',
            kind: 'choice',
            read: 'A best practice is to keep your current career center URL. Can you confirm that you want to keep it?',
            choices: [
              { value: 'yes', label: 'Keep it' },
              { value: 'no', label: 'New URL' },
              { value: 'unsure', label: 'Not sure' },
            ],
          },
          {
            id: 'career-url',
            label: 'Current URL',
            kind: 'text',
            placeholder: 'https://',
            when: { prompt: 'keep-url', is: ['yes', 'no'] },
          },
          {
            id: 'ams',
            label: 'AMS',
            kind: 'text',
            placeholder: 'The system they use',
            read: 'What AMS do you use?',
          },
          {
            id: 'higher-logic',
            label: 'Higher Logic',
            kind: 'choice',
            read: 'Do you use Higher Logic?',
            choices: yesNo(),
          },
          {
            id: 'thrive',
            label: 'On Thrive',
            kind: 'choice',
            read: 'Are you on the Thrive version of the Higher Logic community platform?',
            choices: yesNo(),
            when: { prompt: 'higher-logic', is: ['yes'] },
          },
          {
            id: 'thrive-jobs',
            label: 'Thrive Jobs',
            kind: 'choice',
            read: 'Do you want the Thrive Jobs integration?',
            choices: [
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'later', label: 'Decide later' },
            ],
            when: { prompt: 'thrive', is: ['yes'] },
          },
          {
            id: 'considering-thrive',
            label: 'Considering Thrive',
            kind: 'choice',
            read: 'Are you considering Higher Logic Thrive?',
            choices: yesNo(),
            when: { prompt: 'higher-logic', is: ['no'] },
          },
          {
            id: 'sso',
            label: 'SSO',
            kind: 'choice',
            read: 'Do you want SSO turned on?',
            choices: yesNo(),
            sync: 'sso',
          },
        ],
      },
      {
        id: 'revenue',
        title: 'Revenue, offers, and pricing',
        blocks: [
          {
            cue: 'Offer the resume database and bundled advertising only if they have it today or they ask for it.',
          },
          {
            read: 'We will analyze your transaction history to develop offers and pricing. After launch, we will meet with your executive team to share that assessment and set revenue expectations.',
          },
          {
            read: 'Our pricing model is simple, and it is built to increase employer spend. We research your niche so the offers stay competitive.',
          },
        ],
        prompts: [
          {
            id: 'pricing-model',
            label: 'Pricing',
            kind: 'choice',
            read: 'Do you want member and non-member pricing, or one set of prices?',
            choices: [
              { value: 'both', label: 'Member and non-member' },
              { value: 'one', label: 'One set of prices' },
              { value: 'later', label: 'Decide later' },
            ],
          },
          {
            id: 'job-watch',
            label: 'Job Watch',
            kind: 'choice',
            read: 'Do you want to offer the Job Watch benefit?',
            choices: yesNo(),
          },
          {
            id: 'ads',
            label: 'Ads on the career center',
            kind: 'choice',
            read: 'Are you comfortable with ads on your career center?',
            choices: yesNo(),
          },
          {
            id: 'special-postings',
            label: 'Special postings',
            kind: 'long',
            placeholder: 'Internships, volunteer roles, packages, promotions',
            read: 'Do you offer special postings, such as internships or volunteer opportunities, or packages and promotions you want to keep offering?',
          },
        ],
      },
      {
        id: 'sales',
        title: 'Sales',
        blocks: [
          {
            read: 'Our dedicated sales representative will prospect and manage employer relationships to grow your revenue.',
          },
        ],
        prompts: [
          {
            id: 'sales-note',
            label: 'Sales notes',
            kind: 'long',
            placeholder: 'Who they want involved, or anything sales should know',
          },
        ],
      },
      {
        id: 'testing',
        title: 'Testing and training',
        blocks: [
          {
            read: 'We will provide a staging site for your feedback, and training on the Smartway admin portal. After launch, our team supports your users.',
          },
        ],
        prompts: [
          {
            id: 'training-note',
            label: 'Training notes',
            kind: 'long',
            placeholder: 'Who should be trained, and any timing they mentioned',
          },
        ],
      },
      {
        id: 'marketing',
        title: 'Marketing',
        blocks: [
          {
            read: 'We provide tools and collateral — emails, banners, and press releases — to help you promote the launch.',
          },
        ],
        prompts: [
          {
            id: 'marketing-note',
            label: 'Marketing notes',
            kind: 'long',
            placeholder: 'Channels they already use, or a person who owns promotion',
          },
        ],
      },
    ],
  },
  {
    id: 'wrap',
    title: 'Wrap-up',
    steps: [
      {
        id: 'wrap',
        title: 'Wrap-up and next steps',
        blocks: [
          {
            read: 'I will send an email after this call that recaps what we need to move site setup and design forward. I will be your key contact for technical questions, and I will collect key data, your ACH and W-9 forms, and the other setup and design information.',
          },
          {
            read: 'Before launch, we will ask you to review and approve offers and pricing, then site setup and design, and finally to give the official approval that we are a go to launch.',
          },
          {
            read: 'As we wrap up, do you have any questions? Are you feeling clear about where we’re headed between now and your launch date?',
          },
        ],
        prompts: [
          {
            id: 'their-questions',
            label: 'Their questions',
            kind: 'long',
            placeholder: 'What they asked, and what you promised to follow up on',
          },
          {
            id: 'clarity',
            label: 'How clear they are',
            kind: 'choice',
            choices: [
              { value: 'yes', label: 'Clear' },
              { value: 'mostly', label: 'Mostly' },
              { value: 'no', label: 'Not yet' },
            ],
          },
          {
            id: 'clarity-note',
            label: 'What is still fuzzy',
            kind: 'long',
            placeholder: 'The part to revisit before the next email',
            when: { prompt: 'clarity', is: ['mostly', 'no'] },
          },
        ],
      },
    ],
  },
]

export function emptyKickoff(): KickoffRecord {
  return { hiddenChapters: [], hiddenSteps: [], hiddenPrompts: [], answers: {} }
}

function asIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export function normalizeKickoff(raw: unknown): KickoffRecord {
  const value = raw && typeof raw === 'object' ? (raw as Partial<KickoffRecord>) : {}
  const answers: Record<string, string> = {}
  if (value.answers && typeof value.answers === 'object') {
    for (const [key, item] of Object.entries(value.answers)) {
      if (typeof item === 'string') answers[key] = item
    }
  }
  return {
    hiddenChapters: asIdList(value.hiddenChapters),
    hiddenSteps: asIdList(value.hiddenSteps),
    hiddenPrompts: asIdList(value.hiddenPrompts),
    answers,
  }
}

export function kickoffPrompt(id: string): KickoffPrompt | undefined {
  for (const chapter of KICKOFF) {
    for (const step of chapter.steps) {
      const prompt = step.prompts.find((item) => item.id === id)
      if (prompt) return prompt
    }
  }
  return undefined
}

export function kickoffValue(project: Project, prompt: KickoffPrompt): string {
  const record = normalizeKickoff(project.kickoff)
  const stored = record.answers[prompt.id]
  if (stored != null) return stored
  if (prompt.sync === 'launchDate') return project.launchDate?.slice(0, 10) ?? ''
  if (prompt.sync === 'contactName') return project.contact?.name ?? ''
  if (prompt.sync === 'contactEmail') return project.contact?.email ?? ''
  return ''
}

export function isPromptVisible(record: KickoffRecord, prompt: KickoffPrompt): boolean {
  if (record.hiddenPrompts.includes(prompt.id)) return false
  if (!prompt.when) return true
  if (record.hiddenPrompts.includes(prompt.when.prompt)) return false
  return prompt.when.is.includes(record.answers[prompt.when.prompt] ?? '')
}

export interface KickoffPlace {
  chapter: KickoffChapter
  step: KickoffStep
}

export function visibleSteps(record: KickoffRecord): KickoffPlace[] {
  const places: KickoffPlace[] = []
  for (const chapter of KICKOFF) {
    if (record.hiddenChapters.includes(chapter.id)) continue
    for (const step of chapter.steps) {
      if (record.hiddenSteps.includes(step.id)) continue
      places.push({ chapter, step })
    }
  }
  return places
}

export interface KickoffNote {
  promptId: string
  label: string
  text: string
}

export interface KickoffNoteGroup {
  stepId: string
  title: string
  notes: KickoffNote[]
}

export function kickoffAnswerText(prompt: KickoffPrompt, value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (prompt.kind === 'choice') {
    return prompt.choices?.find((choice) => choice.value === trimmed)?.label ?? trimmed
  }
  if (prompt.kind === 'date') {
    const [year, month, day] = trimmed.split('-').map(Number)
    if (!year || !month || !day) return trimmed
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  return trimmed
}

/** Captured kickoff answers for reading on the project. Synced fields stay on the project record. */
export function kickoffNotes(project: Project): KickoffNoteGroup[] {
  const record = normalizeKickoff(project.kickoff)
  const groups: KickoffNoteGroup[] = []
  for (const { step } of visibleSteps(record)) {
    const notes: KickoffNote[] = []
    for (const prompt of step.prompts) {
      if (prompt.sync) continue
      if (!isPromptVisible(record, prompt)) continue
      const stored = record.answers[prompt.id]
      if (!stored?.trim()) continue
      notes.push({
        promptId: prompt.id,
        label: prompt.label,
        text: kickoffAnswerText(prompt, stored),
      })
    }
    if (notes.length > 0) groups.push({ stepId: step.id, title: step.title, notes })
  }
  return groups
}

export function kickoffProgress(project: Project): { answered: number; total: number } {
  const record = normalizeKickoff(project.kickoff)
  let answered = 0
  let total = 0
  for (const { step } of visibleSteps(record)) {
    for (const prompt of step.prompts) {
      if (!isPromptVisible(record, prompt)) continue
      total += 1
      if (kickoffValue(project, prompt).trim()) answered += 1
    }
  }
  return { answered, total }
}

export interface SkippedKickoff {
  kind: 'chapter' | 'step' | 'prompt'
  id: string
  label: string
}

export function skippedKickoff(record: KickoffRecord): SkippedKickoff[] {
  const items: SkippedKickoff[] = []
  for (const chapter of KICKOFF) {
    if (record.hiddenChapters.includes(chapter.id)) {
      items.push({ kind: 'chapter', id: chapter.id, label: chapter.title })
      continue
    }
    for (const step of chapter.steps) {
      if (record.hiddenSteps.includes(step.id)) {
        items.push({ kind: 'step', id: step.id, label: step.title })
        continue
      }
      for (const prompt of step.prompts) {
        if (record.hiddenPrompts.includes(prompt.id)) {
          items.push({ kind: 'prompt', id: prompt.id, label: prompt.label })
        }
      }
    }
  }
  return items
}
