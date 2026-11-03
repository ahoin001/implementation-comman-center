import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Panel } from '@/components/ui/Panel'
import { useStore } from '@/store/useStore'
import { useActiveProjects, searchProjects } from '@/hooks/useProjects'
import { getPrimaryOpenTask } from '@/lib/progress'
import { cn } from '@/lib/utils'

export function GlobalSearch({ className }: { className?: string }) {
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
    <div ref={containerRef} className={cn('search-wrap relative w-full max-w-sm shrink-0', className)}>
      <form onSubmit={handleSubmit}>
        <Search className="search-ico h-4 w-4" />
        <Input
          shape="pill"
          placeholder="Search projects, contacts, notes…"
          value={localQuery}
          onChange={(e) => {
            setLocalQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="pr-16"
        />
        <kbd className="kbd absolute right-3 top-1/2 hidden -translate-y-1/2 sm:inline-flex">⌘K</kbd>
      </form>

      {open && localQuery && results.length > 0 && (
        <Panel className="absolute top-full z-50 mt-2 w-full overflow-hidden p-1">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p.id)}
              className="row w-full text-left"
            >
              <span className="grow">
                <span className="title">{p.name}</span>
                <span className="sub">{getPrimaryOpenTask(p)?.label ?? 'All tasks complete'}</span>
              </span>
            </button>
          ))}
        </Panel>
      )}
    </div>
  )
}
