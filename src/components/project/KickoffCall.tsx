import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import type { Project } from '@/types'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Input, Textarea } from '@/components/ui/Input'
import {
  KICKOFF,
  isPromptVisible,
  kickoffProgress,
  kickoffValue,
  normalizeKickoff,
  skippedKickoff,
  visibleSteps,
  type KickoffPrompt,
  type KickoffRecord,
} from '@/lib/kickoffScript'
import { cn } from '@/lib/utils'

const ease = [0.2, 0.8, 0.2, 1] as const

export function KickoffCall({
  project,
  stepId,
  onStep,
  onClose,
  onAnswer,
  onKickoff,
}: {
  project: Project
  stepId: string
  onStep: (stepId: string) => void
  onClose: () => void
  onAnswer: (promptId: string, value: string) => void
  onKickoff: (updater: (current: KickoffRecord) => KickoffRecord) => void
}) {
  const reduce = useReducedMotion()
  const record = normalizeKickoff(project.kickoff)
  const places = visibleSteps(record)
  const index = Math.max(0, places.findIndex((place) => place.step.id === stepId))
  const place = places[index]
  const progress = kickoffProgress(project)
  const skipped = skippedKickoff(record)
  const [showSkipped, setShowSkipped] = useState(false)

  useEffect(() => {
    if (!place || place.step.id === stepId) return
    onStep(place.step.id)
  }, [place, stepId, onStep])

  const toggleId = (key: 'hiddenChapters' | 'hiddenSteps' | 'hiddenPrompts', id: string) => {
    onKickoff((current) => {
      const has = current[key].includes(id)
      return {
        ...current,
        [key]: has ? current[key].filter((item) => item !== id) : [...current[key], id],
      }
    })
  }

  return (
    <section className="kickoff float-panel" aria-label="Kickoff call">
      <header className="kickoff-top">
        <button type="button" className="kickoff-back press" onClick={onClose}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Board
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm text-[var(--ink-3)]">
            {project.abbreviation ? `(${project.abbreviation}) ` : ''}
            {project.name}
          </p>
          <h1 className="kickoff-title">{place?.step.title ?? 'Kickoff'}</h1>
        </div>
        <p className="kickoff-progress">
          <span>{progress.answered}</span>
          <span> of {progress.total}</span>
        </p>
      </header>

      <div className="kickoff-body">
        <nav className="kickoff-rail" aria-label="Agenda">
          {KICKOFF.map((chapter) => {
            if (record.hiddenChapters.includes(chapter.id)) return null
            const multi = chapter.steps.length > 1
            return (
              <div key={chapter.id} className="kickoff-group">
                {multi && (
                  <div className="kickoff-chapter">
                    <span>{chapter.title}</span>
                    <button type="button" className="kickoff-skip" aria-label={`Skip ${chapter.title}`} onClick={() => toggleId('hiddenChapters', chapter.id)}>
                      Skip
                    </button>
                  </div>
                )}
                {chapter.steps.map((step) => {
                  if (record.hiddenSteps.includes(step.id)) return null
                  const current = step.id === place?.step.id
                  const prompts = step.prompts.filter((prompt) => isPromptVisible(record, prompt))
                  const done = prompts.length > 0 && prompts.every((prompt) => kickoffValue(project, prompt).trim())
                  return (
                    <div key={step.id} className={cn('kickoff-step', current && 'is-current', multi && 'is-nested')}>
                      <button
                        type="button"
                        className="kickoff-step-go"
                        aria-current={current ? 'step' : undefined}
                        onClick={() => onStep(step.id)}
                      >
                        <span className={cn('kickoff-mark', done && 'is-done', current && 'is-now')} aria-hidden>
                          {done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                        </span>
                        <span>{multi ? step.title : chapter.title}</span>
                      </button>
                      <button
                        type="button"
                        className="kickoff-skip"
                        aria-label={`Skip ${multi ? step.title : chapter.title}`}
                        onClick={() =>
                          toggleId(chapter.steps.length === 1 ? 'hiddenChapters' : 'hiddenSteps', chapter.steps.length === 1 ? chapter.id : step.id)
                        }
                      >
                        Skip
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })}

          {skipped.length > 0 && (
            <div className="kickoff-skipped">
              <button
                type="button"
                className="kickoff-skip"
                aria-expanded={showSkipped}
                onClick={() => setShowSkipped((open) => !open)}
              >
                Not asking · {skipped.length}
              </button>
              {showSkipped && (
                <ul className="kickoff-restore">
                  {skipped.map((item) => (
                    <li key={`${item.kind}-${item.id}`}>
                      <span>{item.label}</span>
                      <button
                        type="button"
                        className="kickoff-skip"
                        onClick={() =>
                          toggleId(
                            item.kind === 'chapter' ? 'hiddenChapters' : item.kind === 'step' ? 'hiddenSteps' : 'hiddenPrompts',
                            item.id
                          )
                        }
                      >
                        Ask again
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </nav>

        <div className="kickoff-stage">
          <AnimatePresence mode="wait" initial={false}>
            {place && (
              <motion.div
                key={place.step.id}
                initial={reduce ? false : { opacity: 0, filter: 'blur(6px)', transform: 'translateY(8px)' }}
                animate={{ opacity: 1, filter: 'none', transform: 'none' }}
                exit={reduce ? undefined : { opacity: 0, transform: 'translateY(-4px)' }}
                transition={{ duration: 0.28, ease }}
                className="kickoff-sheet"
              >
                {place.step.blocks.map((block, blockIndex) => (
                  <div key={blockIndex} className={cn('kickoff-lead', block.cue && !block.read && 'is-cue')}>
                    {block.read && <p className="kickoff-read">{block.read}</p>}
                    {block.cue && <p className="kickoff-cue">{block.cue}</p>}
                  </div>
                ))}

                {place.step.prompts.map((prompt) => (
                  <PromptRow
                    key={prompt.id}
                    prompt={prompt}
                    open={isPromptVisible(record, prompt)}
                    showCue={!prompt.cueWhen || prompt.cueWhen.is.includes(record.answers[prompt.cueWhen.prompt] ?? '')}
                    value={kickoffValue(project, prompt)}
                    onAnswer={onAnswer}
                    onSkip={() => toggleId('hiddenPrompts', prompt.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <footer className="kickoff-foot">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={index <= 0}
          onClick={() => places[index - 1] && onStep(places[index - 1].step.id)}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {places[index - 1]?.step.title ?? 'Previous'}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={index >= places.length - 1}
          onClick={() => places[index + 1] && onStep(places[index + 1].step.id)}
        >
          {places[index + 1]?.step.title ?? 'Next'}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </footer>
    </section>
  )
}

function PromptRow({
  prompt,
  open,
  showCue,
  value,
  onAnswer,
  onSkip,
}: {
  prompt: KickoffPrompt
  open: boolean
  showCue: boolean
  value: string
  onAnswer: (promptId: string, value: string) => void
  onSkip: () => void
}) {
  return (
    <div className={cn('kickoff-follow', open && 'is-open')}>
      <div>
        <div className="kickoff-row">
          <div className="kickoff-speak">
            {prompt.read && <p className="kickoff-read">{prompt.read}</p>}
            {prompt.cue && showCue && <p className="kickoff-cue">{prompt.cue}</p>}
          </div>
          <div className="kickoff-field">
            <div className="kickoff-field-head">
              <label className="kickoff-label" htmlFor={prompt.kind === 'choice' ? undefined : prompt.id}>
                {prompt.label}
              </label>
              <button type="button" className="kickoff-skip" aria-label={`Skip ${prompt.label}`} onClick={onSkip}>
                Skip
              </button>
            </div>
            <AnswerControl prompt={prompt} value={value} onAnswer={onAnswer} />
            {prompt.sync && (
              <p className="kickoff-sync">Saves to the project</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function AnswerControl({
  prompt,
  value,
  onAnswer,
}: {
  prompt: KickoffPrompt
  value: string
  onAnswer: (promptId: string, value: string) => void
}) {
  const commit = useCallback((next: string) => onAnswer(prompt.id, next), [onAnswer, prompt.id])

  if (prompt.kind === 'choice') {
    return (
      <div role="radiogroup" aria-label={prompt.label} className="kickoff-choices">
        {prompt.choices?.map((choice) => {
          const on = value === choice.value
          return (
            <button
              key={choice.value}
              type="button"
              role="radio"
              aria-checked={on}
              className={cn('kickoff-choice press', on && 'is-on')}
              onClick={() => onAnswer(prompt.id, on ? '' : choice.value)}
            >
              {choice.label}
            </button>
          )
        })}
      </div>
    )
  }

  if (prompt.kind === 'date') {
    return (
      <DatePicker
        id={prompt.id}
        aria-label={prompt.label}
        value={value}
        onChange={(event) => commit(event.target.value)}
      />
    )
  }

  return (
    <DraftField
      id={prompt.id}
      long={prompt.kind === 'long'}
      label={prompt.label}
      placeholder={prompt.placeholder}
      value={value}
      onCommit={commit}
    />
  )
}

function DraftField({
  id,
  long,
  label,
  placeholder,
  value,
  onCommit,
}: {
  id: string
  long: boolean
  label: string
  placeholder?: string
  value: string
  onCommit: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setDraft(value)
  }, [focused, value])

  useEffect(() => {
    if (draft === value) return
    const timer = window.setTimeout(() => onCommit(draft), 400)
    return () => window.clearTimeout(timer)
  }, [draft, value, onCommit])

  const commitNow = () => {
    if (draft !== value) onCommit(draft)
  }

  if (long) {
    return (
      <Textarea
        id={id}
        aria-label={label}
        value={draft}
        placeholder={placeholder}
        className="min-h-[96px] bg-[var(--surface)]"
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          commitNow()
        }}
        onChange={(event) => setDraft(event.target.value)}
      />
    )
  }

  return (
    <Input
      id={id}
      aria-label={label}
      value={draft}
      placeholder={placeholder}
      className="bg-[var(--surface)]"
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        commitNow()
      }}
      onChange={(event) => setDraft(event.target.value)}
    />
  )
}
