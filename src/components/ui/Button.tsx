import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const variantClass: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'primary',
  secondary: '',
  ghost: 'ghost',
  outline: '',
  danger: 'danger',
}

const sizeClass: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'small',
  md: '',
  lg: 'large',
  icon: 'icon-btn',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn('btn', variantClass[variant], sizeClass[size], className)}
      {...props}
    />
  )
)
Button.displayName = 'Button'
