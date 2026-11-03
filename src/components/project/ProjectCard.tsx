import { useState } from 'react'
import { Link, useLocation, useViewTransitionState } from 'react-router-dom'
import { Star } from 'lucide-react'
import type { Project } from '@/types'
import { WAITING_ON_LABELS } from '@/types'
import { formatLaunchDate, getDaysRemaining } from '@/lib/health'
import { getProjectGlance, type CardSignalTone } from '@/lib/projectGlance'
import { useStore } from '@/store/useStore'
import { ProgressRing } from './ProgressRing'
import { ProjectAvatar } from './ProjectIdentity'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

const signalTag: Record<CardSignalTone, string> = {
  danger: 'keep',
  warning: 'review',
  info: '',
  calm: '',
}

export function ProjectCard({
  project,
  selectable = false,
  selected = false,
  onToggleSelect,
}: ProjectCardProps) {
  const location = useLocation()
  const to = `/projects/${project.id}`
  const transitioning = useViewTransitionState(to)
  const starred = useStore((s) => s.favoriteIds.includes(project.id))
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const [starPop, setStarPop] = useState(0)
  const glance = getProjectGlance(project)
  const daysRemaining = getDaysRemaining(project.launchDate)
  const showCountdown = !glance.launched && daysRemaining !== null && daysRemaining >= 0
  const showWaiting = project.waitingOn !== 'none'

  const body = (
    <>
      <div className="project-card-main">
        <ProjectAvatar name={project.name} abbreviation={project.abbreviation} />
        <div className="project-card-copy">
          <h3>{project.name}</h3>
          <p>{glance.stage}</p>
          <span className={cn('tag', signalTag[glance.signal.tone])} title={glance.signal.label}>
            <span>{glance.signal.label}</span>
          </span>
        </div>
      </div>

      <div className="project-card-aside">
        {selectable ? (
          <span className={cn('check', selected && 'on')} aria-hidden />
        ) : (
          <ProgressRing progress={glance.progress} size={44} strokeWidth={3} launched={glance.wrapped} />
        )}
      </div>

      {!selectable && (
        <div className="project-card-meta">
          {project.launchDate && (
            <span className="project-card-date">
              {formatLaunchDate(project.launchDate)}
              {showCountdown && <span> · {daysRemaining}d</span>}
            </span>
          )}
          {showWaiting && (
            <span className="project-card-wait">
              <span className="sr-only">Waiting on </span>
              {WAITING_ON_LABELS[project.waitingOn]}
            </span>
          )}
          <button
            type="button"
            aria-label={starred ? 'Remove from My Projects' : 'Add to My Projects'}
            aria-pressed={starred}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              toggleFavorite(project.id)
              setStarPop((count) => count + 1)
            }}
            className="project-card-star"
          >
            <span key={starPop} className={starPop > 0 ? 'project-star-pop' : undefined}>
              <Star className={cn('h-4 w-4', starred && 'fill-current')} />
            </span>
          </button>
        </div>
      )}
    </>
  )

  const className = cn(
    'card-w project-card press',
    selectable && 'is-selectable',
    selected && 'is-selected',
    transitioning && 'vt-project'
  )

  if (selectable) {
    return (
      <button type="button" onClick={onToggleSelect} className={className} aria-pressed={selected}>
        {body}
      </button>
    )
  }

  return (
    <Link to={to} viewTransition state={{ from: location.pathname }} className={className}>
      {body}
    </Link>
  )
}
