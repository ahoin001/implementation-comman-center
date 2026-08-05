import { cn } from '@/lib/utils'

interface ResumeDataControlProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  /** Compact inline row used inside Pre Launch Refinements */
  compact?: boolean
}

/**
 * Site setting for Resumes (on/off). Resume files themselves land in Data Import;
 * this mirrors the association website config you’ll flip at refine time.
 */
export function ResumeDataControl({ enabled, onChange, compact = false }: ResumeDataControlProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)]',
        compact ? 'px-2 py-2' : 'p-3 space-y-2'
      )}
    >
      <div className={cn('flex items-start justify-between gap-3', compact && 'items-center')}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">Has resume data</p>
            <span className="rounded-full bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
              Site setting
            </span>
          </div>
          {!compact && (
            <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1">
              On when the import includes resumes and the site Resumes feature should be enabled
            </p>
          )}
        </div>
        <div className="flex shrink-0 rounded-full bg-black/[0.04] dark:bg-white/[0.06] p-0.5">
          {(
            [
              { value: true, label: 'On' },
              { value: false, label: 'Off' },
            ] as const
          ).map(({ value, label }) => {
            const active = enabled === value
            return (
              <button
                key={label}
                type="button"
                onClick={() => onChange(value)}
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-150',
                  active
                    ? value
                      ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] shadow-sm'
                      : 'bg-black/10 dark:bg-white/15 text-[var(--color-muted-foreground)] shadow-sm'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
