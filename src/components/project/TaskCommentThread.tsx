import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronDown, MessageSquare, Pencil, Trash2, X } from 'lucide-react'
import type { TaskComment } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'
import { runSharedElementTransition } from '@/lib/viewTransition'

const spring = { type: 'spring' as const, bounce: 0, duration: 0.35 }
const ease = [0.2, 0.8, 0.2, 1] as const

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function TaskCommentThread({
  comments,
  names,
  currentUserId,
  onAdd,
  onUpdate,
  onDelete,
  collapsible = true,
  label = 'Comments',
}: {
  comments: TaskComment[]
  names: Map<string, string>
  currentUserId: string | null
  onAdd: (body: string) => void
  onUpdate: (commentId: string, body: string) => void
  onDelete: (commentId: string) => void
  collapsible?: boolean
  label?: string
}) {
  const [open, setOpen] = useState(!collapsible)
  const [vt, setVt] = useState(false)
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const composerRef = useRef<HTMLInputElement>(null)
  const reduce = useReducedMotion()
  const latest = comments[comments.length - 1]
  const latestName = latest ? names.get(latest.userId) ?? 'Teammate' : ''
  const empty = comments.length === 0

  useEffect(() => {
    if (open && collapsible && empty) composerRef.current?.focus()
  }, [open, collapsible, empty])

  const submit = () => {
    if (!draft.trim()) return
    onAdd(draft)
    setDraft('')
  }

  const toggle = () => {
    if (!collapsible) return
    if (editingId) return
    runSharedElementTransition(
      () => setVt(true),
      () => setOpen((value) => !value),
      () => setVt(false),
      reduce
    )
  }

  const thread = (
    <div className="plan-comment-thread">
      {!collapsible && (
        <p className="text-[11px] font-semibold tracking-[-0.01em] text-[var(--ink-2)]">{label}</p>
      )}
      {comments.length === 0 && !collapsible && (
        <p className="text-xs text-[var(--ink-3)]">No comments yet. Leave a note for the next person.</p>
      )}
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {comments.map((comment) => {
            const name = names.get(comment.userId) ?? 'Teammate'
            const mine = comment.userId === currentUserId
            return (
              <motion.li
                key={comment.id}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, transform: 'translateY(8px)' }}
                animate={{ opacity: 1, transform: 'none' }}
                exit={reduce ? undefined : { opacity: 0, transform: 'translateY(-6px)' }}
                transition={{ duration: 0.2, ease }}
                className={cn('flex', mine ? 'justify-end' : 'justify-start')}
              >
                <CommentCard
                  comment={comment}
                  name={name}
                  mine={Boolean(mine)}
                  editing={editingId === comment.id}
                  confirming={confirmId === comment.id}
                  onEdit={() => {
                    setConfirmId(null)
                    setEditingId(comment.id)
                  }}
                  onCancelEdit={() => setEditingId(null)}
                  onSave={(body) => {
                    onUpdate(comment.id, body)
                    setEditingId(null)
                  }}
                  onAskDelete={() => {
                    setEditingId(null)
                    setConfirmId(comment.id)
                  }}
                  onCancelDelete={() => setConfirmId(null)}
                  onDelete={() => {
                    onDelete(comment.id)
                    setConfirmId(null)
                  }}
                />
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
      <form
        className="plan-comment-composer"
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Input
          ref={composerRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault()
              submit()
            }
          }}
          placeholder="Write a note…"
          aria-label="Write a comment"
        />
        <Button type="submit" size="sm" disabled={!draft.trim()}>
          Send
        </Button>
      </form>
    </div>
  )

  return (
    <motion.div
      layout={!reduce}
      transition={spring}
      className={cn('plan-comments min-w-0', vt && 'vt-comment')}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !collapsible || !open || editingId || confirmId) return
        if (draft.trim()) return
        event.stopPropagation()
        toggle()
      }}
    >
      {collapsible && (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className={cn(
            'plan-comment-preview press',
            empty && 'is-empty',
            open && 'is-open'
          )}
        >
          {latest ? (
            <>
              <Avatar name={latestName} size="xs" />
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 whitespace-pre-wrap text-left text-[13px] leading-5 text-[var(--ink)]">
                  {latest.body}
                </span>
                <span className="mt-0.5 block text-left text-[11px] text-[var(--ink-3)]">
                  {latestName}
                  {comments.length > 1 ? ` · ${comments.length}` : ''}
                </span>
              </span>
              <span className="plan-comment-count">
                <MessageSquare className="h-3 w-3" />
                {comments.length}
              </span>
              <ChevronDown className="plan-comment-chevron" aria-hidden />
            </>
          ) : (
            <>
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[13px]">Add a note…</span>
              <ChevronDown className="plan-comment-chevron ml-auto" aria-hidden />
            </>
          )}
        </button>
      )}

      {collapsible ? (
        <div className={cn('plan-comment-drawer', open && 'is-open')}>
          <div>{thread}</div>
        </div>
      ) : (
        thread
      )}
    </motion.div>
  )
}

function CommentCard({
  comment,
  name,
  mine,
  editing,
  confirming,
  onEdit,
  onCancelEdit,
  onSave,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  comment: TaskComment
  name: string
  mine: boolean
  editing: boolean
  confirming: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (body: string) => void
  onAskDelete: () => void
  onCancelDelete: () => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState(comment.body)

  useEffect(() => {
    if (editing) setDraft(comment.body)
  }, [editing, comment.body])

  return (
    <div className={cn('plan-comment-card', mine && 'is-mine')}>
      <p className="flex items-center gap-1.5 text-[11px] text-[var(--ink-3)]">
        <Avatar name={name} size="xs" />
        <span className="font-semibold text-[var(--ink)]">{name}</span>
        <span aria-hidden>·</span>
        <span>{formatWhen(comment.createdAt)}</span>
      </p>
      {editing ? (
        <form
          className="mt-2 space-y-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!draft.trim()) return
            onSave(draft)
          }}
        >
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation()
                onCancelEdit()
              }
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                if (draft.trim()) onSave(draft)
              }
            }}
            className="min-h-[72px] bg-[var(--surface)]"
            aria-label="Edit comment"
            autoFocus
          />
          <div className="flex justify-end gap-1.5">
            <Button type="button" size="sm" variant="ghost" onClick={onCancelEdit}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              Save
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-5 text-[var(--ink)]">{comment.body}</p>
      )}
      {mine && !editing && (
        <div className="mt-1.5 flex items-center gap-1">
          {confirming ? (
            <>
              <button type="button" className="plan-comment-action is-danger" onClick={onDelete}>
                <Check className="h-3 w-3" />
                Delete
              </button>
              <button type="button" className="plan-comment-action" onClick={onCancelDelete}>
                <X className="h-3 w-3" />
                Keep
              </button>
            </>
          ) : (
            <>
              <button type="button" className="plan-comment-action" onClick={onEdit}>
                <Pencil className="h-3 w-3" />
                Edit
              </button>
              <button type="button" className="plan-comment-action" onClick={onAskDelete}>
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
