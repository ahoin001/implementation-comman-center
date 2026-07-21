import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import type { DeliverableKey, Project } from '@/types'
import { DELIVERABLE_LABELS, REQUIRED_DOC_KEYS } from '@/types'
import { cn } from '@/lib/utils'

interface DeliverableCheckboxProps {
  deliverableKey: DeliverableKey
  project: Project
  onToggle: (key: DeliverableKey, received: boolean) => void
  onNoteChange?: (key: DeliverableKey, note: string) => void
  required?: boolean
  compact?: boolean
}

export function DeliverableCheckbox({
  deliverableKey,
  project,
  onToggle,
  onNoteChange,
  required = false,
  compact = false,
}: DeliverableCheckboxProps) {
  const item = project.deliverables[deliverableKey]
  const checked = Boolean(item?.received)
  const [noteDraft, setNoteDraft] = useState(item?.note ?? '')

  useEffect(() => {
    setNoteDraft(item?.note ?? '')
  }, [item?.note, deliverableKey])

  return (
    <div className={cn(!compact && 'space-y-1.5')}>
      <label
        className={cn(
          'flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-1.5 text-sm cursor-pointer transition-colors duration-150',
          'hover:bg-black/5 dark:hover:bg-white/5',
          checked ? 'text-[var(--color-foreground)]' : 'text-[var(--color-muted-foreground)]'
        )}
      >
        <span
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-150',
            checked
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
              : 'border-[var(--color-border)] bg-[var(--color-card-solid)]'
          )}
        >
          {checked && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onToggle(deliverableKey, e.target.checked)}
        />
        <span className={cn('flex-1 min-w-0', checked && 'line-through opacity-70')}>
          {DELIVERABLE_LABELS[deliverableKey]}
        </span>
        {required && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-danger)]/80 shrink-0">
            Required
          </span>
        )}
      </label>
      {!compact && onNoteChange && (
        <input
          type="text"
          value={noteDraft}
          placeholder="Note…"
          onChange={(e) => setNoteDraft(e.target.value)}
          onBlur={() => {
            if ((item?.note ?? '') !== noteDraft) {
              onNoteChange(deliverableKey, noteDraft)
            }
          }}
          className="ml-7 w-[calc(100%-1.75rem)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-transparent px-2 py-1 text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40"
        />
      )}
    </div>
  )
}

interface DeliverableChipProps {
  deliverableKey: DeliverableKey
  received: boolean
}

export function DeliverableChip({ deliverableKey, received }: DeliverableChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
        received
          ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]'
          : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
      )}
    >
      {received ? '✓' : '·'} {DELIVERABLE_LABELS[deliverableKey]}
    </span>
  )
}

export function RequiredDocsCallout({
  missing,
  onFocusKickoff,
}: {
  missing: string[]
  onFocusKickoff?: () => void
}) {
  if (missing.length === 0) return null
  return (
    <button
      type="button"
      onClick={onFocusKickoff}
      className="w-full text-left rounded-[var(--radius-md)] border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/[0.04] px-3 py-2 text-xs text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/[0.07]"
    >
      Missing required docs: {missing.join(' · ')}
    </button>
  )
}

export function isRequiredDocKey(key: DeliverableKey): boolean {
  return REQUIRED_DOC_KEYS.includes(key)
}
