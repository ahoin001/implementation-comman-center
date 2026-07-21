import type { DeliverableItem, DeliverableKey, Project, ProjectDeliverables } from '@/types'
import {
  DELIVERABLE_KEYS,
  DELIVERABLE_LABELS,
  REQUIRED_DOC_KEYS,
} from '@/types'
import { isSsoEnabled } from '@/lib/pathConfig'

export function createDefaultDeliverables(
  overrides: Partial<ProjectDeliverables> = {}
): ProjectDeliverables {
  return DELIVERABLE_KEYS.reduce((acc, key) => {
    acc[key] = {
      received: false,
      ...overrides[key],
    }
    return acc
  }, {} as ProjectDeliverables)
}

export function normalizeDeliverables(
  raw?: Partial<Record<DeliverableKey, Partial<DeliverableItem>>> | null
): ProjectDeliverables {
  return createDefaultDeliverables(
    Object.fromEntries(
      DELIVERABLE_KEYS.map((key) => [
        key,
        {
          received: Boolean(raw?.[key]?.received),
          note: raw?.[key]?.note,
          receivedAt: raw?.[key]?.receivedAt,
        },
      ])
    ) as Partial<ProjectDeliverables>
  )
}

export function isDeliverableReceived(
  project: Project,
  key: DeliverableKey
): boolean {
  return Boolean(project.deliverables?.[key]?.received)
}

/** ACH and W-9 — gates Missing Docs badge / filter */
export function isRequiredDocsComplete(project: Project): boolean {
  return REQUIRED_DOC_KEYS.every((key) => isDeliverableReceived(project, key))
}

export function getMissingRequiredDocs(project: Project): string[] {
  return REQUIRED_DOC_KEYS.filter((key) => !isDeliverableReceived(project, key)).map(
    (key) => DELIVERABLE_LABELS[key]
  )
}

/** Relevant deliverables for progress (exclude SSO creds when SSO off) */
export function getActiveDeliverableKeys(project: Project): DeliverableKey[] {
  return DELIVERABLE_KEYS.filter((key) => {
    if (key === 'sso_test_credentials' && !isSsoEnabled(project)) return false
    return true
  })
}

export function getDeliverableProgress(project: Project): { received: number; total: number } {
  const keys = getActiveDeliverableKeys(project)
  const received = keys.filter((key) => isDeliverableReceived(project, key)).length
  return { received, total: keys.length }
}

export function applyDeliverablePatch(
  current: ProjectDeliverables | undefined,
  key: DeliverableKey,
  patch: Partial<DeliverableItem>
): ProjectDeliverables {
  const base = normalizeDeliverables(current)
  const prev = base[key]
  const received = patch.received ?? prev.received
  return {
    ...base,
    [key]: {
      ...prev,
      ...patch,
      received,
      receivedAt: received
        ? patch.receivedAt ?? prev.receivedAt ?? new Date().toISOString()
        : undefined,
      note: patch.note !== undefined ? patch.note || undefined : prev.note,
    },
  }
}
