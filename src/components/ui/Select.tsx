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
  triggerClassName,
  size = 'md',
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  ariaLabel: string
  className?: string
  triggerClassName?: string
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
        className={cn('picker w-full justify-between gap-2 text-left', size === 'sm' && 'h-8 text-[13px]', triggerClassName)}
      >
        <span className="truncate">{selected?.label ?? 'Select'}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-70 transition-transform duration-200', open && 'rotate-180')} />
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
            className="menu-pop fixed z-[70] max-h-60"
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
