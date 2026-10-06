import { useEffect, useState } from 'react'
import { Download, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Panel } from '@/components/ui/Panel'
import { INTAKE_CARDS, INTAKE_GROUPS, clientIntakePhase, type IntakeSlotState } from '@/lib/clientIntake'
import { supabase, ICC_SCHEMA } from '@/lib/supabase'
import { hasResumeData as resumeDataOn } from '@/lib/pathConfig'
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
  changes: 'Changes requested',
  needed: 'Waiting on the rest',
  review: 'In review',
  accepted: 'Accepted',
  skipped: 'Not needed',
  hidden: '',
} as const

export function ClientDeliverablesPanel({ projectId }: { projectId: string }) {
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
      setNotice('Asked them to send it again')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send that request')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel pad="md" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">From the client</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-ink-soft)]">
            {inReview > 0
              ? `${inReview} ready for you to accept or send back.`
              : 'Accept an item when it looks right. That marks the task complete.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={() => void copyLink()} disabled={busy}>
            <Link2 className="h-4 w-4" />
            {notice ?? 'Copy link'}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => void newLink()} disabled={busy}>
            New link
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      {receivedCards.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-soft)]">Nothing has come in yet.</p>
      ) : (
        <div className="space-y-5">
          {INTAKE_GROUPS.map((group) => {
            const items = receivedCards.filter((item) => item.card.group === group)
            if (items.length === 0) return null
            return (
              <section key={group} className="space-y-3">
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">{group}</h3>
                {items.map(({ card, rows: cardRows, phase, note, taskId }) => (
                  <div key={card.taskKey} className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[var(--color-ink)]">{card.title}</p>
                      <span className="text-xs font-medium text-[var(--color-ink-soft)]">{PHASE_LABEL[phase]}</span>
                    </div>
                    {note && phase === 'changes' && (
                      <p className="text-sm leading-6 text-[var(--color-ink)]">{note}</p>
                    )}
                    {card.kind === 'image' && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        {card.slots.map((slot) => {
                          const row = cardRows.find((item) => item.slotKey === slot.key)
                          if (!row) return null
                          return (
                            <figure key={slot.key} className="space-y-2">
                              {previews[row.id] ? (
                                <img
                                  src={previews[row.id]}
                                  alt={slot.label}
                                  className="w-full rounded-xl bg-[var(--color-field)] object-cover"
                                  style={{ aspectRatio: row.width && row.height ? `${row.width} / ${row.height}` : '16 / 5' }}
                                />
                              ) : (
                                <div className="flex h-16 items-center rounded-xl bg-[var(--color-field)] px-3 text-xs text-[var(--color-ink-soft)]">
                                  {row.fileName}
                                </div>
                              )}
                              <figcaption className="flex items-center justify-between gap-2 text-xs text-[var(--color-ink-soft)]">
                                <span className="truncate">{slot.label}</span>
                                <button type="button" className="inline-flex items-center gap-1 font-medium text-[var(--color-ink)]" onClick={() => void download(row)}>
                                  <Download className="h-3.5 w-3.5" />
                                  Download
                                </button>
                              </figcaption>
                            </figure>
                          )
                        })}
                      </div>
                    )}
                    {card.kind === 'file' && (
                      <ul className="space-y-1.5">
                        {cardRows.map((row) => (
                          <li key={row.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-field)] px-3 py-2">
                            <span className="min-w-0 truncate text-sm text-[var(--color-ink)]">
                              {card.slots.find((slot) => slot.key === row.slotKey)?.label ?? row.fileName ?? 'File'}
                              {card.slots.some((slot) => slot.key === row.slotKey) && row.fileName ? (
                                <span className="text-[var(--color-ink-soft)]"> · {row.fileName}</span>
                              ) : null}
                            </span>
                            <button type="button" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--color-ink)]" onClick={() => void download(row)}>
                              <Download className="h-4 w-4" />
                              Download
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
                      <div className="flex flex-wrap items-center gap-2">
                        {phase === 'review' && (
                          <Button type="button" size="sm" disabled={busy} onClick={() => void accept(card.taskKey, taskId)}>
                            Accept
                          </Button>
                        )}
                        {changeFor === card.taskKey ? (
                          <form
                            className="flex w-full flex-col gap-2"
                            onSubmit={(event) => {
                              event.preventDefault()
                              void sendChange(card.taskKey, taskId)
                            }}
                          >
                            <Textarea
                              value={changeNote}
                              onChange={(event) => setChangeNote(event.target.value)}
                              placeholder="What should they send again?"
                              className="min-h-20"
                            />
                            <div className="flex gap-2">
                              <Button type="submit" size="sm" variant="secondary" disabled={busy || !changeNote.trim()}>
                                Send request
                              </Button>
                              <Button type="button" size="sm" variant="ghost" onClick={() => setChangeFor(null)}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => {
                              setChangeFor(card.taskKey)
                              setChangeNote(note ?? '')
                            }}
                          >
                            Ask for a new submission
                          </Button>
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
