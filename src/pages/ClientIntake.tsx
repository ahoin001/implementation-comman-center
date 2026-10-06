import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, ExternalLink, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Panel } from '@/components/ui/Panel'
import {
  INTAKE_CARDS,
  clientIntakePhase,
  namedSlot,
  newFileSlotKey,
  readImageSize,
  slotsFor,
  type ClientIntakePhase,
  type IntakeCardDef,
  type IntakeGuide,
  type IntakeSlotDef,
  type IntakeSlotState,
} from '@/lib/clientIntake'
import {
  clearSecureUpload,
  confirmSecureUpload,
  reopenIntake,
  resolveIntake,
  saveIntakeCredentials,
  saveIntakeText,
  uploadIntakeFile,
  type IntakeView,
} from '@/lib/clientIntakeApi'
import { resolveSecureUploadUrl, sitePreviewUrl } from '@/lib/pathConfig'

export function ClientIntakePage() {
  const { token = '' } = useParams()
  const [view, setView] = useState<IntakeView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savedKey, setSavedKey] = useState<string | null>(null)

  const load = async () => {
    const next = await resolveIntake(token)
    setView(next)
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    resolveIntake(token)
      .then((next) => {
        if (active) setView(next)
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'This link is no longer active')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [token])

  const markSaved = (key: string) => {
    setSavedKey(key)
    window.setTimeout(() => setSavedKey((current) => (current === key ? null : current)), 2200)
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-sm text-[var(--color-ink-soft)]">Opening your checklist…</p>
      </main>
    )
  }

  if (error || !view) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <Panel pad="md">
          <h1 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">Link unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-ink-soft)]">
            {error ?? 'This link is no longer active.'} Ask your Web Scribble contact for a new one.
          </p>
        </Panel>
      </main>
    )
  }

  const notes = new Map((view.reviews ?? []).map((review) => [review.taskKey, review.note]))
  const phased = INTAKE_CARDS.map((card) => ({
    card,
    phase: clientIntakePhase(card, view.tasks[card.taskKey], view.slots, view.flags, notes.get(card.taskKey)),
    note: notes.get(card.taskKey),
  })).filter((item) => item.phase !== 'hidden')
  const waiting = phased.filter((item) => item.phase === 'changes' || item.phase === 'needed' || item.phase === 'review')
  const sections: { phase: ClientIntakePhase; title: string }[] = [
    { phase: 'changes', title: 'Please send again' },
    { phase: 'needed', title: 'Still needed' },
    { phase: 'review', title: 'In review' },
    { phase: 'accepted', title: 'Accepted' },
    { phase: 'skipped', title: 'Not needed' },
  ]

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <p className="text-sm font-medium text-[var(--color-wash-strong)]">Web Scribble</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
        {view.projectName}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--color-ink-soft)]">
        Send what you have, then come back to this link. Each item shows whether it is still needed, in review, accepted, or needs to be sent again.
      </p>

      {waiting.length === 0 && (
        <Panel pad="md" className="mt-8">
          <p className="text-sm font-medium text-[var(--color-ink)]">You're all set.</p>
          <p className="mt-1 text-sm leading-6 text-[var(--color-ink-soft)]">Nothing is waiting on you right now.</p>
        </Panel>
      )}

      <div className="mt-8 space-y-8">
        {sections.map((section) => {
          const items = phased.filter((item) => item.phase === section.phase)
          if (items.length === 0) return null
          return (
            <section key={section.phase} className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--color-ink)]">{section.title}</h2>
              {items.map(({ card, phase, note }) => (
                <IntakeCard
                  key={card.taskKey}
                  token={token}
                  card={card}
                  phase={phase}
                  note={note}
                  abbreviation={view.abbreviation}
                  uploadUrl={resolveSecureUploadUrl(view.abbreviation, view.secureUploadUrl)}
                  received={slotsFor(card, view.slots)}
                  savedKey={savedKey}
                  onSaved={async (key) => {
                    await load()
                    markSaved(key)
                  }}
                />
              ))}
            </section>
          )
        })}
      </div>
    </main>
  )
}

function IntakeCard({
  token,
  card,
  phase,
  note,
  abbreviation,
  uploadUrl,
  received,
  savedKey,
  onSaved,
}: {
  token: string
  card: IntakeCardDef
  phase: ClientIntakePhase
  note?: string
  abbreviation: string
  uploadUrl?: string
  received: IntakeSlotState[]
  savedKey: string | null
  onSaved: (key: string) => Promise<void>
}) {
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [reopening, setReopening] = useState(false)
  const files = card.multiFile ? received : []
  const submitted = phase === 'review' || phase === 'accepted'
  const locked = !editing && (submitted || phase === 'skipped')

  const handleSaved = async (key: string) => {
    setEditing(false)
    await onSaved(key)
  }

  const enableEdits = () => {
    setReopening(true)
    setError(null)
    const ready = phase === 'accepted' ? reopenIntake(token, card.taskKey) : Promise.resolve()
    void ready
      .then(() => (phase === 'accepted' ? onSaved(`${card.taskKey}:reopen`) : undefined))
      .then(() => setEditing(true))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not open this item'))
      .finally(() => setReopening(false))
  }

  if (phase === 'skipped') {
    return (
      <Panel pad="md">
        <h3 className="text-base font-semibold tracking-tight text-[var(--color-ink)]">{card.title}</h3>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">Not needed for this launch.</p>
      </Panel>
    )
  }

  return (
    <Panel pad="md" className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-semibold tracking-tight text-[var(--color-ink)]">
            {submitted && !editing && <Check className="h-4 w-4 shrink-0 text-[var(--color-success)]" />}
            {card.title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-[var(--color-ink-soft)]">{card.detail}</p>
          {phase === 'accepted' && !editing && (
            <p className="mt-2 text-sm font-medium text-[var(--color-success)]">Accepted. Submitted already.</p>
          )}
          {phase === 'review' && !editing && (
            <p className="mt-2 text-sm font-medium text-[var(--color-wash-strong)]">
              Submitted. In review. We'll accept it here, or ask you to send it again.
            </p>
          )}
          {phase === 'changes' && note && (
            <p className="mt-2 rounded-xl bg-[color-mix(in_srgb,var(--color-warning)_14%,var(--color-panel))] px-3 py-2 text-sm leading-6 text-[var(--color-ink)]">
              {note}
            </p>
          )}
        </div>
        {submitted && !editing && (
          <Button type="button" variant="ghost" size="sm" disabled={reopening} onClick={enableEdits}>
            {reopening ? 'Opening…' : 'Make changes'}
          </Button>
        )}
      </div>

      {card.guide && <CardGuide guide={card.guide} />}

      {card.kind === 'credentials' &&
        card.slots.map((slot) => (
          <CredentialSlot
            key={slot.key}
            token={token}
            card={card}
            slot={slot}
            received={Boolean(namedSlot(received, card.taskKey, slot.key))}
            locked={locked}
            saved={savedKey === `${card.taskKey}:${slot.key}`}
            onError={setError}
            onSaved={handleSaved}
          />
        ))}

      {card.kind === 'text' &&
        card.slots.map((slot) => (
          <TextSlot
            key={slot.key}
            token={token}
            card={card}
            slot={slot}
            existing={namedSlot(received, card.taskKey, slot.key)?.text ?? ''}
            locked={locked}
            saved={savedKey === `${card.taskKey}:${slot.key}`}
            onError={setError}
            onSaved={handleSaved}
          />
        ))}

      {card.kind === 'image' &&
        card.slots.map((slot) => (
          <FileSlot
            key={slot.key}
            token={token}
            card={card}
            slot={slot}
            previewHref={slot.previewPath ? sitePreviewUrl(abbreviation, slot.previewPath) : undefined}
            received={namedSlot(received, card.taskKey, slot.key)}
            locked={locked}
            saved={savedKey === `${card.taskKey}:${slot.key}`}
            onError={setError}
            onSaved={handleSaved}
          />
        ))}

      {card.kind === 'external' && (
        <ExternalMarks
          token={token}
          card={card}
          uploadUrl={uploadUrl}
          received={received}
          locked={locked}
          changes={phase === 'changes'}
          savedKey={savedKey}
          onError={setError}
          onSaved={handleSaved}
        />
      )}

      {card.kind === 'file' && !card.multiFile &&
        card.slots.map((slot) => (
          <FileSlot
            key={slot.key}
            token={token}
            card={card}
            slot={slot}
            received={namedSlot(received, card.taskKey, slot.key)}
            locked={locked}
            saved={savedKey === `${card.taskKey}:${slot.key}`}
            onError={setError}
            onSaved={handleSaved}
          />
        ))}

      {card.multiFile && (
        <div className="space-y-2">
          {files.length > 0 && (
            <ul className="space-y-1.5">
              {files.map((file) => (
                <li key={file.slotKey} className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                  <Check className="h-4 w-4 text-[var(--color-success)]" />
                  <span className="truncate">{file.fileName || 'File received'}</span>
                </li>
              ))}
            </ul>
          )}
          {!locked && (
            <FileSlot
              token={token}
              card={card}
              slot={{ key: 'next', label: files.length > 0 ? 'Add another file' : 'Add a file' }}
              saved={savedKey?.startsWith(`${card.taskKey}:file-`) ?? false}
              onError={setError}
              onSaved={handleSaved}
            />
          )}
        </div>
      )}

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
    </Panel>
  )
}

function CardGuide({ guide }: { guide: IntakeGuide }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      <p className="text-sm leading-6 text-[var(--color-ink)]">{guide.caption}</p>
      {guide.image ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
            {guide.label}
          </Button>
          <a
            href={guide.href}
            download
            className="inline-flex h-8 items-center rounded-lg px-2.5 text-sm font-medium text-[var(--color-wash-strong)] hover:bg-[var(--color-wash)]"
          >
            Download
          </a>
          <Modal open={open} onClose={() => setOpen(false)} className="max-w-5xl">
            <img src={guide.href} alt="Columns to include in each import file" className="w-full rounded-xl" />
          </Modal>
        </div>
      ) : (
        <a
          href={guide.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-wash-strong)] hover:underline"
        >
          {guide.label}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  )
}

function ExternalMarks({
  token,
  card,
  uploadUrl,
  received,
  locked,
  changes,
  savedKey,
  onError,
  onSaved,
}: {
  token: string
  card: IntakeCardDef
  uploadUrl?: string
  received: IntakeSlotState[]
  locked: boolean
  changes: boolean
  savedKey: string | null
  onError: (message: string | null) => void
  onSaved: (key: string) => Promise<void>
}) {
  return (
    <div className="space-y-3">
      {uploadUrl ? (
        <a
          href={uploadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--color-wash-strong)] px-4 text-sm font-medium text-white shadow-[0_8px_16px_-8px_color-mix(in_srgb,var(--color-wash-strong)_80%,transparent)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
        >
          <ExternalLink className="h-4 w-4" />
          Open file manager
        </a>
      ) : (
        <p className="text-sm leading-6 text-[var(--color-ink-soft)]">
          The file manager link is not ready yet. Ask your Web Scribble contact.
        </p>
      )}
      <ul className="space-y-2">
        {card.slots.map((slot) => (
          <ExternalMark
            key={slot.key}
            token={token}
            card={card}
            slot={slot}
            uploadUrl={uploadUrl}
            marked={Boolean(namedSlot(received, card.taskKey, slot.key))}
            locked={locked}
            changes={changes}
            saved={savedKey === `${card.taskKey}:${slot.key}`}
            onError={onError}
            onSaved={onSaved}
          />
        ))}
      </ul>
    </div>
  )
}

function ExternalMark({
  token,
  card,
  slot,
  uploadUrl,
  marked,
  locked,
  changes,
  saved,
  onError,
  onSaved,
}: {
  token: string
  card: IntakeCardDef
  slot: IntakeSlotDef
  uploadUrl?: string
  marked: boolean
  locked: boolean
  changes: boolean
  saved: boolean
  onError: (message: string | null) => void
  onSaved: (key: string) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)

  const run = (action: 'confirm' | 'clear') => {
    setBusy(true)
    onError(null)
    const request = action === 'confirm'
      ? confirmSecureUpload(token, card.taskKey, slot.key)
      : clearSecureUpload(token, card.taskKey, slot.key)
    void request
      .then(() => onSaved(`${card.taskKey}:${slot.key}`))
      .catch((err: unknown) => onError(err instanceof Error ? err.message : 'Could not update that mark'))
      .finally(() => setBusy(false))
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-field)] px-3 py-2.5">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink)]">
          {marked && <Check className="h-4 w-4 shrink-0 text-[var(--color-success)]" />}
          {slot.label}
        </p>
        <p className="text-xs text-[var(--color-ink-soft)]">
          {saved ? 'Saved' : marked ? 'Marked as uploaded' : 'After it is in the file manager'}
        </p>
      </div>
      {marked && locked ? null : marked && !changes ? (
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => run('clear')}>
          {busy ? 'Saving…' : 'Undo'}
        </Button>
      ) : (
        <Button type="button" size="sm" disabled={busy || !uploadUrl} onClick={() => run('confirm')}>
          {busy ? 'Saving…' : marked ? "I've uploaded the new file" : "I've uploaded this"}
        </Button>
      )}
    </li>
  )
}

function PreviewLink({ href }: { href?: string }) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 block truncate text-xs font-medium text-[var(--color-wash-strong)] hover:underline"
    >
      {href}
    </a>
  )
}

function FileSlot({
  token,
  card,
  slot,
  slotKey,
  previewHref,
  received,
  locked,
  saved,
  onError,
  onSaved,
}: {
  token: string
  card: IntakeCardDef
  slot: IntakeSlotDef
  slotKey?: string
  previewHref?: string
  received?: IntakeSlotState
  locked?: boolean
  saved: boolean
  onError: (message: string | null) => void
  onSaved: (key: string) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const inputId = `${card.taskKey}-${slot.key}`
  const showPicker = !locked && (!received || replacing)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    onError(null)
    try {
      let size: { width: number; height: number } | undefined
      if (slot.accept) {
        const allowed = /\.(png|jpe?g|eps)$/i.test(file.name)
        if (!allowed) throw new Error('Use a PNG, JPG, or EPS.')
      } else if (card.kind === 'image' && slot.width && slot.height) {
        if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
          throw new Error('Use a PNG or JPG.')
        }
        size = await readImageSize(file)
        if (size.width !== slot.width || size.height !== slot.height) {
          throw new Error(
            `${file.name} is ${size.width}×${size.height}. This one needs ${slot.width}×${slot.height}.`
          )
        }
      }
      const uploadKey = slotKey ?? (card.multiFile ? newFileSlotKey() : slot.key)
      await uploadIntakeFile(token, card.taskKey, uploadKey, file, size)
      setReplacing(false)
      await onSaved(`${card.taskKey}:${uploadKey}`)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not upload that file')
    } finally {
      setBusy(false)
    }
  }

  if (!showPicker) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-field)] px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-ink)]">{slot.label}</p>
          <p className="truncate text-xs text-[var(--color-ink-soft)]">
            {saved ? 'Saved' : 'Received'}
            {received?.fileName ? ` · ${received.fileName}` : ''}
          </p>
          <PreviewLink href={previewHref} />
        </div>
        {!locked && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setReplacing(true)}>
            Replace
          </Button>
        )}
      </div>
    )
  }

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
        {slot.label}
        {slot.hint ? <span className="ml-2 font-normal text-[var(--color-ink-soft)]">{slot.hint}</span> : null}
      </label>
      <PreviewLink href={previewHref} />
      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[color-mix(in_srgb,var(--color-ink)_16%,transparent)] bg-[var(--color-field)] px-3 py-4 text-sm text-[var(--color-ink-soft)] hover:bg-[var(--color-wash)]"
      >
        <Upload className="h-4 w-4" />
        {busy ? 'Sending…' : 'Choose a file'}
      </label>
      <input
        id={inputId}
        type="file"
        accept={slot.accept ?? (card.kind === 'image' && slot.width ? 'image/png,image/jpeg' : undefined)}
        className="sr-only"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          void onFile(file)
        }}
      />
      {saved && <p className="mt-1.5 text-xs text-[var(--color-ink-soft)]">Saved</p>}
    </div>
  )
}

function CredentialSlot({
  token,
  card,
  slot,
  received,
  locked,
  saved,
  onError,
  onSaved,
}: {
  token: string
  card: IntakeCardDef
  slot: IntakeSlotDef
  received: boolean
  locked?: boolean
  saved: boolean
  onError: (message: string | null) => void
  onSaved: (key: string) => Promise<void>
}) {
  const [open, setOpen] = useState(!received && !locked)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-field)] px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-[var(--color-ink)]">{slot.label}</p>
          <p className="text-xs text-[var(--color-ink-soft)]">{saved ? 'Saved' : 'Received'}</p>
        </div>
        {!locked && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
            Replace
          </Button>
        )}
      </div>
    )
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault()
        setBusy(true)
        onError(null)
        void saveIntakeCredentials(token, card.taskKey, slot.key, username, password)
          .then(() => onSaved(`${card.taskKey}:${slot.key}`))
          .then(() => {
            setUsername('')
            setPassword('')
            setOpen(false)
          })
          .catch((err: unknown) => onError(err instanceof Error ? err.message : 'Could not save that login'))
          .finally(() => setBusy(false))
      }}
    >
      <p className="text-sm font-medium text-[var(--color-ink)]">{slot.label}</p>
      <Input
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        placeholder="Username"
        autoComplete="off"
        aria-label={`${slot.label} username`}
      />
      <Input
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        type="password"
        autoComplete="new-password"
        aria-label={`${slot.label} password`}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy || !username.trim() || !password.trim()}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
        {received && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

function TextSlot({
  token,
  card,
  slot,
  existing,
  locked,
  saved,
  onError,
  onSaved,
}: {
  token: string
  card: IntakeCardDef
  slot: IntakeSlotDef
  existing: string
  locked?: boolean
  saved: boolean
  onError: (message: string | null) => void
  onSaved: (key: string) => Promise<void>
}) {
  const [draft, setDraft] = useState(existing)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setDraft(existing)
  }, [existing])

  if (locked) {
    return <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-ink)]">{existing}</p>
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault()
        setBusy(true)
        onError(null)
        void saveIntakeText(token, card.taskKey, slot.key, draft)
          .then(() => onSaved(`${card.taskKey}:${slot.key}`))
          .catch((err: unknown) => onError(err instanceof Error ? err.message : 'Could not save that note'))
          .finally(() => setBusy(false))
      }}
    >
      <label htmlFor={`${card.taskKey}-${slot.key}`} className="block text-sm font-medium text-[var(--color-ink)]">
        {slot.label}
      </label>
      <Textarea
        id={`${card.taskKey}-${slot.key}`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        className="min-h-28"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={busy || !draft.trim()}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
        {saved && <span className="text-xs text-[var(--color-ink-soft)]">Saved</span>}
      </div>
    </form>
  )
}
