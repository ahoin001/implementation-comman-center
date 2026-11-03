import { CleanButton as KitCleanButton } from '@/design-system/react'
import type { IconName } from '@/design-system/react'

export function CleanButton({
  label,
  sub,
  icon = 'plus',
  done,
  busy,
  onClick,
  disabled,
}: {
  label: string
  sub?: string
  icon?: IconName
  done?: boolean
  busy?: boolean
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <KitCleanButton
      label={label}
      sub={sub}
      icon={icon}
      done={done}
      busy={busy}
      onClick={onClick}
      disabled={disabled}
    />
  )
}
