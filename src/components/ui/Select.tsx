import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SelectOption = { value: string; label: string }

export function Select({
  value,
  onChange,
  options,
  ariaLabel,
  className,
  size = 'md',
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  ariaLabel: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const listId = useId()
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null)
  const selected = options.find((option) => option.value === value)

  const place = () => {
    const button = buttonRef.current
    if (!button) return
    const rect = button.getBoundingClientRect()
    const width = Math.max(rect.width, 176)
    const menuHeight = Math.min(options.length * 40 + 8, 240)
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow < menuHeight + 12 && rect.top > menuHeight ? rect.top - menuHeight - 6 : rect.bottom + 6
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
    setBox({ top, left, width })
  }

  useLayoutEffect(() => {
    if (!open) return
    place()
  }, [open, options.length])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onReflow = () => place()
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onReflow)
    window.addEventListener('scroll', onReflow, true)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onReflow)
      window.removeEventListener('scroll', onReflow, true)
    }
  }, [open, options.length])

  return (
    <div className={cn('relative min-w-0', className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-xl bg-[var(--color-panel)] text-left font-medium text-[var(--color-ink)] shadow-[0_10px_22px_-14px_rgba(47,68,130,0.55)] ring-1 ring-[color-mix(in_srgb,var(--color-ink)_14%,transparent)] transition-[box-shadow,ring-color] duration-150 hover:ring-[color-mix(in_srgb,var(--color-wash-strong)_45%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-wash-strong)]',
          size === 'sm' ? 'h-9 px-2.5 text-[13px]' : 'h-10 px-3 text-sm'
        )}
      >
        <span className="truncate">{selected?.label ?? 'Select'}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[var(--color-ink-soft)] transition-transform duration-200',
            open && 'rotate-180 text-[var(--color-wash-strong)]'
          )}
        />
      </button>
      {open &&
        box &&
        createPortal(
          <ul
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            style={{ top: box.top, left: box.left, width: box.width }}
            className="float-panel fixed z-[70] max-h-60 overflow-auto p-1"
          >
            {options.map((option) => {
              const active = option.value === value
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                    className={cn(
                      'flex w-full rounded-lg px-3 py-2 text-left text-sm',
                      active
                        ? 'bg-[var(--color-wash-strong)] font-medium text-white'
                        : 'text-[var(--color-ink)] hover:bg-[var(--color-wash)]'
                    )}
                  >
                    {option.label}
                  </button>
                </li>
              )
            })}
          </ul>,
          document.body
        )}
    </div>
  )
}
