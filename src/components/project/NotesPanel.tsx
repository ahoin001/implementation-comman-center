import { useMemo, useState } from 'react'
import { Pin, Pencil, Trash2, Check, X } from 'lucide-react'
import type { Note, NoteSeverity } from '@/types'
import { NOTE_SEVERITIES, NOTE_SEVERITY_LABELS } from '@/types'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

interface NotesPanelProps {
  notes: Note[]
  onAdd: (content: string, severity: NoteSeverity) => void
  onUpdate: (noteId: string, updates: { content?: string; severity?: NoteSeverity }) => void
  onDelete: (noteId: string) => void
  onTogglePin: (noteId: string) => void
}

const SEVERITY_RANK: Record<NoteSeverity, number> = {
  urgent: 0,
  warning: 1,
  info: 2,
}

const severityBorder: Record<NoteSeverity, string> = {
  info: 'border-[var(--color-accent)]/40',
  warning: 'border-[var(--color-warning)]',
  urgent: 'border-[var(--color-danger)]',
}

const severityBadge: Record<NoteSeverity, string> = {
  info: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
  warning: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
  urgent: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
}

const severityChipActive: Record<NoteSeverity, string> = {
  info: 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] ring-[var(--color-accent)]/30',
  warning: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)] ring-[var(--color-warning)]/30',
  urgent: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] ring-[var(--color-danger)]/30',
}

function noteSeverity(note: Note): NoteSeverity {
  return note.severity ?? 'info'
}

function SeverityPicker({
  value,
  onChange,
}: {
  value: NoteSeverity
  onChange: (severity: NoteSeverity) => void
}) {
  return (
    <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] p-0.5 bg-black/[0.02] dark:bg-white/[0.03]">
      {NOTE_SEVERITIES.map((severity) => (
        <button
          key={severity}
          type="button"
          onClick={() => onChange(severity)}
          className={cn(
            'px-2.5 py-1 text-[11px] font-medium rounded-[calc(var(--radius-md)-2px)] transition-colors ring-1 ring-transparent',
            value === severity
              ? severityChipActive[severity]
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          )}
        >
          {NOTE_SEVERITY_LABELS[severity]}
        </button>
      ))}
    </div>
  )
}

export function NotesPanel({ notes, onAdd, onUpdate, onDelete, onTogglePin }: NotesPanelProps) {
  const [draft, setDraft] = useState('')
  const [draftSeverity, setDraftSeverity] = useState<NoteSeverity>('info')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [editSeverity, setEditSeverity] = useState<NoteSeverity>('info')

  const sorted = useMemo(() => {
    return [...notes].sort((a, b) => {
      const pinDiff = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
      if (pinDiff !== 0) return pinDiff
      const sevDiff = SEVERITY_RANK[noteSeverity(a)] - SEVERITY_RANK[noteSeverity(b)]
      if (sevDiff !== 0) return sevDiff
      return b.createdAt.localeCompare(a.createdAt)
    })
  }, [notes])

  const handleAdd = () => {
    if (!draft.trim()) return
    onAdd(draft.trim(), draftSeverity)
    setDraft('')
    setDraftSeverity('info')
  }

  const startEdit = (note: Note) => {
    setEditingId(note.id)
    setEditDraft(note.content)
    setEditSeverity(noteSeverity(note))
  }

  const saveEdit = () => {
    if (!editingId || !editDraft.trim()) return
    onUpdate(editingId, { content: editDraft.trim(), severity: editSeverity })
    setEditingId(null)
    setEditDraft('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1">
          Pin a note or mark Warning / Urgent to show it on the Projects list
        </p>
      </CardHeader>

      <div className="flex flex-col gap-2 mb-4">
        <Textarea
          placeholder="Add a note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SeverityPicker value={draftSeverity} onChange={setDraftSeverity} />
          <Button onClick={handleAdd} disabled={!draft.trim()}>
            Add
          </Button>
        </div>
      </div>

      <ul className="space-y-3 max-h-[420px] overflow-y-auto">
        {sorted.length === 0 && (
          <li className="text-sm text-[var(--color-muted-foreground)] py-2">No notes yet</li>
        )}
        {sorted.map((note) => {
          const isEditing = editingId === note.id
          const severity = noteSeverity(note)
          return (
            <li
              key={note.id}
              className={cn('text-sm border-l-2 pl-3 group', severityBorder[severity])}
            >
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                    severityBadge[severity]
                  )}
                >
                  {NOTE_SEVERITY_LABELS[severity]}
                </span>
                {note.pinned && (
                  <Pin className="h-3 w-3 text-[var(--color-accent)]" aria-label="Pinned" />
                )}
                <span className="text-xs text-[var(--color-muted-foreground)] flex-1">
                  {format(parseISO(note.createdAt), 'MMM d, yyyy')}
                </span>
                <button
                  type="button"
                  title={note.pinned ? 'Unpin' : 'Pin'}
                  onClick={() => onTogglePin(note.id)}
                  className={cn(
                    'p-1 rounded-sm transition-colors',
                    note.pinned
                      ? 'text-[var(--color-accent)]'
                      : 'text-[var(--color-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-foreground)]'
                  )}
                >
                  <Pin className="h-3 w-3" />
                </button>
                {!isEditing && (
                  <button
                    type="button"
                    title="Edit"
                    onClick={() => startEdit(note)}
                    className="p-1 rounded-sm text-[var(--color-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-foreground)]"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  title="Delete"
                  onClick={() => {
                    if (window.confirm('Delete this note?')) onDelete(note.id)
                  }}
                  className="p-1 rounded-sm text-[var(--color-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-danger)]"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    autoFocus
                    className="text-sm min-h-[72px]"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <SeverityPicker value={editSeverity} onChange={setEditSeverity} />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="p-1.5 rounded-sm text-[var(--color-muted-foreground)] hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={!editDraft.trim()}
                        className="p-1.5 rounded-sm text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 disabled:opacity-40"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{note.content}</p>
              )}

              {!isEditing && (
                <div className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <SeverityPicker
                    value={severity}
                    onChange={(next) => onUpdate(note.id, { severity: next })}
                  />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
