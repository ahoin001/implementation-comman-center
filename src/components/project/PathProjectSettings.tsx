import { cn } from '@/lib/utils'

interface PathSettingSwitchProps {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function PathSettingSwitch({
  label,
  description,
  checked,
  onCheckedChange,
}: PathSettingSwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--color-foreground)] leading-snug">{label}</p>
        <p className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5 leading-snug">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-[var(--color-accent)]' : 'bg-black/12 dark:bg-white/15'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked && 'translate-x-5'
          )}
        />
      </button>
    </div>
  )
}

export interface PathProjectSettingsProps {
  ssoEnabled: boolean
  hasResumeData: boolean
  weHandleSales: boolean
  onSetSsoEnabled: (enabled: boolean) => void
  onSetHasResumeData: (enabled: boolean) => void
  onSetWeHandleSales: (enabled: boolean) => void
}

/**
 * Compact project-level path options (SSO, resumes site, sales ownership).
 * Shared by Classic Launch Path and Setup.
 */
export function PathProjectSettings({
  ssoEnabled,
  hasResumeData,
  weHandleSales,
  onSetSsoEnabled,
  onSetHasResumeData,
  onSetWeHandleSales,
}: PathProjectSettingsProps) {
  return (
    <div
      className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-black/[0.015] dark:bg-white/[0.02] overflow-hidden divide-y divide-[var(--color-border)]/80"
      role="group"
      aria-label="Project path settings"
    >
      <PathSettingSwitch
        label="SSO enabled"
        description="Off when this association will not use single sign-on"
        checked={ssoEnabled}
        onCheckedChange={onSetSsoEnabled}
      />
      <PathSettingSwitch
        label="Resumes on site"
        description="On when resume files are part of import and Resumes should be enabled"
        checked={hasResumeData}
        onCheckedChange={onSetHasResumeData}
      />
      <PathSettingSwitch
        label="We manage Sales"
        description="On when our team configures Sales for them, not the association"
        checked={weHandleSales}
        onCheckedChange={onSetWeHandleSales}
      />
    </div>
  )
}
