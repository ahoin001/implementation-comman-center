import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { shape?: 'default' | 'pill' }
>(({ className, shape = 'default', ...props }, ref) => (
  <input
    ref={ref}
    className={cn('input', shape === 'pill' && 'pill-input', className)}
    {...props}
  />
))
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn('textarea', className)} {...props} />
  )
)
Textarea.displayName = 'Textarea'
