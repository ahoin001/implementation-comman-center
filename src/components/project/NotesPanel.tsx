import { useMemo, useState } from 'react'
import { Pin, Pencil, Trash2, Check, X } from 'lucide-react'
import type { Note } from '@/types'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

interface NotesPanelProps {
  notes: Note[]
  onAdd: (content: string) => void
  onUpdate: (noteId: string, content: string) => void
  onDelete: (noteId: string) => void
  onTogglePin: (noteId: string) => void
}

export function NotesPanel({ notes, onAdd, onUpdate, onDelete, onTogglePin }: NotesPanelProps) {
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  const sorted = useMemo(() => {
    return [...notes].sort((a, b) => {
      const pinDiff = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
      if (pinDiff !== 0) return pinDiff
      return b.createdAt.localeCompare(a.createdAt)
    })
  }, [notes])

  const handleAdd = () => {
    if (!draft.trim()) return
    onAdd(draft.trim())
    setDraft('')
  }

  const startEdit = (note: Note) => {
    setEditingId(note.id)
    setEditDraft(note.content)
  }

  const saveEdit = () => {
    if (!editingId || !editDraft.trim()) return
    onUpdate(editingId, editDraft.trim())
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
      </CardHeader>

      <div className="flex flex-col gap-2 mb-4">
        <Textarea
          placeholder="Add a note…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button onClick={handleAdd} disabled={!draft.trim()} className="self-end">
          Add
        </Button>
      </div>

      <ul className="space-y-3 max-h-[420px] overflow-y-auto">
        {sorted.length === 0 && (
          <li className="text-sm text-[var(--color-muted-foreground)] py-2">No notes yet</li>
        )}
        {sorted.map((note) => {
          const isEditing = editingId === note.id
          return (
            <li
              key={note.id}
              className={cn(
                'text-sm border-l-2 pl-3 group',
                note.pinned
                  ? 'border-[var(--color-accent)]'
                  : 'border-[var(--color-accent)]/30'
              )}
            >
              <div className="flex items-center gap-1 mb-0.5">
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
                  <div className="flex gap-1 justify-end">
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
              ) : (
                <p className="whitespace-pre-wrap">{note.content}</p>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
