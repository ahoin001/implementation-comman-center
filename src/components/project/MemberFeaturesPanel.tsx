import { useMemo, useState } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import type { MemberFeatureDefinition, Project } from '@/types'
import { countEnabledMemberFeatures } from '@/lib/memberFeatures'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface MemberFeaturesPanelProps {
  project: Project
  definitions: MemberFeatureDefinition[]
  onToggle: (featureId: string, enabled: boolean) => void
  onAddDefinition: (label: string) => void
  onDeleteDefinition: (id: string) => void
}

export function MemberFeaturesPanel({
  project,
  definitions,
  onToggle,
  onAddDefinition,
  onDeleteDefinition,
}: MemberFeaturesPanelProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')

  const enabledCount = useMemo(
    () => countEnabledMemberFeatures(project.memberFeatures, definitions),
    [project.memberFeatures, definitions]
  )

  const handleAdd = () => {
    if (!draft.trim()) return
    onAddDefinition(draft.trim())
    setDraft('')
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 p-5 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
        aria-expanded={open}
      >
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 mt-1 text-[var(--color-muted-foreground)] transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-base font-semibold tracking-tight">Member Feature Requests</h3>
            <span className="text-xs text-[var(--color-muted-foreground)] tabular-nums">
              {enabledCount > 0
                ? `${enabledCount} requested`
                : open
                  ? `${definitions.length} in catalog`
                  : 'Usually out of the box'}
            </span>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
            Optional member gating & pricing — shared catalog, toggled per project
          </p>
          {!open && enabledCount > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {definitions
                .filter((d) => project.memberFeatures?.[d.id])
                .slice(0, 4)
                .map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]"
                  >
                    {d.label}
                  </span>
                ))}
              {enabledCount > 4 && (
                <span className="text-[10px] text-[var(--color-muted-foreground)] self-center">
                  +{enabledCount - 4} more
                </span>
              )}
            </div>
          )}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-[var(--color-border)]/60 space-y-4">
          <p className="text-[11px] text-[var(--color-muted-foreground)] pt-3">
            Creating or deleting a feature updates the shared list for every project. Toggle only
            affects this association.
          </p>

          <ul className="space-y-1.5">
            {definitions.length === 0 && (
              <li className="text-sm text-[var(--color-muted-foreground)] py-2">
                No features in the catalog yet — add one below
              </li>
            )}
            {definitions.map((def) => {
              const enabled = Boolean(project.memberFeatures?.[def.id])
              return (
                <li
                  key={def.id}
                  className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2.5"
                >
                  <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    aria-label={def.label}
                    onClick={() => onToggle(def.id, !enabled)}
                    className={cn(
                      'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
                      enabled ? 'bg-[var(--color-accent)]' : 'bg-black/15 dark:bg-white/20'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                        enabled && 'translate-x-5'
                      )}
                    />
                  </button>
                  <span
                    className={cn(
                      'flex-1 min-w-0 text-sm',
                      enabled
                        ? 'text-[var(--color-foreground)] font-medium'
                        : 'text-[var(--color-muted-foreground)]'
                    )}
                  >
                    {def.label}
                  </span>
                  <button
                    type="button"
                    title="Remove from catalog (all projects)"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Remove “${def.label}” from the shared catalog? It will disappear for every project.`
                        )
                      ) {
                        onDeleteDefinition(def.id)
                      }
                    }}
                    className="p-1.5 rounded-sm text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="flex gap-2">
            <Input
              placeholder="Add a feature to the shared catalog…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="text-sm"
            />
            <Button
              type="button"
              onClick={handleAdd}
              disabled={!draft.trim()}
              className="shrink-0 gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
