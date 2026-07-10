import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2 } from 'lucide-react'
import type { CalendarEvent, CalendarEventType, Project } from '@/types'
import { CALENDAR_EVENT_LABELS } from '@/types'
import { buildEventTitle } from '@/lib/calendar'
import { Button } from '@/components/ui/Button'
import { DatePicker, TimePicker } from '@/components/ui/DatePicker'
import { cn } from '@/lib/utils'

const EVENT_TYPES: CalendarEventType[] = ['kickoff', 'adhoc', 'training']

const typeStyles: Record<CalendarEventType, string> = {
  kickoff: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/30',
  adhoc: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] ring-[var(--color-accent)]/30',
  training: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 ring-purple-500/30',
}

interface EventFormModalProps {
  open: boolean
  date: string
  projects: Project[]
  event?: CalendarEvent | null
  onClose: () => void
  onSave: (data: {
    projectId: string
    type: CalendarEventType
    date: string
    time?: string
    notes?: string
  }) => void
  onDelete?: () => void
}

export function EventFormModal({
  open,
  date: initialDate,
  projects,
  event,
  onClose,
  onSave,
  onDelete,
}: EventFormModalProps) {
  const [type, setType] = useState<CalendarEventType>('kickoff')
  const [projectId, setProjectId] = useState('')
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  const isEditing = Boolean(event)

  useEffect(() => {
    if (!open) return
    if (event) {
      setType(event.type)
      setProjectId(event.projectId)
      setDate(event.date)
      setTime(event.time ?? '')
      setNotes(event.notes ?? '')
    } else {
      setType('kickoff')
      setProjectId(projects[0]?.id ?? '')
      setDate(initialDate)
      setTime('')
      setNotes('')
    }
  }, [open, event, initialDate, projects])

  const selectedProject = projects.find((p) => p.id === projectId)
  const previewTitle =
    selectedProject && type ? buildEventTitle(type, selectedProject) : 'Select association & type'

  const handleSave = () => {
    if (!projectId) return
    onSave({
      projectId,
      type,
      date,
      time: time || undefined,
      notes: notes.trim() || undefined,
    })
    onClose()
  }

  const sortedProjects = [...projects].sort((a, b) =>
    (a.abbreviation || a.name).localeCompare(b.abbreviation || b.name)
  )

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 glass rounded-[var(--radius-xl)] p-6 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold tracking-tight">
                {isEditing ? 'Edit Event' : 'Schedule Event'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-2 block">
                  Event Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-[transform,background-color] duration-150 active:scale-[0.97]',
                        type === t ? typeStyles[t] : 'ring-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      {CALENDAR_EVENT_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">
                  Association
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card-solid)] px-3 text-sm"
                >
                  {sortedProjects.length === 0 && <option value="">No active projects</option>}
                  {sortedProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.abbreviation ? `${p.abbreviation} — ${p.name}` : p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">
                    Date
                  </label>
                  <DatePicker value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">
                    Time (optional)
                  </label>
                  <TimePicker value={time} onChange={(e) => setTime(e.target.value)} placeholder="Optional" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Meeting link, agenda, etc."
                  rows={2}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card-solid)] px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                />
              </div>

              <p className="text-xs text-[var(--color-muted-foreground)] rounded-[var(--radius-md)] bg-black/[0.03] dark:bg-white/[0.04] px-3 py-2">
                Preview: <span className="font-medium text-[var(--color-foreground)]">{previewTitle}</span>
              </p>
            </div>

            <div className="flex gap-2 mt-6">
              {isEditing && onDelete && (
                <Button variant="danger" size="icon" onClick={onDelete} title="Delete event">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button className="flex-1" onClick={handleSave} disabled={!projectId || !date}>
                {isEditing ? 'Save Changes' : 'Add Event'}
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
