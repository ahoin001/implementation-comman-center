import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Check, Pin } from 'lucide-react'
import type { Project } from '@/types'
import { NOTE_SEVERITY_LABELS, WAITING_ON_LABELS, isClientWaiting } from '@/types'
import { calculateProgress, getCurrentStageLabel, getPrimaryOpenTask } from '@/lib/progress'
import { calculateHealth, getDaysRemaining, formatLaunchDate } from '@/lib/health'
import { getTopStickyNote, noteSeverity } from '@/lib/projectNotes'
import { ProgressRing } from './ProgressRing'
import { ProjectAvatar, ProjectTitle } from './ProjectIdentity'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { RequiredDocsBadge } from '@/components/project/RequiredDocsBadge'
import { MissingCredentialsBadge } from '@/components/project/MissingCredentialsBadge'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

const sharedTransition = { type: 'spring' as const, bounce: 0, duration: 0.35 }

const stickyBorder: Record<string, string> = {
  info: 'border-[var(--color-accent)]/50',
  warning: 'border-[var(--color-warning)]',
  urgent: 'border-[var(--color-danger)]',
}

const stickyBadge: Record<string, string> = {
  info: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
  warning: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
  urgent: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
}

export function ProjectCard({
  project,
  selectable = false,
  selected = false,
  onToggleSelect,
}: ProjectCardProps) {
  const progress = calculateProgress(project)
  const health = calculateHealth(project)
  const stageLabel = getCurrentStageLabel(project)
  const openTask = getPrimaryOpenTask(project)
  const daysRemaining = getDaysRemaining(project.launchDate)
  const sticky = selectable ? null : getTopStickyNote(project)
  const id = project.id
  const enableShared = !selectable

  const cardBody = (
    <motion.article
      layoutId={enableShared ? `project-card-${id}` : undefined}
      transition={sharedTransition}
      className={cn(
        'glass rounded-[var(--radius-lg)] p-5 relative',
        'transition-[box-shadow,border-color] duration-200 ease-[var(--ease-out)]',
        'hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20',
        selectable && 'cursor-pointer',
        selected && 'ring-2 ring-[var(--color-accent)] border-transparent'
      )}
    >
      {selectable && (
        <div
          className={cn(
            'absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-md border transition-colors duration-150',
            selected
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
              : 'border-[var(--color-border)] bg-[var(--color-card-solid)]'
          )}
        >
          {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <ProjectAvatar
            name={project.name}
            abbreviation={project.abbreviation}
            layoutId={enableShared ? `project-avatar-${id}` : undefined}
          />
          <ProjectTitle
            name={project.name}
            abbreviation={project.abbreviation}
            subtitle={stageLabel}
            layoutId={enableShared ? `project-title-${id}` : undefined}
          />
        </div>
        <ProgressRing
          progress={progress}
          size={52}
          strokeWidth={3}
          layoutId={enableShared ? `project-progress-${id}` : undefined}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {enableShared ? (
          <motion.div layoutId={`project-health-${id}`} transition={sharedTransition}>
            <HealthBadge health={health} />
          </motion.div>
        ) : (
          <HealthBadge health={health} />
        )}
        <RequiredDocsBadge project={project} />
        <MissingCredentialsBadge project={project} />
        {project.launchDate && (
          <span className="text-xs text-[var(--color-muted-foreground)]">
            {formatLaunchDate(project.launchDate)}
            {daysRemaining !== null && daysRemaining >= 0 && (
              <span className="ml-1">· {daysRemaining}d</span>
            )}
          </span>
        )}
      </div>

      <div className="space-y-2 pt-3 border-t border-[var(--color-border)]">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-0.5">To Do</p>
          <p className="text-sm font-medium text-[var(--color-foreground)]">
            {openTask
              ? openTask.status === 'blocked'
                ? `${openTask.label} — blocked`
                : openTask.label
              : 'All tasks complete'}
          </p>
        </div>

        {sticky && (
          <div
            className={cn(
              'rounded-[var(--radius-md)] border-l-2 bg-black/[0.02] dark:bg-white/[0.03] px-2.5 py-2',
              stickyBorder[noteSeverity(sticky)]
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                  stickyBadge[noteSeverity(sticky)]
                )}
              >
                {NOTE_SEVERITY_LABELS[noteSeverity(sticky)]}
              </span>
              {sticky.pinned && <Pin className="h-2.5 w-2.5 text-[var(--color-accent)]" />}
            </div>
            <p className="text-xs text-[var(--color-foreground)] line-clamp-2 whitespace-pre-wrap">
              {sticky.content}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-muted-foreground)]">
          <span className="min-w-0 truncate">
            Waiting on {WAITING_ON_LABELS[project.waitingOn]}
            {isClientWaiting(project.waitingOn) && (project.outreachCount ?? 0) > 0 && (
              <span className="ml-1.5 inline-flex items-center rounded-full bg-[var(--color-accent)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-accent)] tabular-nums">
                {project.outreachCount}× reached out
              </span>
            )}
          </span>
          <span className="shrink-0">{project.contact.name}</span>
        </div>
      </div>
    </motion.article>
  )

  if (selectable) {
    return (
      <button type="button" onClick={onToggleSelect} className="block w-full text-left group">
        {cardBody}
      </button>
    )
  }

  return (
    <Link to={`/projects/${id}`} className="block group">
      {cardBody}
    </Link>
  )
}
