import { useState } from 'react'
import type { Contact } from '@/types'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Mail, Phone, Clock } from 'lucide-react'

interface ContactEditorProps {
  contact: Contact
  onSave: (contact: Partial<Contact>) => void
}

export function ContactEditor({ contact, onSave }: ContactEditorProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Contact>({ ...contact })

  const handleSave = () => {
    onSave(draft)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <p className="font-medium">{contact.name || 'No contact name'}</p>
          <Button variant="ghost" size="sm" onClick={() => { setDraft({ ...contact }); setEditing(true) }}>
            Edit
          </Button>
        </div>
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-[var(--color-accent)] hover:underline">
            <Mail className="h-4 w-4" /> {contact.email}
          </a>
        )}
        {contact.phone && (
          <p className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
            <Phone className="h-4 w-4" /> {contact.phone}
          </p>
        )}
        {contact.timezone && (
          <p className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
            <Clock className="h-4 w-4" /> {contact.timezone}
          </p>
        )}
        {contact.notes && (
          <p className="text-[var(--color-muted-foreground)] pt-2 border-t border-[var(--color-border)]">
            {contact.notes}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Contact name"
        value={draft.name}
        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
      />
      <Input
        type="email"
        placeholder="Email"
        value={draft.email}
        onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
      />
      <Input
        placeholder="Phone"
        value={draft.phone ?? ''}
        onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
      />
      <Input
        placeholder="Timezone (e.g. America/New_York)"
        value={draft.timezone ?? ''}
        onChange={(e) => setDraft((d) => ({ ...d, timezone: e.target.value }))}
      />
      <Textarea
        placeholder="Notes about this contact"
        value={draft.notes ?? ''}
        onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave}>Save</Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </div>
  )
}
