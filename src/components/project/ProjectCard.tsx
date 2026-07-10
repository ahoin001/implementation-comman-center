import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { Project } from '@/types'
import { WAITING_ON_LABELS } from '@/types'
import { calculateProgress, getCurrentStageLabel, getPrimaryOpenTask } from '@/lib/progress'
import { calculateHealth, getDaysRemaining, formatLaunchDate } from '@/lib/health'
import { ProgressRing } from './ProgressRing'
import { ProjectAvatar, ProjectTitle } from './ProjectIdentity'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
  index?: number
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const progress = calculateProgress(project)
  const health = calculateHealth(project)
  const stageLabel = getCurrentStageLabel(project)
  const openTask = getPrimaryOpenTask(project)
  const daysRemaining = getDaysRemaining(project.launchDate)
  const id = project.id

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.04, type: 'spring', bounce: 0, duration: 0.35 }}
    >
      <Link to={`/projects/${id}`} className="block group">
        <motion.article
          layoutId={`project-card-${id}`}
          className={cn(
            'glass rounded-[var(--radius-lg)] p-5 transition-[transform,box-shadow] duration-200 ease-[var(--ease-out)]',
            'hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20',
            'md:hover:-translate-y-0.5 transition-transform'
          )}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <ProjectAvatar name={project.name} abbreviation={project.abbreviation} layoutId={`project-avatar-${id}`} />
              <ProjectTitle
                name={project.name}
                subtitle={stageLabel}
                layoutId={`project-title-${id}`}
              />
            </div>
            <ProgressRing
              progress={progress}
              size={52}
              strokeWidth={3}
              layoutId={`project-progress-${id}`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <motion.div layoutId={`project-health-${id}`}>
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
            <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
              <span>Waiting on {WAITING_ON_LABELS[project.waitingOn]}</span>
              <span>{project.contact.name}</span>
            </div>
          </div>
        </motion.article>
      </Link>
    </motion.div>
  )
}
