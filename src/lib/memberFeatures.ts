import type { MemberFeatureDefinition } from '@/types'

export function normalizeMemberFeatures(
  raw?: Record<string, boolean> | null
): Record<string, boolean> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, boolean> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (value) out[key] = true
  }
  return out
}

export function countEnabledMemberFeatures(
  features: Record<string, boolean> | undefined,
  definitions: MemberFeatureDefinition[]
): number {
  if (!features) return 0
  return definitions.filter((d) => Boolean(features[d.id])).length
}

export const DEFAULT_MEMBER_FEATURE_LABELS = [
  'Member job pricing',
  'Members see jobs first',
  'Only members can access job board',
  'Only members can apply to jobs',
  'Member-only job visibility',
] as const
