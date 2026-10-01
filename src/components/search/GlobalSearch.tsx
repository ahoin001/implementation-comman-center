import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Panel } from '@/components/ui/Panel'
import { useStore } from '@/store/useStore'
import { useActiveProjects, searchProjects } from '@/hooks/useProjects'
import { getPrimaryOpenTask } from '@/lib/progress'
import { cn } from '@/lib/utils'

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [localQuery, setLocalQuery] = useState('')
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const projects = useActiveProjects()
  const results = localQuery ? searchProjects(projects, localQuery).slice(0, 6) : []

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (projectId: string) => {
    setOpen(false)
    setLocalQuery('')
    navigate(`/projects/${projectId}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(localQuery)
    setOpen(false)
    navigate('/projects')
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted)]" />
          <Input
            placeholder="Search projects, contacts, notes…"
            value={localQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            className="h-10 rounded-full border-transparent bg-[var(--color-panel)] pl-9 pr-16 shadow-[var(--shadow-panel)]"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 items-center rounded border border-[var(--color-border)] px-1.5 text-[10px] text-[var(--color-muted)]">
            ⌘K
          </kbd>
        </div>
      </form>

      {open && localQuery && results.length > 0 && (
        <Panel className="absolute top-full z-50 mt-2 w-full overflow-hidden">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p.id)}
              className={cn(
                'flex w-full flex-col items-start px-4 py-3 text-left transition-colors duration-150',
                'hover:bg-[var(--color-field)] active:scale-[0.99]'
              )}
            >
              <span className="text-sm font-medium">{p.name}</span>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                {getPrimaryOpenTask(p)?.label ?? 'All tasks complete'}
              </span>
            </button>
          ))}
        </Panel>
      )}
    </div>
  )
}
