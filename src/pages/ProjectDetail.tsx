import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { currentLaunchStage, isLaunchApplicable, launchBoardProgress } from '@/lib/launchTemplate'
import { calculateHealth, formatLaunchDate, getDaysRemaining } from '@/lib/health'
import { ProjectTitle } from '@/components/project/ProjectIdentity'
import { HealthBadge } from '@/components/ui/HealthBadge'
import { LaunchBoard } from '@/components/project/LaunchBoard'
import { MemberFeaturesPanel } from '@/components/project/MemberFeaturesPanel'
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
  const memberFeatureDefinitions = useStore((s) => s.memberFeatureDefinitions)
  const profiles = useStore((s) => s.profiles)
  const currentUserId = useStore((s) => s.currentUserId)
  const updateLaunchTask = useStore((s) => s.updateLaunchTask)
  const addTaskComment = useStore((s) => s.addTaskComment)
  const toggleMemberFeature = useStore((s) => s.toggleMemberFeature)
  const addMemberFeatureDefinition = useStore((s) => s.addMemberFeatureDefinition)
  const deleteMemberFeatureDefinition = useStore((s) => s.deleteMemberFeatureDefinition)
  const updateWaitingOn = useStore((s) => s.updateWaitingOn)
  const logOutreach = useStore((s) => s.logOutreach)
  const undoOutreach = useStore((s) => s.undoOutreach)
  const addNote = useStore((s) => s.addNote)
  const updateNote = useStore((s) => s.updateNote)
  const deleteNote = useStore((s) => s.deleteNote)
  const toggleNotePin = useStore((s) => s.toggleNotePin)
  const archiveProject = useStore((s) => s.archiveProject)
  const unarchiveProject = useStore((s) => s.unarchiveProject)
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

  const board = project.launchTasks ?? []
  const live = board.filter((task) => !task.legacy)
  const applicable = live.filter((task) => isLaunchApplicable(task.status))
  const completeCount = applicable.filter((task) => task.status === 'complete').length
  const progress = live.length ? launchBoardProgress(live) : 0
  const stageLabel = live.length ? currentLaunchStage(live) : 'Launch board'
  const daysRemaining = getDaysRemaining(project.launchDate)
  const commentCount = live.reduce((sum, task) => sum + task.comments.length, 0)
  const inProgress = live.filter((task) => task.status === 'in_progress').length
  const notStarted = live.filter((task) => task.status === 'not_started').length
  const crewCounts = new Map<string, number>()
  for (const task of live) {
    if (!task.assigneeId) continue
    crewCounts.set(task.assigneeId, (crewCounts.get(task.assigneeId) ?? 0) + 1)
  }
  const crew = [...crewCounts.entries()]
    .map(([personId, count]) => ({
      id: personId,
      name: profiles.find((profile) => profile.id === personId)?.displayName ?? 'Teammate',
      count,
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <Link
            to={project.archived ? '/archive' : '/projects'}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {project.archived ? 'Archive' : 'Projects'}
          </Link>
          <ProjectTitle
            name={project.name}
            abbreviation={project.abbreviation}
            onAbbreviationChange={(abbreviation) => updateProject(project.id, { abbreviation })}
            size="lg"
          />
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {stageLabel}
            <span className="mx-1.5">·</span>
            {applicable.length} tasks
            <span className="mx-1.5">·</span>
            {profiles.length} {profiles.length === 1 ? 'teammate' : 'teammates'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {project.archived && (
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[var(--color-muted-foreground)]">
              Archived
            </span>
          )}
          <HealthBadge health={calculateHealth(project)} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(240px,0.8fr)]">
        <section className="float-panel p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b95b2]">Overall progress</p>
              <p className="mt-2 text-5xl font-semibold tracking-tight tabular-nums">{progress}%</p>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                {completeCount} of {applicable.length} tasks complete
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b95b2]">Deadline</p>
              <p className="mt-2 text-sm font-semibold">{formatLaunchDate(project.launchDate)}</p>
              {daysRemaining !== null && (
                <p className={daysRemaining < 0 ? 'text-sm text-[var(--color-danger)]' : 'text-sm text-[#178a45]'}>
                  {daysRemaining < 0
                    ? `${Math.abs(daysRemaining)} days past`
                    : daysRemaining === 0
                      ? 'Today'
                      : `${daysRemaining} days left`}
                </p>
              )}
              <input
                type="date"
                aria-label="Launch date"
                value={project.launchDate?.slice(0, 10) ?? ''}
                onChange={(event) =>
                  updateProject(project.id, { launchDate: event.target.value || undefined })
                }
                className="mt-2 h-8 rounded-full border border-[#e3e8f2] bg-white px-2 text-xs text-[var(--color-foreground)]"
              />
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e6eef8]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7d8cff] via-[#3ec6ff] to-[#2f6bff] transition-[width] duration-500 ease-[var(--ease-out)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <dl className="mt-4 grid grid-cols-4 gap-2">
            <Stat value={completeCount} label="Done" />
            <Stat value={inProgress} label="In progress" />
            <Stat value={notStarted} label="Not started" />
            <Stat value={commentCount} label="Comments" />
          </dl>
        </section>

        <section className="float-panel p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b95b2]">Who&apos;s on it</p>
          {crew.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
              Assign a task and teammates show up here.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {crew.map((person) => (
                <li key={person.id} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e7eeff] text-[11px] font-semibold text-[#2451d6]">
                    {initials(person.name)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{person.name}</span>
                  <span className="text-xs tabular-nums text-[var(--color-muted-foreground)]">
                    {person.count} {person.count === 1 ? 'task' : 'tasks'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <LaunchBoard
            project={project}
            profiles={profiles}
            currentUserId={currentUserId}
            onUpdateTask={(taskId, patch) => updateLaunchTask(project.id, taskId, patch)}
            onAddComment={(taskId, body) => addTaskComment(project.id, taskId, body)}
          />

          <MemberFeaturesPanel
            project={project}
            definitions={memberFeatureDefinitions}
            onToggle={(featureId, enabled) =>
              toggleMemberFeature(project.id, featureId, enabled)
            }
            onAddDefinition={addMemberFeatureDefinition}
            onDeleteDefinition={deleteMemberFeatureDefinition}
          />
        </div>

        <div className="space-y-4">
          <ProjectHeroMeta
            launchDate={project.launchDate}
            daysRemaining={daysRemaining}
            stagingUrl={project.links.stagingSite}
            contact={project.contact}
            onLaunchDateChange={(launchDate) => updateProject(project.id, { launchDate })}
            onContactSave={(contact) => updateProjectContact(project.id, contact)}
          />
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
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <QuickLinks links={project.links} />
            <ProjectLinksEditor
              links={project.links}
              onSave={(links) => updateProjectLinks(project.id, links)}
            />
          </Card>

          <NotesPanel
            notes={project.notes}
            onAdd={(content, severity) => addNote(project.id, content, { severity })}
            onUpdate={(noteId, updates) => updateNote(project.id, noteId, updates)}
            onDelete={(noteId) => deleteNote(project.id, noteId)}
            onTogglePin={(noteId) => toggleNotePin(project.id, noteId)}
          />

          {project.archived ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                unarchiveProject(project.id)
                navigate('/projects')
              }}
            >
              Unarchive Project
            </Button>
          ) : (
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

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="text-[11px] text-[var(--color-muted-foreground)]">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums tracking-tight">{value}</dd>
    </div>
  )
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}
