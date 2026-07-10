import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Pin } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { calculateProgress, getCurrentStageLabel } from '@/lib/progress'
import { calculateHealth, getDaysRemaining } from '@/lib/health'
import { ProgressRing } from '@/components/project/ProgressRing'
import { ProjectAvatar, ProjectTitle } from '@/components/project/ProjectIdentity'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { ProjectTaskDesk } from '@/components/project/ProjectTaskDesk'
import { QuickLinks } from '@/components/project/QuickLinks'
import { ProjectLinksEditor } from '@/components/project/ProjectLinksEditor'
import { ProjectHeroMeta } from '@/components/project/ProjectHeroMeta'
import { WaitingOnPanel } from '@/components/project/WaitingOnPanel'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { format, parseISO } from 'date-fns'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const project = useStore((s) => s.getProject(id ?? ''))
  const updateProjectTask = useStore((s) => s.updateProjectTask)
  const updateWaitingOn = useStore((s) => s.updateWaitingOn)
  const logOutreach = useStore((s) => s.logOutreach)
  const undoOutreach = useStore((s) => s.undoOutreach)
  const addNote = useStore((s) => s.addNote)
  const archiveProject = useStore((s) => s.archiveProject)
  const updateProjectLinks = useStore((s) => s.updateProjectLinks)
  const updateProjectContact = useStore((s) => s.updateProjectContact)
  const updateProject = useStore((s) => s.updateProject)

  const [noteContent, setNoteContent] = useState('')

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

      <motion.div
        layoutId={`project-card-${pid}`}
        className="glass rounded-[var(--radius-xl)] p-6 mb-6"
        transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
      >
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <ProjectAvatar name={project.name} abbreviation={project.abbreviation} layoutId={`project-avatar-${pid}`} size="md" />
          <div className="flex-1 min-w-0 w-full">
            <ProjectTitle
              name={project.name}
              abbreviation={project.abbreviation}
              onAbbreviationChange={(abbreviation) => updateProject(project.id, { abbreviation })}
              subtitle={stageLabel}
              layoutId={`project-title-${pid}`}
              size="lg"
            />

            <div className="flex flex-wrap items-center gap-3 mt-3">
              <motion.div layoutId={`project-health-${pid}`}>
                <HealthBadge health={health} />
              </motion.div>
            </div>

            <ProjectHeroMeta
              launchDate={project.launchDate}
              daysRemaining={daysRemaining}
              stagingUrl={project.links.stagingSite}
              contact={project.contact}
              onLaunchDateChange={(launchDate) => updateProject(project.id, { launchDate })}
              onContactSave={(contact) => updateProjectContact(project.id, contact)}
            />
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
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Waiting On</CardTitle>
            </CardHeader>
            <WaitingOnPanel
              project={project}
              onWaitingOnChange={(waitingOn) => updateWaitingOn(project.id, waitingOn)}
              onLogOutreach={() => logOutreach(project.id)}
              onUndoOutreach={() => undoOutreach(project.id)}
            />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <div className="flex flex-col gap-2 mb-4">
              <Textarea
                placeholder="Add a note…"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
              <Button onClick={handleAddNote} disabled={!noteContent.trim()} className="self-end">
                Add
              </Button>
            </div>
            <ul className="space-y-3 max-h-[420px] overflow-y-auto">
              {project.notes.length === 0 && (
                <li className="text-sm text-[var(--color-muted-foreground)] py-2">No notes yet</li>
              )}
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
