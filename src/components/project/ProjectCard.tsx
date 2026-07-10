import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import type { Project } from '@/types'
import { WAITING_ON_LABELS, isClientWaiting } from '@/types'
import { calculateProgress, getCurrentStageLabel, getPrimaryOpenTask } from '@/lib/progress'
import { calculateHealth, getDaysRemaining, formatLaunchDate } from '@/lib/health'
import { ProgressRing } from './ProgressRing'
import { ProjectAvatar, ProjectTitle } from './ProjectIdentity'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
  index?: number
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

export function ProjectCard({
  project,
  index = 0,
  selectable = false,
  selected = false,
  onToggleSelect,
}: ProjectCardProps) {
  const progress = calculateProgress(project)
  const health = calculateHealth(project)
  const stageLabel = getCurrentStageLabel(project)
  const openTask = getPrimaryOpenTask(project)
  const daysRemaining = getDaysRemaining(project.launchDate)
  const id = project.id

  const cardBody = (
    <motion.article
      layoutId={selectable ? undefined : `project-card-${id}`}
      className={cn(
        'glass rounded-[var(--radius-lg)] p-5 transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-out)] relative',
        'hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20',
        !selectable && 'md:hover:-translate-y-0.5 transition-transform',
        selectable && 'cursor-pointer',
        selected && 'ring-2 ring-[var(--color-accent)] border-transparent'
      )}
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
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
            layoutId={selectable ? undefined : `project-avatar-${id}`}
          />
          <ProjectTitle
            name={project.name}
            abbreviation={project.abbreviation}
            subtitle={stageLabel}
            layoutId={selectable ? undefined : `project-title-${id}`}
          />
        </div>
        <ProgressRing
          progress={progress}
          size={52}
          strokeWidth={3}
          layoutId={selectable ? undefined : `project-progress-${id}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <motion.div layoutId={selectable ? undefined : `project-health-${id}`}>
          <HealthBadge health={health} />
        </motion.div>
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.04, type: 'spring', bounce: 0, duration: 0.35 }}
    >
      {selectable ? (
        <button type="button" onClick={onToggleSelect} className="block w-full text-left group">
          {cardBody}
        </button>
      ) : (
        <Link to={`/projects/${id}`} className="block group">
          {cardBody}
        </Link>
      )}
    </motion.div>
  )
}
