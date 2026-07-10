import { useState } from 'react'
import type { ProjectLinks } from '@/types'
import { LINK_FIELD_LABELS } from '@/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface ProjectLinksEditorProps {
  links: ProjectLinks
  onSave: (links: Partial<ProjectLinks>) => void
}

export function ProjectLinksEditor({ links, onSave }: ProjectLinksEditorProps) {
  const [draft, setDraft] = useState<ProjectLinks>({ ...links })
  const [editing, setEditing] = useState(false)

  const handleSave = () => {
    const cleaned = Object.fromEntries(
      Object.entries(draft).map(([k, v]) => [k, (v as string)?.trim() || undefined])
    ) as Partial<ProjectLinks>
    onSave(cleaned)
    setEditing(false)
  }

  if (!editing) {
    return (
      <Button variant="secondary" size="sm" className="mt-4" onClick={() => { setDraft({ ...links }); setEditing(true) }}>
        Edit Links
      </Button>
    )
  }

  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-[var(--color-border)]">
      {(Object.keys(LINK_FIELD_LABELS) as (keyof ProjectLinks)[]).map((key) => (
        <div key={key}>
          <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">
            {LINK_FIELD_LABELS[key]}
          </label>
          <Input
            type="url"
            placeholder="https://…"
            value={draft[key] ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
          />
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={handleSave}>Save Links</Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </div>
  )
}
