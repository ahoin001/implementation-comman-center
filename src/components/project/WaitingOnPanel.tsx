import { formatDistanceToNow, parseISO } from 'date-fns'
import { Mail, Minus } from 'lucide-react'
import type { Project, WaitingOn } from '@/types'
import { WAITING_ON_LABELS, isClientWaiting } from '@/types'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface WaitingOnPanelProps {
  project: Project
  onWaitingOnChange: (waitingOn: WaitingOn) => void
  onLogOutreach: () => void
  onUndoOutreach: () => void
}

export function WaitingOnPanel({
  project,
  onWaitingOnChange,
  onLogOutreach,
  onUndoOutreach,
}: WaitingOnPanelProps) {
  const count = project.outreachCount ?? 0
  const showOutreach = isClientWaiting(project.waitingOn)
  const isScheduling = project.waitingOn === 'client_scheduling'

  return (
    <div className="space-y-4">
      <select
        value={project.waitingOn}
        onChange={(e) => onWaitingOnChange(e.target.value as WaitingOn)}
        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card-solid)] px-3 py-2 text-sm"
      >
        {Object.entries(WAITING_ON_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {showOutreach && (
        <div
          className={cn(
            'rounded-[var(--radius-md)] border border-[var(--color-border)] p-3',
            isScheduling && count === 0 && 'border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5'
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-[var(--radius-md)]',
                count > 0
                  ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                  : 'bg-black/5 text-[var(--color-muted-foreground)] dark:bg-white/5'
              )}
            >
              <span className="text-base font-semibold leading-none tabular-nums">{count}</span>
              <span className="text-[9px] uppercase tracking-wide opacity-70">
                {count === 1 ? 'time' : 'times'}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                {count === 0 ? 'Not reached out yet' : 'Reached out'}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                {count === 0
                  ? isScheduling
                    ? 'Log when you ask them to schedule'
                    : 'Log each nudge so you know where you stand'
                  : project.lastOutreachAt
                    ? `Last touch ${formatDistanceToNow(parseISO(project.lastOutreachAt), { addSuffix: true })}`
                    : `${count} outreach${count === 1 ? '' : 's'} logged`}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button type="button" size="sm" className="flex-1" onClick={onLogOutreach}>
              <Mail className="h-3.5 w-3.5" />
              {count === 0 ? 'Log outreach' : 'Reached out again'}
            </Button>
            {count > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={onUndoOutreach}
                aria-label="Undo last outreach"
                title="Undo last outreach"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {isScheduling && count > 0 && (
            <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
              Waiting on their reply to schedule
            </p>
          )}
        </div>
      )}
    </div>
  )
}
