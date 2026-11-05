import type { Project } from '@/types'
import { kickoffNotes } from '@/lib/kickoffScript'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'

export function KickoffNotes({
  project,
  onOpen,
  onOpenStep,
}: {
  project: Project
  onOpen: () => void
  onOpenStep: (stepId: string) => void
}) {
  const groups = kickoffNotes(project)

  return (
    <Panel pad="md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-[var(--ink)]">Kickoff notes</h2>
        <Button type="button" size="sm" variant={groups.length > 0 ? 'ghost' : 'default'} onClick={onOpen}>
          {groups.length > 0 ? 'Open script' : 'Kickoff call'}
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="mt-3 max-w-prose text-sm leading-6 text-[var(--ink-3)]">
          Notes from the kickoff show up here. Launch date, the day-to-day contact, and SSO stay on the project.
        </p>
      ) : (
        <div className="mt-4 space-y-5">
          {groups.map((group) => (
            <section key={group.stepId}>
              <button
                type="button"
                onClick={() => onOpenStep(group.stepId)}
                className="press text-left text-sm font-semibold tracking-tight text-[var(--ink)] hover:text-[var(--ink-2)]"
              >
                {group.title}
              </button>
              <dl className="mt-2 space-y-2.5">
                {group.notes.map((note) => (
                  <div key={note.promptId}>
                    <dt className="text-xs font-medium text-[var(--ink-3)]">{note.label}</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-sm leading-6 text-[var(--ink)]">{note.text}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
    </Panel>
  )
}
