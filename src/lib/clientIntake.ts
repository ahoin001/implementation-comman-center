import type { LaunchTaskStatus } from '@/lib/launchTemplate'

export type IntakeGroup = 'Images' | 'Credentials' | 'Files' | 'Notes'

export interface IntakeSlotDef {
  key: string
  label: string
  hint?: string
  width?: number
  height?: number
  /** Path on the client's career center, so they can see where this image shows. */
  previewPath?: string
  /** File picker filter. Image slots with a size still accept PNG and JPG only. */
  accept?: string
}

export interface IntakeGuide {
  href: string
  label: string
  caption: string
  /** Open the guide in the page. Other guides open in a new tab. */
  image?: boolean
}

export const JOB_CATEGORY_LIST_URL =
  'https://docs.google.com/document/d/1nu7MJp3xtEgNM3hYrYPQtQirtZUwwB9sTAu6wZeF5aM/edit?usp=sharing'

export const IMPORT_DATA_GUIDE_URL = '/guides/import-data-format.png'

export interface IntakeCardDef {
  taskKey: string
  group: IntakeGroup
  title: string
  detail: string
  kind: 'image' | 'file' | 'credentials' | 'text' | 'external'
  slots: IntakeSlotDef[]
  /** Extra files use slot keys file-<uuid>. The card is done once one file is in. */
  multiFile?: boolean
  guide?: IntakeGuide
}

export const INTAKE_CARDS: IntakeCardDef[] = [
  {
    taskKey: 'header_images',
    group: 'Images',
    title: 'Header images',
    detail: 'PNG or JPG at the exact size for each page, plus a logo. You can send them one at a time.',
    kind: 'image',
    slots: [
      { key: 'homepage', label: 'Homepage hero', hint: '1920 × 424', width: 1920, height: 424, previewPath: '/' },
      { key: 'career', label: 'Career resources', hint: '1920 × 334', width: 1920, height: 334, previewPath: '/career-resources' },
      { key: 'pricing', label: 'Pricing page', hint: '1920 × 257', width: 1920, height: 257, previewPath: '/employer-offers' },
      { key: 'logo', label: 'Logo', hint: 'PNG, JPG, or EPS', accept: '.png,.jpg,.jpeg,.eps,image/png,image/jpeg,application/postscript' },
    ],
  },
  {
    taskKey: 'sso_credentials',
    group: 'Credentials',
    title: 'SSO test credentials',
    detail: 'A member account and a non-member account, so we can test sign-in.',
    kind: 'credentials',
    slots: [
      { key: 'member', label: 'Member test account' },
      { key: 'non_member', label: 'Non-member test account' },
    ],
  },
  {
    taskKey: 'branding',
    group: 'Files',
    title: 'Brand guidelines',
    detail: 'Any brand guidelines. The logo goes with the header images.',
    kind: 'file',
    slots: [],
    multiFile: true,
  },
  {
    taskKey: 'send_initial_export',
    group: 'Files',
    title: 'Import data',
    detail: 'One file for each set. Match the column guide, including any custom fields you need to keep.',
    kind: 'file',
    guide: {
      href: IMPORT_DATA_GUIDE_URL,
      label: 'How to format the data',
      caption: 'Use these columns for each file. Download the guide if you want it open while you prepare the export.',
      image: true,
    },
    slots: [
      { key: 'jobseekers', label: 'Jobseekers' },
      { key: 'employers', label: 'Employers' },
      { key: 'resumes', label: 'Resumes' },
      { key: 'jobs', label: 'Jobs' },
      { key: 'billing', label: 'Transaction / billing history' },
    ],
  },
  {
    taskKey: 'send_resumes',
    group: 'Files',
    title: 'CVs and resumes',
    detail: 'Resume files for the site.',
    kind: 'file',
    slots: [],
    multiFile: true,
  },
  {
    taskKey: 'provide_ach_w9',
    group: 'Files',
    title: 'ACH and W-9',
    detail: 'Upload both documents in the file manager. Mark each one here after it is there. These files are not stored in this checklist.',
    kind: 'external',
    slots: [
      { key: 'ach', label: 'ACH form' },
      { key: 'w9', label: 'W-9' },
    ],
  },
  {
    taskKey: 'job_categories',
    group: 'Notes',
    title: 'Job categories',
    detail: 'Paste the categories you want, including any custom names that are not on the list.',
    kind: 'text',
    guide: {
      href: JOB_CATEGORY_LIST_URL,
      label: 'Category list',
      caption: 'Copy and paste any categories from this list, and add custom category names that are not on it.',
    },
    slots: [{ key: 'body', label: 'Categories' }],
  },
]

export const INTAKE_GROUPS: IntakeGroup[] = ['Images', 'Credentials', 'Files', 'Notes']

export interface IntakeFlags {
  ssoEnabled: boolean
  imageAssets: string
  hasResumeData: boolean
  thriveNa: boolean
}

export interface IntakeSlotState {
  taskKey: string
  slotKey: string
  kind: 'file' | 'text' | 'credentials'
  fileName?: string
  width?: number
  height?: number
  text?: string
}

const CLOSED = new Set(['complete', 'na'])

export function visibleIntakeCards(
  tasks: Record<string, string>,
  flags: IntakeFlags
): IntakeCardDef[] {
  return INTAKE_CARDS.filter((card) => {
    const status = tasks[card.taskKey]
    if (status && CLOSED.has(status)) return false
    if (card.taskKey === 'header_images' && flags.imageAssets === 'not_providing') return false
    if (card.taskKey === 'sso_credentials' && !flags.ssoEnabled) return false
    if (card.taskKey === 'send_resumes' && !flags.hasResumeData) return false
    return true
  })
}

export function slotsFor(card: IntakeCardDef, received: IntakeSlotState[]): IntakeSlotState[] {
  return received.filter((slot) => slot.taskKey === card.taskKey)
}

export function cardFullyReceived(card: IntakeCardDef, received: IntakeSlotState[]) {
  const mine = slotsFor(card, received)
  if (card.multiFile) return mine.length > 0
  return card.slots.every((slot) => mine.some((item) => item.slotKey === slot.key))
}

export type ClientIntakePhase = 'changes' | 'needed' | 'review' | 'accepted' | 'skipped' | 'hidden'

function optedOut(taskKey: string, flags: IntakeFlags) {
  if (taskKey === 'header_images' && flags.imageAssets === 'not_providing') return true
  if (taskKey === 'sso_credentials' && !flags.ssoEnabled) return true
  if (taskKey === 'send_resumes' && !flags.hasResumeData) return true
  return false
}

/** What the client should understand about this handoff. Complete is only an acceptance. */
export function clientIntakePhase(
  card: IntakeCardDef,
  status: string | undefined,
  received: IntakeSlotState[],
  flags: IntakeFlags,
  reviewNote?: string
): ClientIntakePhase {
  if (status === 'na') return 'skipped'
  if (status === 'complete') return 'accepted'
  if (optedOut(card.taskKey, flags)) return 'hidden'
  if (reviewNote?.trim()) return 'changes'
  if (cardFullyReceived(card, received)) return 'review'
  return 'needed'
}

export function namedSlot(received: IntakeSlotState[], taskKey: string, slotKey: string) {
  return received.find((slot) => slot.taskKey === taskKey && slot.slotKey === slotKey)
}

export function isClosedStatus(status: LaunchTaskStatus | string | undefined) {
  return status === 'complete' || status === 'na'
}

export function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const width = image.naturalWidth
      const height = image.naturalHeight
      URL.revokeObjectURL(url)
      resolve({ width, height })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image'))
    }
    image.src = url
  })
}

export function newFileSlotKey() {
  return `file-${crypto.randomUUID()}`
}
