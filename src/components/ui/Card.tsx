import type { HTMLAttributes } from 'react'

type Tone = 'surface' | 'dark' | 'accent' | 'muted'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone
  padding?: 'md' | 'lg' | 'none'
}

const toneClasses: Record<Tone, string> = {
  surface: 'bg-surface text-text border border-border',
  dark: 'bg-ink text-text-onDark',
  accent: 'bg-accent text-ink',
  muted: 'bg-surface-muted text-text',
}

const paddingClasses = {
  md: 'p-4',
  lg: 'p-6',
  none: '',
}

export function Card({
  tone = 'surface',
  padding = 'lg',
  className = '',
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'rounded-card',
        toneClasses[tone],
        paddingClasses[padding],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
