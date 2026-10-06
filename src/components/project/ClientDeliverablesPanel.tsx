import { useEffect, useState } from 'react'
import { Check, Download, ExternalLink, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Panel } from '@/components/ui/Panel'
import { cn } from '@/lib/utils'
import { INTAKE_CARDS, INTAKE_GROUPS, clientIntakePhase, type IntakeSlotState } from '@/lib/clientIntake'
import { supabase, ICC_SCHEMA } from '@/lib/supabase'
import { hasResumeData as resumeDataOn, resolveSecureUploadUrl, cleanSecureUploadUrl, defaultSecureUploadUrl } from '@/lib/pathConfig'
import { useStore } from '@/store/useStore'
import {
  clearIntakeReview,
  clientLinkUrl,
  deliverableDownloadUrl,
  deliverablePreviewUrl,
  ensureClientLink,
  listClientSubmissions,
  listIntakeReviews,
  regenerateClientLink,
  requestIntakeChanges,
  type ClientSubmission,
  type IntakeReview,
} from '@/lib/clientIntakeApi'

const PHASE_LABEL = {
  changes: 'Send back',
  needed: 'Waiting',
  review: 'Review',
  accepted: 'Accepted',
  skipped: 'Skipped',
  hidden: '',
} as const

export function ClientDeliverablesPanel({
  projectId,
  className,
}: {
  projectId: string
  className?: string
}) {
  const project = useStore((state) => state.projects.find((item) => item.id === projectId))
  const updateLaunchTask = useStore((state) => state.updateLaunchTask)
  const [rows, setRows] = useState<ClientSubmission[]>([])
  const [reviews, setReviews] = useState<IntakeReview[]>([])
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [changeFor, setChangeFor] = useState<string | null>(null)
  const [changeNote, setChangeNote] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const [next, notes] = await Promise.all([
      listClientSubmissions(projectId),
      listIntakeReviews(projectId),
    ])
    setRows(next)
    setReviews(notes)
    const images = next.filter((row) => row.storagePath && row.contentType?.startsWith('image/'))
    const urls = await Promise.all(
      images.map(async (row) => [row.id, await deliverablePreviewUrl(row.storagePath!)] as const)
    )
    const ready: Record<string, string> = {}
    for (const [id, url] of urls) {
      if (url) ready[id] = url
    }
    setPreviews(ready)
  }

  useEffect(() => {
    let active = true
    void Promise.all([listClientSubmissions(projectId), listIntakeReviews(projectId)])
      .then(([next, notes]) => {
        if (!active) return
        setRows(next)
        setReviews(notes)
        return Promise.all(
          next
            .filter((row) => row.storagePath && row.contentType?.startsWith('image/'))
            .map(async (row) => [row.id, await deliverablePreviewUrl(row.storagePath!)] as const)
        )
      })
      .then((urls) => {
        if (!active || !urls) return
        const ready: Record<string, string> = {}
        for (const [id, url] of urls) {
          if (url) ready[id] = url
        }
        setPreviews(ready)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load deliverables')
      })

    const channel = supabase
      .channel(`client-submissions-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: ICC_SCHEMA,
          table: 'client_submissions',
          filter: `implementation_id=eq.${projectId}`,
        },
        () => {
          void load().catch(() => undefined)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: ICC_SCHEMA,
          table: 'client_intake_reviews',
          filter: `implementation_id=eq.${projectId}`,
        },
        () => {
          void load().catch(() => undefined)
        }
      )
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [projectId])

  const copyLink = async () => {
    setBusy(true)
    setError(null)
    try {
      const token = await ensureClientLink(projectId)
      await navigator.clipboard.writeText(clientLinkUrl(token))
      setNotice('Link copied')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not copy the link')
    } finally {
      setBusy(false)
    }
  }

  const newLink = async () => {
    if (!window.confirm('Replace the client link? The old one will stop working.')) return
    setBusy(true)
    setError(null)
    try {
      const token = await regenerateClientLink(projectId)
      await navigator.clipboard.writeText(clientLinkUrl(token))
      setNotice('New link copied')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create a new link')
    } finally {
      setBusy(false)
    }
  }

  const download = async (row: ClientSubmission) => {
    if (!row.storagePath) return
    setError(null)
    try {
      const url = await deliverableDownloadUrl(row.storagePath, row.fileName || 'download')
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = row.fileName || 'download'
      anchor.click()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download that file')
    }
  }

  const slotStates: IntakeSlotState[] = rows.map((row) => ({
    taskKey: row.taskKey,
    slotKey: row.slotKey,
    kind: row.kind,
    fileName: row.fileName ?? undefined,
    text: row.body?.text,
  }))
  const flags = {
    ssoEnabled: project?.pathConfig.ssoEnabled !== false,
    imageAssets: project?.pathConfig.imageAssets ?? 'pending',
    hasResumeData: project ? resumeDataOn(project) : false,
    thriveNa: project?.launchTasks?.some((task) => task.key === 'confirm_thrive' && task.status === 'na') ?? false,
  }
  const reviewNotes = new Map(reviews.map((review) => [review.taskKey, review.note]))
  const receivedCards = INTAKE_CARDS.map((card) => {
    const cardRows = rows.filter((row) => row.taskKey === card.taskKey)
    const task = project?.launchTasks?.find((item) => item.key === card.taskKey)
    return {
      card,
      rows: cardRows,
      phase: clientIntakePhase(card, task?.status, slotStates, flags, reviewNotes.get(card.taskKey)),
      note: reviewNotes.get(card.taskKey),
      taskId: task?.id,
    }
  }).filter((item) => item.rows.length > 0)
  const inReview = receivedCards.filter((item) => item.phase === 'review').length

  const accept = async (taskKey: string, taskId: string | undefined) => {
    if (!taskId) return
    setBusy(true)
    setError(null)
    try {
      updateLaunchTask(projectId, taskId, { status: 'complete' })
      await clearIntakeReview(projectId, taskKey)
      setReviews((current) => current.filter((review) => review.taskKey !== taskKey))
      setNotice('Accepted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept that item')
    } finally {
      setBusy(false)
    }
  }

  const sendChange = async (taskKey: string, taskId: string | undefined) => {
    if (!taskId) return
    setBusy(true)
    setError(null)
    try {
      await requestIntakeChanges(projectId, taskKey, changeNote)
      updateLaunchTask(projectId, taskId, { status: 'in_progress' })
      setReviews((current) => [
        ...current.filter((review) => review.taskKey !== taskKey),
        { taskKey, note: changeNote.trim() },
      ])
      setChangeFor(null)
      setChangeNote('')
      setNotice('Sent back')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send that request')
    } finally {
      setBusy(false)
    }
  }

  const summary =
    receivedCards.length === 0
      ? 'Nothing in yet. Send the link when you need logos, files, or logins.'
      : inReview > 0
        ? `${inReview} to review. Accept what looks right, or send it back.`
        : 'Caught up. Accepted items mark the matching task complete.'

  return (
    <Panel pad="sm" className={cn('space-y-4', className)}>
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">From the client</h2>
          <p className="mt-1 text-sm leading-5 text-[var(--color-ink-soft)]">{summary}</p>
        </div>
        <Button type="button" size="sm" className="w-full" onClick={() => void copyLink()} disabled={busy}>
          <Link2 className="h-4 w-4" />
          Copy client link
        </Button>
        {notice && <p className="text-xs font-medium text-[var(--color-ink)]">{notice}</p>}
        <button
          type="button"
          className="text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] disabled:opacity-50"
          onClick={() => void newLink()}
          disabled={busy}
        >
          Replace link
        </button>
      </div>

      <SecureUploadEditor
        projectId={projectId}
        abbreviation={project?.abbreviation ?? ''}
        savedUrl={project?.pathConfig.secureUploadUrl}
      />

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      {receivedCards.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-soft)]">Nothing has come in yet.</p>
      ) : (
        <div className="space-y-4">
          {INTAKE_GROUPS.map((group) => {
            const items = receivedCards.filter((item) => item.card.group === group)
            if (items.length === 0) return null
            return (
              <section key={group} className="space-y-2">
                <h3 className="text-xs font-medium text-[var(--color-ink-soft)]">{group}</h3>
                {items.map(({ card, rows: cardRows, phase, note, taskId }) => (
                  <div key={card.taskKey} className="space-y-2 border-t border-[var(--color-border)] pt-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="min-w-0 text-sm font-medium text-[var(--color-ink)]">{card.title}</p>
                      {PHASE_LABEL[phase] && (
                        <span
                          className={cn(
                            'shrink-0 text-xs font-medium',
                            phase === 'review' ? 'text-[var(--color-wash-strong)]' : 'text-[var(--color-ink-soft)]'
                          )}
                        >
                          {PHASE_LABEL[phase]}
                        </span>
                      )}
                    </div>
                    {note && phase === 'changes' && (
                      <p className="text-sm leading-6 text-[var(--color-ink)]">{note}</p>
                    )}
                    {card.kind === 'image' && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {card.slots.map((slot) => {
                          const row = cardRows.find((item) => item.slotKey === slot.key)
                          if (!row) return null
                          return (
                            <figure key={slot.key} className="w-28 shrink-0 space-y-1">
                              {previews[row.id] ? (
                                <img
                                  src={previews[row.id]}
                                  alt={slot.label}
                                  className="h-16 w-full rounded-lg bg-[var(--color-field)] object-cover"
                                />
                              ) : (
                                <div className="flex h-16 items-center rounded-lg bg-[var(--color-field)] px-2 text-[11px] text-[var(--color-ink-soft)]">
                                  {row.fileName}
                                </div>
                              )}
                              <figcaption className="flex items-center justify-between gap-1 text-[11px] text-[var(--color-ink-soft)]">
                                <span className="truncate">{slot.label}</span>
                                <button
                                  type="button"
                                  className="shrink-0 text-[var(--color-ink)]"
                                  aria-label={`Download ${slot.label}`}
                                  onClick={() => void download(row)}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                              </figcaption>
                            </figure>
                          )
                        })}
                      </div>
                    )}
                    {card.kind === 'external' && (
                      <ul className="space-y-1.5">
                        {card.slots.map((slot) => {
                          const row = cardRows.find((item) => item.slotKey === slot.key)
                          if (!row) return null
                          return (
                            <li key={slot.key} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--color-field)] px-2.5 py-2">
                              <span className="flex min-w-0 items-center gap-2 text-sm text-[var(--color-ink)]">
                                <Check className="h-3.5 w-3.5 shrink-0 text-[var(--color-success)]" />
                                <span className="truncate">{slot.label}</span>
                              </span>
                              {row.storagePath ? (
                                <button
                                  type="button"
                                  className="shrink-0 text-[var(--color-ink)]"
                                  aria-label={`Download ${slot.label}`}
                                  onClick={() => void download(row)}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </button>
                              ) : null}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                    {card.kind === 'file' && (
                      <ul className="space-y-1.5">
                        {cardRows.map((row) => (
                          <li key={row.id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--color-field)] px-2.5 py-2">
                            <span className="min-w-0 truncate text-sm text-[var(--color-ink)]">
                              {card.slots.find((slot) => slot.key === row.slotKey)?.label ?? row.fileName ?? 'File'}
                            </span>
                            <button
                              type="button"
                              className="shrink-0 text-[var(--color-ink)]"
                              aria-label={`Download ${row.fileName || 'file'}`}
                              onClick={() => void download(row)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {card.kind === 'credentials' && (
                      <ul className="space-y-2">
                        {card.slots.map((slot) => {
                          const row = cardRows.find((item) => item.slotKey === slot.key)
                          if (!row?.body) return null
                          const open = revealed[row.id]
                          return (
                            <li key={slot.key} className="rounded-xl bg-[var(--color-field)] px-3 py-2.5">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-[var(--color-ink)]">{slot.label}</p>
                                <button
                                  type="button"
                                  className="text-xs font-medium text-[var(--color-ink-soft)]"
                                  onClick={() => setRevealed((current) => ({ ...current, [row.id]: !open }))}
                                >
                                  {open ? 'Hide' : 'Reveal'}
                                </button>
                              </div>
                              <p className="mt-1 text-sm text-[var(--color-ink)]">{row.body.username}</p>
                              <p className="text-sm text-[var(--color-ink-soft)]">{open ? row.body.password : '••••••••'}</p>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                    {card.kind === 'text' &&
                      cardRows.map((row) => (
                        <p key={row.id} className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-ink)]">
                          {row.body?.text}
                        </p>
                      ))}
                    {phase !== 'accepted' && phase !== 'skipped' && (
                      <div className="space-y-2">
                        {changeFor === card.taskKey ? (
                          <form
                            className="space-y-2"
                            onSubmit={(event) => {
                              event.preventDefault()
                              void sendChange(card.taskKey, taskId)
                            }}
                          >
                            <Textarea
                              value={changeNote}
                              onChange={(event) => setChangeNote(event.target.value)}
                              placeholder="What needs to change?"
                              className="min-h-16 text-sm"
                            />
                            <div className="flex gap-2">
                              <Button type="submit" size="sm" className="flex-1" disabled={busy || !changeNote.trim()}>
                                Send
                              </Button>
                              <Button type="button" size="sm" variant="ghost" onClick={() => setChangeFor(null)}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex gap-2">
                            {phase === 'review' && (
                              <Button type="button" size="sm" className="flex-1" disabled={busy} onClick={() => void accept(card.taskKey, taskId)}>
                                Accept
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className="flex-1"
                              disabled={busy}
                              onClick={() => {
                                setChangeFor(card.taskKey)
                                setChangeNote(note ?? '')
                              }}
                            >
                              Send back
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </section>
            )
          })}
        </div>
      )}
    </Panel>
  )
}

function SecureUploadEditor({
  projectId,
  abbreviation,
  savedUrl,
}: {
  projectId: string
  abbreviation: string
  savedUrl?: string
}) {
  const updatePathConfig = useStore((state) => state.updatePathConfig)
  const fallback = defaultSecureUploadUrl(abbreviation)
  const current = resolveSecureUploadUrl(abbreviation, savedUrl)
  const custom = Boolean(cleanSecureUploadUrl(savedUrl))
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(current)
  const [localError, setLocalError] = useState<string | null>(null)

  const save = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || trimmed === fallback) {
      updatePathConfig(projectId, { secureUploadUrl: undefined })
      setEditing(false)
      setLocalError(null)
      return
    }
    const cleaned = cleanSecureUploadUrl(trimmed)
    if (!cleaned) {
      setLocalError('Use a full https address.')
      return
    }
    updatePathConfig(projectId, { secureUploadUrl: cleaned === fallback ? undefined : cleaned })
    setEditing(false)
    setLocalError(null)
  }

  return (
    <div className="rounded-xl bg-[var(--color-field)] px-3 py-3">
      <p className="text-sm font-medium text-[var(--color-ink)]">ACH and W-9</p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-ink-soft)]">
        Those two go to the file manager. Everything else comes in above.
      </p>
      {editing ? (
        <form
          className="mt-3 space-y-2"
          onSubmit={(event) => {
            event.preventDefault()
            save(draft)
          }}
        >
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={fallback || 'https://association.webscribble.com/smartway/file-manager'}
            aria-label="File manager address"
            className="text-sm"
          />
          {localError && <p className="text-sm text-[var(--color-danger)]">{localError}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm">Save address</Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft(current)
                setLocalError(null)
                setEditing(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-2 space-y-2">
          {current ? (
            <a
              href={current}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-start gap-1.5 text-sm font-medium text-[var(--color-wash-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="break-all">{current.replace(/^https?:\/\//, '')}</span>
            </a>
          ) : (
            <p className="text-sm text-[var(--color-ink-soft)]">Add an abbreviation, or set the address.</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <button
              type="button"
              className="text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
              onClick={() => {
                setDraft(current)
                setLocalError(null)
                setEditing(true)
              }}
            >
              Change address
            </button>
            {custom && (
              <button
                type="button"
                className="text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                onClick={() => save('')}
              >
                Use default
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
