import { cn } from '@/lib/utils'

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  label,
}: {
  value: T
  onChange: (value: T) => void
  options: { id: T; label: string }[]
  className?: string
  label?: string
}) {
  return (
    <div role="group" aria-label={label} className={cn('seg', className)}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={option.id === value}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
