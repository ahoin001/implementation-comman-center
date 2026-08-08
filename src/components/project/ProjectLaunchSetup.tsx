import { useState, type ReactNode } from 'react'
import { Check, Ban, Minus, AlertCircle, Rocket } from 'lucide-react'
import type {
  DataAssetKey,
  DeliverableKey,
  ImageAssetsStatus,
  Project,
  ProjectTaskKey,
  ProjectTaskStatus,
} from '@/types'
import {
  DATA_IMPORT_INVENTORY_KEYS,
  DATA_ASSET_LABELS,
  FLEXIBLE_TASK_KEYS,
  LAUNCH_TASK_KEY,
  PROJECT_TASK_LABELS,
  PROJECT_TASK_STATUS_LABELS,
} from '@/types'
import {
  arePreLaunchTasksComplete,
  calculateProgress,
  canCompleteLaunch,
  getActivePreLaunchKeys,
  getLaunchReadinessLabel,
  getTaskCounts,
  isTaskComplete,
} from '@/lib/progress'
import { getMissingRequiredDocs } from '@/lib/deliverables'
import {
  getInventoryAssetsReceived,
  hasResumeData,
  isSsoEnabled,
  needsSsoCredentials,
  weHandleSales,
} from '@/lib/pathConfig'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
  DeliverableCheckbox,
  RequiredDocsCallout,
} from '@/components/project/DeliverableControls'
import { PathProjectSettings } from '@/components/project/PathProjectSettings'
import { cn } from '@/lib/utils'

interface ProjectLaunchSetupProps {
  project: Project
  onUpdateTask: (
    taskKey: ProjectTaskKey,
    status: ProjectTaskStatus,
    blockedReason?: string
  ) => void
  onUpdateDeliverable: (key: DeliverableKey, patch: { received?: boolean; note?: string }) => void
  onSetSsoEnabled: (enabled: boolean) => void
  onSetHasResumeData: (enabled: boolean) => void
  onSetWeHandleSales: (enabled: boolean) => void
  onSetImageAssets: (status: ImageAssetsStatus) => void
  onToggleDataAsset: (key: DataAssetKey, value: boolean) => void
}

const statusOptions: {
  value: ProjectTaskStatus
  label: string
  icon: typeof Check
  activeClass: string
}[] = [
  {
    value: 'done',
    label: 'Done',
    icon: Check,
    activeClass: 'bg-[var(--color-success)]/15 text-[var(--color-success)] ring-[var(--color-success)]/30',
  },
  {
    value: 'not_needed',
    label: 'N/A',
    icon: Minus,
    activeClass: 'bg-black/5 dark:bg-white/10 text-[var(--color-muted-foreground)] ring-black/10',
  },
  {
    value: 'blocked',
    label: 'Blocked',
    icon: Ban,
    activeClass: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] ring-[var(--color-danger)]/30',
  },
  {
    value: 'pending',
    label: 'To Do',
    icon: AlertCircle,
    activeClass: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] ring-[var(--color-accent)]/30',
  },
]

function countOptionalMissing(project: Project): number {
  let n = 0
  if (!project.deliverables.ach?.received) n++
  if (!project.deliverables.w9?.received) n++
  if (needsSsoCredentials(project)) n++
  return n
}

export function ProjectLaunchSetup({
  project,
  onUpdateTask,
  onUpdateDeliverable,
  onSetSsoEnabled,
  onSetHasResumeData,
  onSetWeHandleSales,
  onSetImageAssets,
  onToggleDataAsset,
}: ProjectLaunchSetupProps) {
  const ssoOn = isSsoEnabled(project)
  const resumesOn = hasResumeData(project)
  const salesOn = weHandleSales(project)
  const progress = calculateProgress(project)
  const label = getLaunchReadinessLabel(project)
  const counts = getTaskCounts(project)
  const launchUnlocked = canCompleteLaunch(project)
  const readyToLaunch =
    arePreLaunchTasksComplete(project) && project.tasks.launch?.status !== 'done'
  const missingDocs = getMissingRequiredDocs(project)
  const missingCreds = needsSsoCredentials(project)
  const optionalMissing = countOptionalMissing(project)
  const openTasks = counts.pending + counts.blocked
  const requiredKeys = getActivePreLaunchKeys(project)
  const inventoryGot = getInventoryAssetsReceived(project)

  const [editingNote, setEditingNote] = useState<ProjectTaskKey | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const openNoteEditor = (taskKey: ProjectTaskKey, status: ProjectTaskStatus) => {
    setEditingNote(taskKey)
    setNoteDraft(project.tasks[taskKey].blockedReason ?? '')
    onUpdateTask(taskKey, status, project.tasks[taskKey].blockedReason)
  }

  const handleStatus = (taskKey: ProjectTaskKey, status: ProjectTaskStatus) => {
    if (taskKey === LAUNCH_TASK_KEY) {
      if (status === 'not_needed') return
      if (status === 'done' && !launchUnlocked) return
    }
    if (status === 'blocked' || status === 'pending') {
      openNoteEditor(taskKey, status)
      return
    }
    setEditingNote(null)
    onUpdateTask(taskKey, status)
  }

  const saveNote = (taskKey: ProjectTaskKey) => {
    const status = project.tasks[taskKey].status
    const noteStatus = status === 'blocked' || status === 'pending' ? status : 'pending'
    const trimmed = noteDraft.trim()
    onUpdateTask(taskKey, noteStatus, trimmed || (noteStatus === 'blocked' ? 'Blocked' : undefined))
    setEditingNote(null)
  }

  const renderTaskRow = (taskKey: ProjectTaskKey, options?: { flexible?: boolean }) => {
    const task = project.tasks[taskKey]
    if (!task) return null
    const isLaunch = taskKey === LAUNCH_TASK_KEY
    const statusButtons = isLaunch
      ? statusOptions.filter((o) => o.value !== 'not_needed')
      : statusOptions
    const isBlocked = task.status === 'blocked'

    return (
      <li
        key={taskKey}
        className={cn(
          'rounded-[var(--radius-md)] border border-[var(--color-border)] p-3',
          isBlocked && 'border-[var(--color-danger)]/30',
          isLaunch && readyToLaunch && 'border-[var(--color-accent)]/40',
          options?.flexible && 'border-dashed'
        )}
      >
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                'text-sm font-medium flex items-center gap-1.5',
                isTaskComplete(task.status) && 'line-through text-[var(--color-muted-foreground)]'
              )}
            >
              {isLaunch && (
                <Rocket className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" />
              )}
              {PROJECT_TASK_LABELS[taskKey]}
            </p>
            <span className="text-[10px] text-[var(--color-muted-foreground)]">
              {PROJECT_TASK_STATUS_LABELS[task.status]}
            </span>
            {options?.flexible && (
              <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
                Flexible
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {statusButtons.map(({ value, label: optLabel, icon: Icon, activeClass }) => {
              const active = task.status === value
              const lockedDone = isLaunch && value === 'done' && !launchUnlocked
              return (
                <button
                  key={value}
                  type="button"
                  disabled={lockedDone}
                  onClick={() => handleStatus(taskKey, value)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-transparent transition-[transform,background-color,color] duration-150 active:scale-[0.97]',
                    active
                      ? activeClass
                      : 'text-[var(--color-muted-foreground)] hover:bg-black/5 dark:hover:bg-white/5',
                    lockedDone && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {optLabel}
                </button>
              )
            })}
          </div>

          {isLaunch && !launchUnlocked && (
            <p className="text-[11px] text-[var(--color-muted-foreground)]">
              Complete all required tasks above (Done or N/A) to unlock Launch Done
            </p>
          )}

          {task.blockedReason &&
            editingNote !== taskKey &&
            (isBlocked || task.status === 'pending') && (
              <button
                type="button"
                onClick={() => openNoteEditor(taskKey, task.status)}
                className={cn(
                  'text-xs text-left',
                  isBlocked
                    ? 'text-[var(--color-danger)]'
                    : 'text-[var(--color-muted-foreground)]'
                )}
              >
                {task.blockedReason}
              </button>
            )}

          {editingNote === taskKey && (
            <div className="flex gap-2">
              <Input
                placeholder={
                  task.status === 'blocked' ? 'Why is this blocked?' : 'Add a note…'
                }
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveNote(taskKey)}
                autoFocus
                className="text-sm"
              />
              <button
                type="button"
                onClick={() => saveNote(taskKey)}
                className="shrink-0 text-xs font-medium text-[var(--color-accent)] px-2"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </li>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <CardTitle>Setup</CardTitle>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Launch requirements vs optional ops tracking
              </p>
            </div>
            <div className="text-right shrink-0 space-y-0.5">
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                {progress}% · {label}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)] tabular-nums">
                {openTasks} open · {counts.blocked} blocked
                {optionalMissing > 0 && (
                  <>
                    <span className="mx-1.5 text-[var(--color-muted)]">·</span>
                    {optionalMissing} optional missing
                  </>
                )}
              </p>
            </div>
          </div>

          <PathProjectSettings
            ssoEnabled={ssoOn}
            hasResumeData={resumesOn}
            weHandleSales={salesOn}
            onSetSsoEnabled={onSetSsoEnabled}
            onSetHasResumeData={onSetHasResumeData}
            onSetWeHandleSales={onSetWeHandleSales}
          />

          {(missingDocs.length > 0 || missingCreds) && (
            <div className="space-y-2">
              {missingDocs.length > 0 && <RequiredDocsCallout missing={missingDocs} />}
              {missingCreds && (
                <div className="w-full rounded-[var(--radius-md)] border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/[0.06] px-3 py-2 text-xs text-[var(--color-warning)]">
                  Missing SSO test credentials
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <div className="space-y-6">
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Required for launch</h3>
            <p className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5">
              These tasks unlock Launch Done
              {!ssoOn && ' · SSO off, not required'}
            </p>
          </div>
          <ul className="space-y-2">
            {requiredKeys.map((key) => renderTaskRow(key))}
            {renderTaskRow(LAUNCH_TASK_KEY)}
          </ul>
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-[var(--color-muted-foreground)]">
              Anytime
            </h3>
            <p className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5">
              Before or after go-live — does not block Launch
            </p>
          </div>
          <ul className="space-y-2">
            {FLEXIBLE_TASK_KEYS.map((key) => renderTaskRow(key, { flexible: true }))}
          </ul>
        </section>

        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-[var(--color-muted-foreground)]">
              Optional / ops track
            </h3>
            <p className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5">
              Recommended for ops — does not block Launch
            </p>
          </div>

          <div className="space-y-3">
            <OpsGroup title="Paperwork">
              <DeliverableCheckbox
                deliverableKey="ach"
                project={project}
                recommended
                onToggle={(k, received) => onUpdateDeliverable(k, { received })}
                onNoteChange={(k, note) => onUpdateDeliverable(k, { note })}
              />
              <DeliverableCheckbox
                deliverableKey="w9"
                project={project}
                recommended
                onToggle={(k, received) => onUpdateDeliverable(k, { received })}
                onNoteChange={(k, note) => onUpdateDeliverable(k, { note })}
              />
            </OpsGroup>

            <OpsGroup title="Site assets">
              <div className="space-y-2 px-2 py-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm">Provided images</p>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
                    Optional
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { value: 'provided' as const, label: 'Provided' },
                      { value: 'not_providing' as const, label: 'Not providing' },
                      { value: 'pending' as const, label: 'Pending' },
                    ] as const
                  ).map(({ value, label: optLabel }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => onSetImageAssets(value)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                        project.pathConfig.imageAssets === value
                          ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                          : 'text-[var(--color-muted-foreground)] hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      {optLabel}
                    </button>
                  ))}
                </div>
              </div>
            </OpsGroup>

            <OpsGroup
              title="Data inventory"
              badge={`${inventoryGot.length}/${DATA_IMPORT_INVENTORY_KEYS.length}`}
            >
              <p className="text-[11px] text-[var(--color-muted-foreground)] px-2 pb-1">
                Mark what the association has — Data Import task is in Required above
                {resumesOn && ' · Resumes on site is on in settings'}
              </p>
              {DATA_IMPORT_INVENTORY_KEYS.map((key) => {
                const checked = Boolean(project.pathConfig.dataAssets[key])
                return (
                  <label
                    key={key}
                    className={cn(
                      'flex items-center gap-2.5 rounded-[var(--radius-md)] px-2 py-1.5 text-sm cursor-pointer',
                      'hover:bg-black/5 dark:hover:bg-white/5',
                      checked
                        ? 'text-[var(--color-foreground)]'
                        : 'text-[var(--color-muted-foreground)]'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                        checked
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                          : 'border-[var(--color-border)]'
                      )}
                    >
                      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={(e) => onToggleDataAsset(key, e.target.checked)}
                    />
                    {DATA_ASSET_LABELS[key]}
                  </label>
                )
              })}
            </OpsGroup>

            {ssoOn && (
              <OpsGroup title="SSO extras">
                <DeliverableCheckbox
                  deliverableKey="sso_test_credentials"
                  project={project}
                  recommended
                  onToggle={(k, received) => onUpdateDeliverable(k, { received })}
                  onNoteChange={(k, note) => onUpdateDeliverable(k, { note })}
                />
              </OpsGroup>
            )}

            <OpsGroup title="Enablement extras">
              <DeliverableCheckbox
                deliverableKey="custom_categories"
                project={project}
                recommended
                onToggle={(k, received) => onUpdateDeliverable(k, { received })}
                onNoteChange={(k, note) => onUpdateDeliverable(k, { note })}
              />
            </OpsGroup>
          </div>
        </section>
      </div>
    </Card>
  )
}

function OpsGroup({
  title,
  badge,
  children,
}: {
  title: string
  badge?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-3 space-y-1">
      <div className="flex items-baseline justify-between gap-2 px-2 mb-1">
        <h4 className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
          {title}
        </h4>
        {badge && (
          <span className="text-[10px] tabular-nums text-[var(--color-muted)]">{badge}</span>
        )}
      </div>
      {children}
    </div>
  )
}
