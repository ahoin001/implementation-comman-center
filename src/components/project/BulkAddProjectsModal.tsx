import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useStore } from '@/store/useStore'
import { suggestAbbreviation } from '@/lib/calendar'

function parseBulkLines(text: string): { name: string; abbreviation?: string }[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // Formats: "ASA | American Staffing" or "ASA - American Staffing" or "ASA, American Staffing" or just "American Staffing"
      const match = line.match(/^([A-Za-z0-9]{2,12})\s*[|\-,]\s*(.+)$/)
      if (match) {
        return { abbreviation: match[1].toUpperCase(), name: match[2].trim() }
      }
      return { name: line, abbreviation: suggestAbbreviation(line) }
    })
}

interface BulkAddProjectsModalProps {
  open: boolean
  onClose: () => void
}

export function BulkAddProjectsModal({ open, onClose }: BulkAddProjectsModalProps) {
  const [text, setText] = useState('')
  const createProjects = useStore((s) => s.createProjects)

  const parsed = useMemo(() => parseBulkLines(text), [text])

  const handleCreate = () => {
    if (parsed.length === 0) return
    createProjects(parsed)
    setText('')
    onClose()
  }

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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 glass rounded-[var(--radius-xl)] p-6 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Bulk Add Projects</h2>
                <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                  One association per line
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">
              Paste associations
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'ASA | American Staffing Association\nABC Association\nHCS - Healthcare Society'}
              rows={8}
              autoFocus
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card-solid)] px-3 py-2 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            />
            <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
              Use <code className="text-[var(--color-foreground)]">ABBR | Name</code>,{' '}
              <code className="text-[var(--color-foreground)]">ABBR - Name</code>, or just the full name.
            </p>

            {parsed.length > 0 && (
              <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] max-h-40 overflow-y-auto">
                <ul className="divide-y divide-[var(--color-border)]">
                  {parsed.map((item, i) => (
                    <li key={`${item.name}-${i}`} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <span className="font-semibold tracking-wide text-[var(--color-accent)] w-12 shrink-0">
                        {item.abbreviation}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <Button className="flex-1" onClick={handleCreate} disabled={parsed.length === 0}>
                Add {parsed.length || ''} Project{parsed.length === 1 ? '' : 's'}
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
