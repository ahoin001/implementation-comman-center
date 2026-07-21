import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { calculateProgress, getCurrentStageLabel } from '@/lib/progress'
import { calculateHealth, getDaysRemaining } from '@/lib/health'
import { ProgressRing } from '@/components/project/ProgressRing'
import { ProjectAvatar, ProjectTitle } from '@/components/project/ProjectIdentity'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { RequiredDocsBadge } from '@/components/project/RequiredDocsBadge'
import { MissingCredentialsBadge } from '@/components/project/MissingCredentialsBadge'
import { ProjectLaunchPath } from '@/components/project/ProjectPathway'
import { QuickLinks } from '@/components/project/QuickLinks'
import { ProjectLinksEditor } from '@/components/project/ProjectLinksEditor'
import { ProjectHeroMeta } from '@/components/project/ProjectHeroMeta'
import { WaitingOnPanel } from '@/components/project/WaitingOnPanel'
import { NotesPanel } from '@/components/project/NotesPanel'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const project = useStore((s) => s.getProject(id ?? ''))
  const updateProjectTask = useStore((s) => s.updateProjectTask)
  const updateDeliverable = useStore((s) => s.updateDeliverable)
  const setSsoEnabled = useStore((s) => s.setSsoEnabled)
  const setImageAssets = useStore((s) => s.setImageAssets)
  const toggleDataAsset = useStore((s) => s.toggleDataAsset)
  const updateWaitingOn = useStore((s) => s.updateWaitingOn)
  const logOutreach = useStore((s) => s.logOutreach)
  const undoOutreach = useStore((s) => s.undoOutreach)
  const addNote = useStore((s) => s.addNote)
  const updateNote = useStore((s) => s.updateNote)
  const deleteNote = useStore((s) => s.deleteNote)
  const toggleNotePin = useStore((s) => s.toggleNotePin)
  const archiveProject = useStore((s) => s.archiveProject)
  const updateProjectLinks = useStore((s) => s.updateProjectLinks)
  const updateProjectContact = useStore((s) => s.updateProjectContact)
  const updateProject = useStore((s) => s.updateProject)

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

  return (
    <div>
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
        transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
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
              <motion.div
                layoutId={`project-health-${pid}`}
                transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              >
                <HealthBadge health={health} />
              </motion.div>
              <RequiredDocsBadge project={project} />
              <MissingCredentialsBadge project={project} />
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
          <ProjectLaunchPath
            project={project}
            onUpdateTask={(taskKey, status, blockedReason) =>
              updateProjectTask(project.id, taskKey, status, blockedReason)
            }
            onUpdateDeliverable={(key, patch) => updateDeliverable(project.id, key, patch)}
            onSetSsoEnabled={(enabled) => setSsoEnabled(project.id, enabled)}
            onSetImageAssets={(status) => setImageAssets(project.id, status)}
            onToggleDataAsset={(key, value) => toggleDataAsset(project.id, key, value)}
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

          <NotesPanel
            notes={project.notes}
            onAdd={(content) => addNote(project.id, content)}
            onUpdate={(noteId, content) => updateNote(project.id, noteId, content)}
            onDelete={(noteId) => deleteNote(project.id, noteId)}
            onTogglePin={(noteId) => toggleNotePin(project.id, noteId)}
          />

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
    </div>
  )
}
