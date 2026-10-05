import { useRef } from 'react'
import { Calendar, ExternalLink, Globe, User } from 'lucide-react'
import type { Contact } from '@/types'
import { ContactGlance } from '@/components/project/ContactGlance'
import { formatLaunchDate } from '@/lib/health'

interface ProjectHeroMetaProps {
  launchDate?: string
  daysRemaining: number | null
  stagingUrl?: string
  contact: Contact
  onLaunchDateChange: (value: string | undefined) => void
  onContactSave: (contact: Partial<Contact>) => void
}

export function ProjectHeroMeta({
  launchDate,
  daysRemaining,
  stagingUrl,
  contact,
  onLaunchDateChange,
  onContactSave,
}: ProjectHeroMetaProps) {
  const dateInputRef = useRef<HTMLInputElement>(null)
  const dateValue = launchDate?.split('T')[0] ?? ''

  const openDatePicker = () => {
    const el = dateInputRef.current
    if (!el) return
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker()
      } catch {
        el.focus()
      }
    } else {
      el.focus()
    }
  }

  const host = stagingUrl
    ? (() => {
        try {
          return new URL(stagingUrl).host
        } catch {
          return stagingUrl
        }
      })()
    : null

  const countdown =
    daysRemaining === null
      ? launchDate
        ? null
        : 'Click to set'
      : daysRemaining < 0
        ? `${Math.abs(daysRemaining)} days past`
        : daysRemaining === 0
          ? 'Today'
          : `${daysRemaining} days left`

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <div className="rounded-2xl bg-[var(--color-field)] p-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-soft)]">
          <Calendar className="h-3.5 w-3.5" />
          Launch date
        </p>
        <button
          type="button"
          onClick={openDatePicker}
          className="relative mt-2 w-full rounded-xl text-left"
        >
          <input
            ref={dateInputRef}
            type="date"
            value={dateValue}
            onChange={(event) => onLaunchDateChange(event.target.value || undefined)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Set launch date"
          />
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            {launchDate ? formatLaunchDate(launchDate) : 'No date set'}
          </p>
          {countdown && (
            <p
              className={
                daysRemaining !== null && daysRemaining < 0
                  ? 'mt-0.5 text-xs text-[var(--color-danger)]'
                  : 'mt-0.5 text-xs text-[var(--color-ink-soft)]'
              }
            >
              {countdown}
            </p>
          )}
        </button>
      </div>

      <div className="rounded-2xl bg-[var(--color-field)] p-3">
        <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-soft)]">
          <Globe className="h-3.5 w-3.5" />
          Staging
        </p>
        {stagingUrl ? (
          <a
            href={stagingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-2 flex items-start gap-1.5"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[var(--color-wash-strong)] group-hover:underline">
                {host}
              </span>
              <span className="mt-0.5 block truncate text-xs text-[var(--color-ink-soft)]">{stagingUrl}</span>
            </span>
            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-ink-soft)]" />
          </a>
        ) : (
          <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">No staging URL</p>
        )}
      </div>

      <div className="rounded-2xl bg-[var(--color-field)] p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-soft)]">
          <User className="h-3.5 w-3.5" />
          Main contact
        </p>
        <ContactGlance contact={contact} onSave={onContactSave} variant="meta" />
      </div>
    </div>
  )
}
