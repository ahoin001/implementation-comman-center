import { Link } from 'react-router-dom'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { useStore } from '@/store/useStore'
import { useActiveProjects } from '@/hooks/useProjects'
import { CALENDAR_EVENT_LABELS } from '@/types'
import { cn } from '@/lib/utils'

const rowClass =
  'flex items-start gap-3 rounded-[var(--radius-md)] px-2 py-2.5 -mx-2 transition-[background-color,transform] duration-150 ease-[var(--ease-out)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99] group'

export function UpcomingMeetings() {
  const events = useStore((s) => s.calendarEvents)
  const projects = useActiveProjects()
  const setActiveFilter = useStore((s) => s.setActiveFilter)

  const upcoming = events
    .filter((e) => {
      const date = parseISO(e.date)
      return isToday(date) || isTomorrow(date)
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return (a.time ?? '').localeCompare(b.time ?? '')
    })

  const grouped = upcoming.reduce<Record<string, typeof upcoming>>((acc, event) => {
    const label = isToday(parseISO(event.date)) ? 'Today' : 'Tomorrow'
    if (!acc[label]) acc[label] = []
    acc[label].push(event)
    return acc
  }, {})

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between mb-2">
        <CardTitle>Upcoming Meetings</CardTitle>
        <Link
          to="/calendar"
          onClick={() => setActiveFilter('all')}
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          Calendar
        </Link>
      </CardHeader>

      {Object.keys(grouped).length === 0 ? (
        <Link
          to="/calendar"
          className="flex flex-col items-center justify-center gap-2 py-8 text-center rounded-[var(--radius-md)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <CalendarDays className="h-5 w-5 text-[var(--color-muted)]" />
          <p className="text-sm text-[var(--color-muted-foreground)]">No meetings today or tomorrow</p>
          <span className="text-xs text-[var(--color-accent)]">Open calendar</span>
        </Link>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([day, dayEvents]) => (
            <div key={day}>
              <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider mb-1 px-2">
                {day}
              </p>
              <ul className="space-y-0.5">
                {dayEvents.map((event) => {
                  const project = projects.find((p) => p.id === event.projectId)
                  return (
                    <li key={event.id}>
                      <Link to={`/projects/${event.projectId}`} className={rowClass}>
                        {event.time ? (
                          <span className="text-[var(--color-muted-foreground)] tabular-nums w-12 shrink-0 text-sm pt-0.5">
                            {event.time}
                          </span>
                        ) : (
                          <span className="w-12 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                            {CALENDAR_EVENT_LABELS[event.type]}
                            {project ? ` · ${project.abbreviation || project.name}` : ''}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export function RecentActivity() {
  const activities = useStore((s) => s.activities).slice(0, 8)
  const setActiveFilter = useStore((s) => s.setActiveFilter)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between mb-2">
        <CardTitle>Recent Activity</CardTitle>
        <Link
          to="/projects"
          onClick={() => setActiveFilter('all')}
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          Projects
        </Link>
      </CardHeader>

      {activities.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)] py-6 text-center">No recent activity</p>
      ) : (
        <ul className="space-y-0.5">
          {activities.map((activity) => {
            const content = (
              <>
                <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{activity.title}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {format(parseISO(activity.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
                {activity.projectId && (
                  <ArrowRight className="h-4 w-4 text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                )}
              </>
            )

            return (
              <li key={activity.id}>
                {activity.projectId ? (
                  <Link to={`/projects/${activity.projectId}`} className={rowClass}>
                    {content}
                  </Link>
                ) : (
                  <div className={cn(rowClass, 'cursor-default hover:bg-transparent active:scale-100')}>
                    {content}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
