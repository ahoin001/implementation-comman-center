import { isLaunchDone, type LaunchTaskStatus } from '@/lib/launchTemplate'

export function taskTitleClass(status: LaunchTaskStatus): string {
  if (status === 'in_progress') return 'font-semibold text-[var(--color-wash-strong)]'
  if (isLaunchDone(status)) {
    return 'font-normal text-[var(--color-ink-soft)] line-through decoration-[color-mix(in_srgb,var(--color-ink-soft)_65%,transparent)]'
  }
  if (status === 'as_needed') return 'font-medium text-[var(--color-ink-soft)]'
  return 'font-medium text-[var(--color-ink)]'
}

export function taskMarkClass(status: LaunchTaskStatus): string {
  if (isLaunchDone(status)) return 'border-[var(--color-wash-strong)] bg-[var(--color-wash-strong)] text-white'
  if (status === 'in_progress') return 'border-[var(--color-wash-strong)] bg-[var(--color-wash)]'
  return 'border-[color-mix(in_srgb,var(--color-ink)_22%,transparent)] bg-[var(--color-panel)]'
}

export function taskStatusTriggerClass(status: LaunchTaskStatus): string {
  if (status === 'in_progress') return 'bg-[var(--color-wash)] font-medium text-[var(--color-wash-strong)]'
  if (isLaunchDone(status)) return 'bg-[var(--color-field)] font-medium text-[var(--color-ink-soft)]'
  return 'bg-[var(--color-panel)] text-[var(--color-ink)]'
}
