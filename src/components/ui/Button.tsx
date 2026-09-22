import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type Size = 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-ink hover:bg-accent-strong active:scale-[0.98]',
  secondary: 'bg-ink text-text-onDark hover:bg-ink-soft active:scale-[0.98]',
  ghost: 'bg-transparent text-text border border-border hover:bg-surface-muted active:scale-[0.98]',
  destructive: 'bg-transparent text-error border border-error/30 hover:bg-error/5 active:scale-[0.98]',
}

const sizeClasses: Record<Size, string> = {
  md: 'h-11 px-5 text-[15px]',
  sm: 'h-9 px-4 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-all',
        'disabled:opacity-40 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
