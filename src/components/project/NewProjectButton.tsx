import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DatePicker } from '@/components/ui/DatePicker'
import { useStore } from '@/store/useStore'
import { suggestAbbreviation } from '@/lib/calendar'
import { motion, AnimatePresence } from 'framer-motion'

export function NewProjectButton() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [abbreviation, setAbbreviation] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [launchDate, setLaunchDate] = useState('')
  const createProject = useStore((s) => s.createProject)
  const navigate = useNavigate()

  const handleCreate = () => {
    if (!name.trim()) return
    const id = createProject({
      name: name.trim(),
      abbreviation: abbreviation.trim() || suggestAbbreviation(name.trim()),
      contactName: contactName.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      launchDate: launchDate || undefined,
    })
    setOpen(false)
    setName('')
    setAbbreviation('')
    setContactName('')
    setContactEmail('')
    setLaunchDate('')
    navigate(`/projects/${id}`)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Project
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 glass rounded-[var(--radius-xl)] p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold tracking-tight">New Implementation</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors active:scale-95"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">
                    Association Name *
                  </label>
                  <Input
                    placeholder="American Staffing Association"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (!abbreviation || abbreviation === suggestAbbreviation(name)) {
                        setAbbreviation(suggestAbbreviation(e.target.value))
                      }
                    }}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">
                    Abbreviation
                  </label>
                  <Input
                    placeholder="ASA"
                    value={abbreviation}
                    onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
                    maxLength={12}
                    className="uppercase font-semibold tracking-wide"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">
                    Primary Contact
                  </label>
                  <Input
                    placeholder="Contact name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">
                    Contact Email
                  </label>
                  <Input
                    type="email"
                    placeholder="name@association.org"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1 block">
                    Target Launch Date
                  </label>
                  <DatePicker
                    value={launchDate}
                    onChange={(e) => setLaunchDate(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button className="flex-1" onClick={handleCreate} disabled={!name.trim()}>
                  Create Project
                </Button>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
