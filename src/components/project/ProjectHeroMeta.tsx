import { useRef, type ReactNode } from 'react'
import { Calendar, ExternalLink, Globe, User } from 'lucide-react'
import type { Contact } from '@/types'
import { ContactGlance } from '@/components/project/ContactGlance'
import { formatLaunchDate } from '@/lib/health'
import { cn } from '@/lib/utils'

interface ProjectHeroMetaProps {
  launchDate?: string
  daysRemaining: number | null
  stagingUrl?: string
  contact: Contact
  onLaunchDateChange: (value: string | undefined) => void
  onContactSave: (contact: Partial<Contact>) => void
}

function MetaCell({
  label,
  icon: Icon,
  children,
  className,
}: {
  label: string
  icon: typeof Calendar
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0 flex-1', className)}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      {children}
    </div>
  )
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

  return (
    <div className="mt-4 pt-4 border-t border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      <MetaCell label="Launch date" icon={Calendar}>
        <button
          type="button"
          onClick={openDatePicker}
          className="relative group w-full text-left rounded-[var(--radius-md)] -mx-1 px-1 py-0.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150"
        >
          <input
            ref={dateInputRef}
            type="date"
            value={dateValue}
            onChange={(e) => onLaunchDateChange(e.target.value || undefined)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="Set launch date"
          />
          <p className="text-sm font-medium text-[var(--color-foreground)] relative">
            {launchDate ? formatLaunchDate(launchDate) : 'Set launch date'}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)] relative mt-0.5">
            {daysRemaining === null && !launchDate && 'Click to set'}
            {daysRemaining !== null && daysRemaining >= 0 && `${daysRemaining} days remaining`}
            {daysRemaining !== null && daysRemaining < 0 && `${Math.abs(daysRemaining)} days overdue`}
          </p>
        </button>
      </MetaCell>

      <MetaCell label="Staging" icon={Globe}>
        {stagingUrl ? (
          <a
            href={stagingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-1.5 -mx-1 px-1 py-0.5 rounded-[var(--radius-md)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-accent)] truncate group-hover:underline">
                {host}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">{stagingUrl}</p>
            </div>
            <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ) : (
          <p className="text-sm text-[var(--color-muted-foreground)] px-1">No staging URL</p>
        )}
      </MetaCell>

      <MetaCell label="Main contact" icon={User}>
        <ContactGlance contact={contact} onSave={onContactSave} variant="meta" />
      </MetaCell>
    </div>
  )
}
