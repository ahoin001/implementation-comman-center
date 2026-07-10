import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Copy, ExternalLink, Calendar, Pin } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { calculateProgress, getCurrentStageLabel } from '@/lib/progress'
import { calculateHealth, getDaysRemaining, formatLaunchDate } from '@/lib/health'
import { WAITING_ON_LABELS, type WaitingOn } from '@/types'
import { ProgressRing } from '@/components/project/ProgressRing'
import { ProjectAvatar, ProjectTitle } from '@/components/project/ProjectIdentity'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { ProjectTaskDesk } from '@/components/project/ProjectTaskDesk'
import { QuickLinks } from '@/components/project/QuickLinks'
import { ProjectLinksEditor } from '@/components/project/ProjectLinksEditor'
import { ContactEditor } from '@/components/project/ContactEditor'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { DatePicker } from '@/components/ui/DatePicker'
import { format, parseISO } from 'date-fns'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const project = useStore((s) => s.getProject(id ?? ''))
  const updateProjectTask = useStore((s) => s.updateProjectTask)
  const updateWaitingOn = useStore((s) => s.updateWaitingOn)
  const addNote = useStore((s) => s.addNote)
  const archiveProject = useStore((s) => s.archiveProject)
  const updateProjectLinks = useStore((s) => s.updateProjectLinks)
  const updateProjectContact = useStore((s) => s.updateProjectContact)
  const updateProject = useStore((s) => s.updateProject)

  const [noteContent, setNoteContent] = useState('')
  const [copied, setCopied] = useState(false)

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--color-muted-foreground)] mb-4">Project not found</p>
        <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
      </div>
    )
  }

  const progress = calculateProgress(project)
  const health = calculateHealth(project)
  const stageLabel = getCurrentStageLabel(project)
  const daysRemaining = getDaysRemaining(project.launchDate)
  const pid = project.id

  const handleCopyStaging = async () => {
    if (project.links.stagingSite) {
      await navigator.clipboard.writeText(project.links.stagingSite)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAddNote = () => {
    if (noteContent.trim()) {
      addNote(project.id, noteContent.trim())
      setNoteContent('')
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }}>
      <Link
        to="/projects"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-6 transition-colors duration-150"
      >
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Link>

      {/* Hero — shared layout with project card */}
      <motion.div
        layoutId={`project-card-${pid}`}
        className="glass rounded-[var(--radius-xl)] p-6 mb-6"
        transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
      >
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <ProjectAvatar name={project.name} abbreviation={project.abbreviation} layoutId={`project-avatar-${pid}`} size="md" />
          <div className="flex-1 min-w-0 w-full">
            <ProjectTitle name={project.name} subtitle={stageLabel} layoutId={`project-title-${pid}`} size="lg" />

            <div className="mt-3 max-w-[140px]">
              <label className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1 block">
                Abbreviation
              </label>
              <Input
                value={project.abbreviation}
                onChange={(e) => updateProject(project.id, { abbreviation: e.target.value.toUpperCase() })}
                placeholder="ASA"
                className="font-semibold tracking-wide uppercase h-9"
                maxLength={12}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-3">
              <motion.div layoutId={`project-health-${pid}`}>
                <HealthBadge health={health} />
              </motion.div>
            </div>

            {/* Launch date — primary info in hero */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] shrink-0">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Launch Date</span>
              </div>
              <DatePicker
                value={project.launchDate?.split('T')[0] ?? ''}
                onChange={(e) => updateProject(project.id, { launchDate: e.target.value || undefined })}
                className="max-w-[240px]"
                placeholder="Set launch date"
              />
              {project.launchDate && (
                <span className="text-sm text-[var(--color-muted-foreground)]">
                  {formatLaunchDate(project.launchDate)}
                  {daysRemaining !== null && daysRemaining >= 0 && ` · ${daysRemaining} days remaining`}
                  {daysRemaining !== null && daysRemaining < 0 && ` · ${Math.abs(daysRemaining)} days overdue`}
                </span>
              )}
            </div>
          </div>
          <ProgressRing progress={progress} size={80} strokeWidth={5} layoutId={`project-progress-${pid}`} />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <ProjectTaskDesk
            project={project}
            onUpdateTask={(taskKey, status, blockedReason) =>
              updateProjectTask(project.id, taskKey, status, blockedReason)
            }
          />

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <QuickLinks links={project.links} />
            <ProjectLinksEditor links={project.links} onSave={(links) => updateProjectLinks(project.id, links)} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Staging Site</CardTitle>
            </CardHeader>
            {project.links.stagingSite ? (
              <div className="flex items-center gap-3">
                <code className="flex-1 text-sm bg-black/5 dark:bg-white/5 rounded-[var(--radius-md)] px-3 py-2 truncate">
                  {project.links.stagingSite}
                </code>
                <Button variant="secondary" size="icon" onClick={handleCopyStaging} title="Copy URL">
                  <Copy className="h-4 w-4" />
                </Button>
                <a
                  href={project.links.stagingSite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-white text-sm font-medium transition-opacity duration-150 hover:opacity-90 active:scale-[0.97]"
                >
                  Open <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-muted-foreground)]">Add a staging URL via Edit Links above.</p>
            )}
            {copied && <p className="text-xs text-[var(--color-success)] mt-2">Copied to clipboard</p>}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <div className="flex gap-2 mb-4">
              <Textarea
                placeholder="Add a note…"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddNote} disabled={!noteContent.trim()} className="self-end">
                Add
              </Button>
            </div>
            <ul className="space-y-3">
              {project.notes.map((note) => (
                <li key={note.id} className="text-sm border-l-2 border-[var(--color-accent)]/30 pl-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    {note.pinned && <Pin className="h-3 w-3 text-[var(--color-accent)]" />}
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {format(parseISO(note.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p>{note.content}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Waiting On</CardTitle>
            </CardHeader>
            <select
              value={project.waitingOn}
              onChange={(e) => updateWaitingOn(project.id, e.target.value as WaitingOn)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card-solid)] px-3 py-2 text-sm"
            >
              {Object.entries(WAITING_ON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--color-muted-foreground)] mt-2">
              Currently: {WAITING_ON_LABELS[project.waitingOn]}
            </p>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <ContactEditor
              contact={project.contact}
              onSave={(contact) => updateProjectContact(project.id, contact)}
            />
          </Card>

          {!project.archived && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                archiveProject(project.id)
                navigate('/archive')
              }}
            >
              Archive Project
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
