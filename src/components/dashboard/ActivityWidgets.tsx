import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { useStore } from '@/store/useStore'
import { useActiveProjects } from '@/hooks/useProjects'

export function UpcomingMeetings() {
  const events = useStore((s) => s.calendarEvents)
  const projects = useActiveProjects()

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
      <CardHeader>
        <CardTitle>Upcoming Meetings</CardTitle>
      </CardHeader>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">No meetings scheduled</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([day, dayEvents]) => (
            <div key={day}>
              <p className="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider mb-2">
                {day}
              </p>
              <ul className="space-y-2">
                {dayEvents.map((event) => {
                  const project = projects.find((p) => p.id === event.projectId)
                  return (
                    <li key={event.id} className="flex items-center gap-3 text-sm">
                      {event.time && (
                        <span className="text-[var(--color-muted-foreground)] tabular-nums w-12 shrink-0">
                          {event.time}
                        </span>
                      )}
                      <span className="font-medium">{event.title}</span>
                      {project && (
                        <span className="text-[var(--color-muted-foreground)] truncate">{project.abbreviation}</span>
                      )}
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
  const activities = useStore((s) => s.activities)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>

      <ul className="space-y-3">
        {activities.slice(0, 6).map((activity) => (
          <li key={activity.id} className="flex items-start gap-3 text-sm">
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" />
            <div>
              <p className="font-medium">{activity.title}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {format(parseISO(activity.createdAt), 'MMM d, h:mm a')}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
