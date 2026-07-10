import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, Phone, Clock, Pencil } from 'lucide-react'
import type { Contact } from '@/types'
import { Input, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface ContactGlanceProps {
  contact: Contact
  onSave: (contact: Partial<Contact>) => void
  className?: string
  /** Compact trigger for hero meta row */
  variant?: 'card' | 'meta'
}

export function ContactGlance({ contact, onSave, className, variant = 'card' }: ContactGlanceProps) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Contact>({ ...contact })
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
        setEditing(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setEditing(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const handleOpen = () => {
    setDraft({ ...contact })
    setEditing(false)
    setOpen((v) => !v)
  }

  const handleSave = () => {
    onSave(draft)
    setEditing(false)
  }

  const displayName = contact.name || 'Add contact'
  const secondary = contact.email || contact.phone || 'Click to add details'

  return (
    <div ref={panelRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={handleOpen}
        aria-expanded={open}
        className={cn(
          'group w-full text-left transition-colors duration-150',
          variant === 'card' &&
            cn(
              'flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)]',
              'bg-[var(--color-card-solid)]/60 px-3 py-2.5',
              'hover:bg-[var(--color-card-solid)] hover:border-[var(--color-accent)]/30 active:scale-[0.99]',
              open && 'border-[var(--color-accent)]/40 bg-[var(--color-card-solid)]'
            ),
          variant === 'meta' &&
            cn(
              'rounded-[var(--radius-md)] -mx-1 px-1 py-0.5',
              'hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99]',
              open && 'bg-black/5 dark:bg-white/5'
            )
        )}
      >
        {variant === 'card' ? (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] leading-none mb-1">
                Client contact
              </p>
              <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{displayName}</p>
              <p className="text-xs text-[var(--color-muted-foreground)] truncate">{secondary}</p>
            </div>
            <Pencil className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </>
        ) : (
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{displayName}</p>
            <p className="text-xs text-[var(--color-muted-foreground)] truncate mt-0.5">{secondary}</p>
          </div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
            className={cn(
              'absolute z-30 mt-2 w-[min(100vw-2rem,320px)] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card-solid)] p-4 shadow-lg shadow-black/10',
              variant === 'meta' ? 'left-0 sm:left-auto sm:right-0' : 'right-0 left-0 sm:left-auto'
            )}
          >
            {!editing ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{contact.name || 'No name set'}</p>
                    {contact.notes && (
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-1 line-clamp-2">
                        {contact.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDraft({ ...contact })
                      setEditing(true)
                    }}
                  >
                    Edit
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  {contact.email ? (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-[var(--color-accent)] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </a>
                  ) : (
                    <p className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
                      <Mail className="h-3.5 w-3.5" /> No email
                    </p>
                  )}
                  {contact.phone ? (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 text-[var(--color-foreground)] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {contact.phone}
                    </a>
                  ) : null}
                  {contact.timezone ? (
                    <p className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {contact.timezone}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <Input
                  placeholder="Contact name"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  autoFocus
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
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
