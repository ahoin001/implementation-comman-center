import { forwardRef, useRef, type InputHTMLAttributes } from 'react'
import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, onClick, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null)

    const setRef = (node: HTMLInputElement | null) => {
      innerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }

    const openPicker = () => {
      const el = innerRef.current
      if (!el) return
      if (typeof el.showPicker === 'function') {
        try {
          el.showPicker()
        } catch {
          el.focus()
        }
      } else {
        el.focus()
      }
    }

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openPicker()
          }
        }}
        className={cn(
          'relative flex h-10 w-full cursor-pointer items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card-solid)] transition-colors duration-150',
          'hover:border-[var(--color-accent)]/40 focus-within:ring-2 focus-within:ring-[var(--color-accent)]',
          className
        )}
      >
        <input
          ref={setRef}
          type="date"
          {...props}
          onClick={(e) => {
            e.stopPropagation()
            onClick?.(e)
            openPicker()
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <span
          className={cn(
            'pointer-events-none flex-1 px-3 text-sm',
            props.value ? 'text-[var(--color-foreground)]' : 'text-[var(--color-muted)]'
          )}
        >
          {props.value
            ? new Date(`${props.value}T12:00:00`).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : (props.placeholder ?? 'Select date')}
        </span>
        <Calendar className="pointer-events-none mr-3 h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
      </div>
    )
  }
)
DatePicker.displayName = 'DatePicker'

export const TimePicker = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  ({ className, onClick, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null)

    const setRef = (node: HTMLInputElement | null) => {
      innerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }

    const openPicker = () => {
      const el = innerRef.current
      if (!el) return
      if (typeof el.showPicker === 'function') {
        try {
          el.showPicker()
        } catch {
          el.focus()
        }
      } else {
        el.focus()
      }
    }

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openPicker()
          }
        }}
        className={cn(
          'relative flex h-10 w-full cursor-pointer items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-card-solid)] transition-colors duration-150',
          'hover:border-[var(--color-accent)]/40 focus-within:ring-2 focus-within:ring-[var(--color-accent)]',
          className
        )}
      >
        <input
          ref={setRef}
          type="time"
          {...props}
          onClick={(e) => {
            e.stopPropagation()
            onClick?.(e)
            openPicker()
          }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <span
          className={cn(
            'pointer-events-none flex-1 px-3 text-sm tabular-nums',
            props.value ? 'text-[var(--color-foreground)]' : 'text-[var(--color-muted)]'
          )}
        >
          {props.value || (props.placeholder ?? 'Select time')}
        </span>
      </div>
    )
  }
)
TimePicker.displayName = 'TimePicker'
