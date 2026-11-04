import type { LaunchTask, Profile } from '@/types'
import type { LaunchParty, LaunchTaskStatus } from '@/lib/launchTemplate'
import {
  LAUNCH_PARTY_LABELS,
  LAUNCH_PHASES,
  LAUNCH_STATUS_LABELS,
} from '@/lib/launchTemplate'
import { cn } from '@/lib/utils'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import { TaskCommentThread } from '@/components/project/TaskCommentThread'
import { taskStatusTriggerClass, taskTitleClass } from '@/components/project/taskGlance'

const statusOptions = (Object.keys(LAUNCH_STATUS_LABELS) as LaunchTaskStatus[]).map((status) => ({
  value: status,
  label: LAUNCH_STATUS_LABELS[status],
}))

export interface PlanGroup {
  group: { key: string; phaseKey: string; title: string }
  rows: LaunchTask[]
  done: number
  total: number
}

interface LaunchPlanSheetProps {
  groups: PlanGroup[]
  profiles: Profile[]
  names: Map<string, string>
  currentUserId: string | null
  onUpdateTask: (
    taskId: string,
    patch: {
      status?: LaunchTaskStatus
      dueDate?: string | null
      assigneeId?: string | null
    }
  ) => void
  onAddComment: (taskId: string, body: string) => void
  onUpdateComment: (taskId: string, commentId: string, body: string) => void
  onDeleteComment: (taskId: string, commentId: string) => void
}

export function LaunchPlanSheet({
  groups,
  profiles,
  names,
  currentUserId,
  onUpdateTask,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: LaunchPlanSheetProps) {
  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...profiles.map((profile) => ({ value: profile.id, label: profile.displayName })),
  ]
  const phases = LAUNCH_PHASES.map((phase) => ({
    phase,
    groups: groups.filter((item) => item.group.phaseKey === phase.key),
  })).filter((item) => item.groups.length > 0)

  return (
    <div className="plan-sheet float-panel">
      <table>
        <thead>
          <tr>
            <th>Task</th>
            <th className="w-[11rem]">Lead</th>
            <th className="w-[8.5rem]">Due</th>
            <th className="w-[9rem]">Status</th>
            <th className="w-[13.5rem]">Comments</th>
          </tr>
        </thead>
        <tbody>
          {phases.map(({ phase, groups: phaseGroups }) => (
            <PhaseBlock
              key={phase.key}
              phaseKey={phase.key}
              title={phase.title}
              groups={phaseGroups}
              assigneeOptions={assigneeOptions}
              names={names}
              currentUserId={currentUserId}
              onUpdateTask={onUpdateTask}
              onAddComment={onAddComment}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PhaseBlock({
  phaseKey,
  title,
  groups,
  assigneeOptions,
  names,
  currentUserId,
  onUpdateTask,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: {
  phaseKey: string
  title: string
  groups: PlanGroup[]
  assigneeOptions: { value: string; label: string }[]
  names: Map<string, string>
  currentUserId: string | null
  onUpdateTask: LaunchPlanSheetProps['onUpdateTask']
  onAddComment: LaunchPlanSheetProps['onAddComment']
  onUpdateComment: LaunchPlanSheetProps['onUpdateComment']
  onDeleteComment: LaunchPlanSheetProps['onDeleteComment']
}) {
  const total = groups.reduce((sum, group) => sum + group.total, 0)
  const done = groups.reduce((sum, group) => sum + group.done, 0)

  return (
    <>
      <tr className="plan-phase" data-phase={phaseKey}>
        <td colSpan={5}>
          <span className="plan-phase-inner">
            <span className="plan-phase-mark" aria-hidden />
            <span className="plan-phase-title">{title}</span>
            {total > 0 && (
              <span className="plan-phase-meta">
                {done} of {total}
              </span>
            )}
          </span>
        </td>
      </tr>
      {groups.map((item) => (
        <GroupBlock
          key={item.group.key}
          item={item}
          assigneeOptions={assigneeOptions}
          names={names}
          currentUserId={currentUserId}
          onUpdateTask={onUpdateTask}
          onAddComment={onAddComment}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
        />
      ))}
    </>
  )
}

function GroupBlock({
  item,
  assigneeOptions,
  names,
  currentUserId,
  onUpdateTask,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: {
  item: PlanGroup
  assigneeOptions: { value: string; label: string }[]
  names: Map<string, string>
  currentUserId: string | null
  onUpdateTask: LaunchPlanSheetProps['onUpdateTask']
  onAddComment: LaunchPlanSheetProps['onAddComment']
  onUpdateComment: LaunchPlanSheetProps['onUpdateComment']
  onDeleteComment: LaunchPlanSheetProps['onDeleteComment']
}) {
  return (
    <>
      <tr className="plan-group">
        <td colSpan={5}>
          <span className="plan-group-inner">
            <span>{item.group.title}</span>
            <span className="plan-group-meta">
              {item.total === 0 ? 'As needed' : `${item.done} of ${item.total}`}
            </span>
          </span>
        </td>
      </tr>
      {item.rows.map((task) => (
        <PlanRow
          key={task.id}
          task={task}
          assigneeOptions={assigneeOptions}
          names={names}
          currentUserId={currentUserId}
          onUpdate={(patch) => onUpdateTask(task.id, patch)}
          onAddComment={(body) => onAddComment(task.id, body)}
          onUpdateComment={(commentId, body) => onUpdateComment(task.id, commentId, body)}
          onDeleteComment={(commentId) => onDeleteComment(task.id, commentId)}
        />
      ))}
    </>
  )
}

function PlanRow({
  task,
  assigneeOptions,
  names,
  currentUserId,
  onUpdate,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
}: {
  task: LaunchTask
  assigneeOptions: { value: string; label: string }[]
  names: Map<string, string>
  currentUserId: string | null
  onUpdate: (patch: {
    status?: LaunchTaskStatus
    dueDate?: string | null
    assigneeId?: string | null
  }) => void
  onAddComment: (body: string) => void
  onUpdateComment: (commentId: string, body: string) => void
  onDeleteComment: (commentId: string) => void
}) {
  return (
    <tr className="plan-row">
      <td>
        <p className={cn('text-sm leading-5', taskTitleClass(task.status))}>
          {task.title}
        </p>
        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--ink-3)]">{task.description}</p>
        )}
      </td>
      <td>
        <div className="flex w-full flex-col gap-1">
          <LeadChip party={task.party} />
          <Select
            ariaLabel={`Assignee for ${task.title}`}
            size="sm"
            className="w-full"
            value={task.assigneeId ?? ''}
            options={assigneeOptions}
            onChange={(value) => onUpdate({ assigneeId: value || null })}
          />
        </div>
      </td>
      <td className="pt-8">
        <DatePicker
          aria-label={`Due date for ${task.title}`}
          value={task.dueDate?.slice(0, 10) ?? ''}
          placeholder="No date"
          onChange={(event) => onUpdate({ dueDate: event.target.value || null })}
          className="h-9"
        />
      </td>
      <td className="pt-8">
        <Select
          ariaLabel={`Status for ${task.title}`}
          size="sm"
          value={task.status}
          options={statusOptions}
          triggerClassName={taskStatusTriggerClass(task.status)}
          onChange={(value) => onUpdate({ status: value as LaunchTaskStatus })}
        />
      </td>
      <td>
        <TaskCommentThread
          comments={task.comments}
          names={names}
          currentUserId={currentUserId}
          onAdd={onAddComment}
          onUpdate={onUpdateComment}
          onDelete={onDeleteComment}
        />
      </td>
    </tr>
  )
}

function LeadChip({ party }: { party: LaunchParty }) {
  const client = party === 'client'
  return (
    <span
      className={cn(
        'flex h-5 w-full items-center rounded-md px-2.5 text-[11px] font-medium',
        client
          ? 'bg-[color-mix(in_srgb,var(--color-warning)_14%,var(--color-panel))] text-[color-mix(in_srgb,#8a5a12_62%,var(--ink))]'
          : 'bg-[var(--color-wash)] text-[var(--color-wash-strong)]'
      )}
    >
      {LAUNCH_PARTY_LABELS[party]}
    </span>
  )
}
