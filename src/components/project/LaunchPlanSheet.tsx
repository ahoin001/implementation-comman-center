import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { LaunchTask, Profile } from '@/types'
import type { LaunchParty, LaunchTaskStatus } from '@/lib/launchTemplate'
import {
  LAUNCH_PARTY_LABELS,
  LAUNCH_PHASES,
  LAUNCH_STATUS_LABELS,
} from '@/lib/launchTemplate'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'

const STATUS_TRIGGER: Record<LaunchTaskStatus, string> = {
  not_started:
    'bg-[color-mix(in_srgb,var(--color-warning)_12%,var(--color-panel))] text-[color-mix(in_srgb,#8a5a12_55%,var(--color-ink))]',
  in_progress: 'bg-[var(--color-wash)] text-[var(--color-wash-strong)]',
  complete:
    'bg-[color-mix(in_srgb,var(--color-success)_18%,var(--color-panel))] text-[color-mix(in_srgb,#176b32_70%,var(--color-ink))]',
  na: 'bg-[var(--color-field)] text-[var(--color-ink-soft)]',
  as_needed:
    'bg-[color-mix(in_srgb,#7a5af8_12%,var(--color-panel))] text-[color-mix(in_srgb,#5b3cc4_62%,var(--color-ink))]',
}

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
  onDeleteComment: (taskId: string, commentId: string) => void
}

export function LaunchPlanSheet({
  groups,
  profiles,
  names,
  currentUserId,
  onUpdateTask,
  onAddComment,
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
    <div className="float-panel overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead>
          <tr className="border-b border-[color-mix(in_srgb,var(--color-ink)_8%,transparent)] text-xs font-medium text-[var(--color-ink-soft)]">
            <th className="px-4 py-3 font-medium">Task</th>
            <th className="w-[13rem] px-3 py-3 font-medium">Lead</th>
            <th className="w-[9.5rem] px-3 py-3 font-medium">Due</th>
            <th className="w-[9.5rem] px-3 py-3 font-medium">Status</th>
            <th className="w-[16rem] px-4 py-3 font-medium">Comments</th>
          </tr>
        </thead>
        <tbody>
          {phases.map(({ phase, groups: phaseGroups }) => (
            <PhaseBlock
              key={phase.key}
              title={phase.title}
              groups={phaseGroups}
              assigneeOptions={assigneeOptions}
              names={names}
              currentUserId={currentUserId}
              onUpdateTask={onUpdateTask}
              onAddComment={onAddComment}
              onDeleteComment={onDeleteComment}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PhaseBlock({
  title,
  groups,
  assigneeOptions,
  names,
  currentUserId,
  onUpdateTask,
  onAddComment,
  onDeleteComment,
}: {
  title: string
  groups: PlanGroup[]
  assigneeOptions: { value: string; label: string }[]
  names: Map<string, string>
  currentUserId: string | null
  onUpdateTask: LaunchPlanSheetProps['onUpdateTask']
  onAddComment: LaunchPlanSheetProps['onAddComment']
  onDeleteComment: LaunchPlanSheetProps['onDeleteComment']
}) {
  const total = groups.reduce((sum, group) => sum + group.total, 0)
  const done = groups.reduce((sum, group) => sum + group.done, 0)

  return (
    <>
      <tr>
        <td colSpan={5} className="bg-[var(--color-plan-phase)] px-4 py-2 text-sm font-semibold text-[var(--color-plan-phase-ink)]">
          <span className="flex items-center justify-between gap-3">
            <span>{title}</span>
            {total > 0 && (
              <span className="text-xs font-medium text-[color-mix(in_srgb,var(--color-plan-phase-ink)_78%,transparent)]">
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
  onDeleteComment,
}: {
  item: PlanGroup
  assigneeOptions: { value: string; label: string }[]
  names: Map<string, string>
  currentUserId: string | null
  onUpdateTask: LaunchPlanSheetProps['onUpdateTask']
  onAddComment: LaunchPlanSheetProps['onAddComment']
  onDeleteComment: LaunchPlanSheetProps['onDeleteComment']
}) {
  return (
    <>
      <tr>
        <td colSpan={5} className="bg-[var(--color-plan-group)] px-4 py-1.5 text-[13px] font-semibold text-[var(--color-plan-group-ink)]">
          <span className="flex items-center justify-between gap-3">
            <span>{item.group.title}</span>
            <span className="text-xs font-medium text-[var(--color-plan-group-meta)]">
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
  onDeleteComment: (commentId: string) => void
}) {
  return (
    <tr className="border-b border-[color-mix(in_srgb,var(--color-ink)_6%,transparent)] align-top last:border-b-0 hover:bg-[var(--color-field)]">
      <td className="px-4 py-3">
        <p
          className={cn(
            'text-sm font-medium leading-5 text-[var(--color-ink)]',
            task.status === 'complete' && 'text-[var(--color-ink-soft)]'
          )}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-ink-soft)]">{task.description}</p>
        )}
      </td>
      <td className="px-3 py-3">
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
      <td className="px-3 pb-3 pt-9">
        <DatePicker
          aria-label={`Due date for ${task.title}`}
          value={task.dueDate?.slice(0, 10) ?? ''}
          placeholder="No date"
          onChange={(event) => onUpdate({ dueDate: event.target.value || null })}
          className="h-9"
        />
      </td>
      <td className="px-3 pb-3 pt-9">
        <Select
          ariaLabel={`Status for ${task.title}`}
          size="sm"
          value={task.status}
          options={statusOptions}
          triggerClassName={STATUS_TRIGGER[task.status]}
          onChange={(value) => onUpdate({ status: value as LaunchTaskStatus })}
        />
      </td>
      <td className="px-4 py-3">
        <CommentCell
          task={task}
          names={names}
          currentUserId={currentUserId}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
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
          ? 'bg-[color-mix(in_srgb,var(--color-warning)_14%,var(--color-panel))] text-[color-mix(in_srgb,#8a5a12_62%,var(--color-ink))]'
          : 'bg-[var(--color-wash)] text-[var(--color-wash-strong)]'
      )}
    >
      {LAUNCH_PARTY_LABELS[party]}
    </span>
  )
}

function CommentCell({
  task,
  names,
  currentUserId,
  onAddComment,
  onDeleteComment,
}: {
  task: LaunchTask
  names: Map<string, string>
  currentUserId: string | null
  onAddComment: (body: string) => void
  onDeleteComment: (commentId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const latest = task.comments[task.comments.length - 1]

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="w-full rounded-lg text-left"
      >
        {latest ? (
          <>
            <p className="line-clamp-3 whitespace-pre-wrap text-xs leading-5 text-[var(--color-ink)]">{latest.body}</p>
            <p className="mt-1 text-[11px] text-[var(--color-ink-soft)]">
              {names.get(latest.userId) ?? 'Teammate'}
              {task.comments.length > 1 ? ` · ${task.comments.length} notes` : ''}
            </p>
          </>
        ) : (
          <p className="text-xs text-[var(--color-ink-soft)]">Add a comment</p>
        )}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {task.comments.length > 1 && (
            <ul className="max-h-40 space-y-1.5 overflow-y-auto">
              {task.comments.map((comment) => (
                <li key={comment.id} className="text-xs leading-5 text-[var(--color-ink)]">
                  <span className="font-medium">{names.get(comment.userId) ?? 'Teammate'}: </span>
                  <span className="whitespace-pre-wrap">{comment.body}</span>
                  {comment.userId === currentUserId && (
                    <button
                      type="button"
                      title="Delete comment"
                      onClick={() => {
                        if (window.confirm('Delete this comment?')) onDeleteComment(comment.id)
                      }}
                      className="ml-1 inline-flex align-middle text-[var(--color-ink-soft)] hover:text-[var(--color-danger)]"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {latest && latest.userId === currentUserId && task.comments.length === 1 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete this comment?')) onDeleteComment(latest.id)
              }}
              className="text-[11px] font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-danger)]"
            >
              Delete note
            </button>
          )}
          <form
            className="flex gap-1.5"
            onSubmit={(event) => {
              event.preventDefault()
              if (!draft.trim()) return
              onAddComment(draft)
              setDraft('')
            }}
          >
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Add a comment"
              className="h-9 bg-[var(--color-panel)]"
            />
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              Send
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
