import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { shape?: 'default' | 'pill' }>(
  ({ className, shape = 'default', ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full border border-transparent bg-[var(--color-field)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-wash-strong)]',
        shape === 'pill' ? 'rounded-full' : 'rounded-xl',
        className
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-transparent bg-[var(--color-field)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-wash-strong)] resize-none',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
