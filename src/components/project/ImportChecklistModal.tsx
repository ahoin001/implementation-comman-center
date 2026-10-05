import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useStore } from '@/store/useStore'
import { suggestAbbreviation } from '@/lib/calendar'
import { LAUNCH_STATUS_LABELS } from '@/lib/launchTemplate'
import { parseChecklist, type ChecklistImport } from '@/lib/sheetImport'

export function ImportChecklistButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <FileSpreadsheet className="h-4 w-4" />
        Import checklist
      </Button>
      <ImportChecklistModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function ImportChecklistModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const createProjectFromChecklist = useStore((s) => s.createProjectFromChecklist)
  const fileRef = useRef<HTMLInputElement>(null)
  const [paste, setPaste] = useState('')
  const [parsed, setParsed] = useState<ChecklistImport | null>(null)
  const [name, setName] = useState('')
  const [abbreviation, setAbbreviation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const reset = () => {
    setPaste('')
    setParsed(null)
    setName('')
    setAbbreviation('')
    setError(null)
    setSaving(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const close = () => {
    reset()
    onClose()
  }

  const applyText = (text: string, filename = '') => {
    const next = parseChecklist(text, filename)
    setParsed(next)
    setName(next.suggestedName)
    setAbbreviation(next.suggestedName ? suggestAbbreviation(next.suggestedName) : '')
    setError(
      next.matchedCount === 0
        ? 'No launch tasks matched. Use a sheet with a Task column and a Status column, then download it as CSV.'
        : null
    )
  }

  const onFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => applyText(String(reader.result ?? ''), file.name)
    reader.readAsText(file)
  }

  const create = async () => {
    if (!parsed || !name.trim() || parsed.matchedCount === 0) return
    setSaving(true)
    setError(null)
    const leftover =
      parsed.unmatched.length > 0
        ? `From the old checklist:\n${parsed.unmatched
            .map((row) => `• ${row.title}${row.status ? ` (${row.status})` : ''}${row.note ? ` — ${row.note}` : ''}`)
            .join('\n')}`
        : undefined
    try {
      const id = await createProjectFromChecklist({
        name: name.trim(),
        abbreviation: abbreviation.trim() || suggestAbbreviation(name.trim()),
        tasks: parsed.tasks,
        leftoverNote: leftover,
      })
      close()
      navigate(`/projects/${id}`)
    } catch (err) {
      setSaving(false)
      setError(err instanceof Error ? err.message : 'Could not create the project')
    }
  }

  const preview = parsed?.tasks.slice(0, 6) ?? []
  const hidden = parsed ? Math.max(0, parsed.tasks.length - preview.length) : 0

  return (
    <Modal open={open} onClose={close} className="max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Start from a checklist</h2>
        <button
          type="button"
          onClick={close}
          className="rounded-[var(--radius-sm)] p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
        Export the old checklist from Google Sheets as a CSV, or copy the table out of the Google Doc and paste it below. Task names match the launch board, and the statuses, notes, and dates you already filled in come with the new project.
      </p>

      <div className="space-y-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,text/csv,text/tab-separated-values,text/plain"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onFile(file)
          }}
        />
        <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
          Choose CSV
        </Button>
        <Textarea
          value={paste}
          onChange={(event) => setPaste(event.target.value)}
          placeholder="Or paste the sheet here"
          className="min-h-24"
        />
        <Button
          type="button"
          variant="outline"
          disabled={!paste.trim()}
          onClick={() => applyText(paste)}
        >
          Read pasted rows
        </Button>
      </div>

      {parsed && (
        <div className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted-foreground)]">
              Association name
            </label>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                if (!abbreviation || abbreviation === suggestAbbreviation(name)) {
                  setAbbreviation(suggestAbbreviation(event.target.value))
                }
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted-foreground)]">
              Abbreviation
            </label>
            <Input
              value={abbreviation}
              onChange={(event) => setAbbreviation(event.target.value.toUpperCase())}
              maxLength={12}
              className="font-semibold uppercase tracking-wide"
            />
          </div>
          <p className="text-sm text-[var(--color-foreground)]">
            {parsed.tasks.length > 0
              ? `${parsed.tasks.length} status${parsed.tasks.length === 1 ? '' : 'es'} copied from ${parsed.matchedCount} matched task${parsed.matchedCount === 1 ? '' : 's'}`
              : `${parsed.matchedCount} tasks matched. None had a status to copy, so the board starts fresh.`}
            {parsed.unmatched.length > 0 &&
              ` · ${parsed.unmatched.length} unmatched row${parsed.unmatched.length === 1 ? '' : 's'} saved as a note`}
          </p>
          {preview.length > 0 && (
            <ul className="space-y-1 text-sm text-[var(--color-muted-foreground)]">
              {preview.map((task) => (
                <li key={task.taskKey} className="flex items-baseline justify-between gap-3">
                  <span className="truncate">{task.title}</span>
                  <span className="shrink-0">{LAUNCH_STATUS_LABELS[task.status]}</span>
                </li>
              ))}
              {hidden > 0 && <li>and {hidden} more</li>}
            </ul>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-[var(--color-danger)]">{error}</p>}

      <div className="mt-6 flex gap-2">
        <Button className="flex-1" disabled={!name.trim() || !parsed || parsed.matchedCount === 0 || saving} onClick={() => void create()}>
          {saving ? 'Creating…' : 'Create project'}
        </Button>
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
      </div>
    </Modal>
  )
}
