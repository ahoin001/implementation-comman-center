import { cn } from '@/lib/utils'

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: { id: T; label: string }[]
  className?: string
}) {
  return (
    <div className={cn('inline-flex rounded-full bg-[var(--color-field)] p-1', className)}>
      {options.map((option) => {
        const selected = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-[background-color,color,box-shadow] duration-150',
              selected
                ? 'bg-[var(--color-ink)] text-[var(--color-panel)] shadow-sm'
                : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
