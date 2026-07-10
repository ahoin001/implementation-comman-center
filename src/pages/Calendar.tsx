import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
} from 'date-fns'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useActiveProjects } from '@/hooks/useProjects'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EventFormModal } from '@/components/calendar/EventFormModal'
import { CALENDAR_EVENT_LABELS, type CalendarEvent, type CalendarEventType } from '@/types'
import { getProjectLabel } from '@/lib/calendar'
import { cn } from '@/lib/utils'

const eventColors: Record<CalendarEventType, string> = {
  kickoff: 'bg-blue-500',
  adhoc: 'bg-[var(--color-accent)]',
  training: 'bg-purple-500',
}

const eventBadgeStyles: Record<CalendarEventType, string> = {
  kickoff: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  adhoc: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
  training: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
}

function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()))
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  const events = useStore((s) => s.calendarEvents)
  const addCalendarEvent = useStore((s) => s.addCalendarEvent)
  const updateCalendarEvent = useStore((s) => s.updateCalendarEvent)
  const deleteCalendarEvent = useStore((s) => s.deleteCalendarEvent)
  const projects = useActiveProjects()

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const monthEvents = events.filter((e) => isSameMonth(parseISO(e.date), currentMonth))

  const openCreate = (date: string) => {
    setEditingEvent(null)
    setSelectedDate(date)
    setModalOpen(true)
  }

  const openEdit = (event: CalendarEvent) => {
    setEditingEvent(event)
    setSelectedDate(event.date)
    setModalOpen(true)
  }

  const handleSave = (data: {
    projectId: string
    type: CalendarEventType
    date: string
    time?: string
    notes?: string
  }) => {
    if (editingEvent) {
      updateCalendarEvent(editingEvent.id, data)
    } else {
      addCalendarEvent(data)
    }
  }

  const handleDelete = () => {
    if (editingEvent) {
      deleteCalendarEvent(editingEvent.id)
      setModalOpen(false)
      setEditingEvent(null)
    }
  }

  const upcoming = [...events]
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return (a.time ?? '').localeCompare(b.time ?? '')
    })

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Calendar</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Click any day to schedule kickoffs, SmartWay training, or adhoc meetings
          </p>
        </div>
        <Button onClick={() => openCreate(toDateKey(new Date()))}>
          <Plus className="h-4 w-4" />
          New Event
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold tracking-tight">{format(currentMonth, 'MMMM yyyy')}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            {(Object.keys(CALENDAR_EVENT_LABELS) as CalendarEventType[]).map((type) => (
              <span key={type} className="inline-flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
                <span className={cn('h-2 w-2 rounded-full', eventColors[type])} />
                {CALENDAR_EVENT_LABELS[type]}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-[var(--color-muted-foreground)] py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: days[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const dateKey = toDateKey(day)
              const dayEvents = monthEvents.filter((e) => isSameDay(parseISO(e.date), day))
              const today = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => openCreate(dateKey)}
                  className={cn(
                    'min-h-[80px] rounded-[var(--radius-md)] p-1.5 border text-left transition-[background-color,transform,border-color] duration-150',
                    'hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-[var(--color-accent)]/30 active:scale-[0.98]',
                    today ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/[0.04]' : 'border-transparent',
                    dayEvents.length > 0 && 'bg-black/[0.02] dark:bg-white/[0.02]'
                  )}
                >
                  <span className={cn('text-xs font-medium tabular-nums', today && 'text-[var(--color-accent)]')}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 3).map((e) => {
                      const project = projects.find((p) => p.id === e.projectId)
                      return (
                        <div
                          key={e.id}
                          role="button"
                          tabIndex={0}
                          onClick={(ev) => {
                            ev.stopPropagation()
                            openEdit(e)
                          }}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter') {
                              ev.stopPropagation()
                              openEdit(e)
                            }
                          }}
                          className={cn(
                            'rounded px-1 py-0.5 text-[10px] font-medium truncate text-white cursor-pointer',
                            eventColors[e.type],
                            'hover:opacity-90'
                          )}
                          title={e.title}
                        >
                          {project ? getProjectLabel(project) : e.title}
                        </div>
                      )
                    })}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-[var(--color-muted-foreground)] px-1">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-1">All Events</h3>
          <p className="text-xs text-[var(--color-muted-foreground)] mb-4">Click to edit or delete</p>
          <ul className="space-y-2 max-h-[520px] overflow-y-auto">
            {upcoming.length === 0 && (
              <p className="text-sm text-[var(--color-muted-foreground)] py-6 text-center">
                No events yet. Click a day on the calendar to add one.
              </p>
            )}
            {upcoming.map((event) => {
              const project = projects.find((p) => p.id === event.projectId)
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => openEdit(event)}
                    className="w-full text-left rounded-[var(--radius-md)] p-3 transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', eventBadgeStyles[event.type])}>
                        {CALENDAR_EVENT_LABELS[event.type]}
                      </span>
                      {event.time && (
                        <span className="text-xs text-[var(--color-muted-foreground)] tabular-nums">{event.time}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {format(parseISO(event.date), 'EEE, MMM d, yyyy')}
                    </p>
                    {project && (
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">{project.name}</p>
                    )}
                    {event.notes && (
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-1 line-clamp-2">{event.notes}</p>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <EventFormModal
        open={modalOpen}
        date={selectedDate}
        projects={projects}
        event={editingEvent}
        onClose={() => {
          setModalOpen(false)
          setEditingEvent(null)
        }}
        onSave={handleSave}
        onDelete={editingEvent ? handleDelete : undefined}
      />
    </div>
  )
}
