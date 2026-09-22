import type { ReactNode } from 'react'

type Tone = 'accent' | 'primary' | 'neutral' | 'warning'

const toneClasses: Record<Tone, string> = {
  accent: 'bg-accent text-ink',
  primary: 'bg-primary-soft text-primary',
  neutral: 'bg-surface-muted text-text-secondary',
  warning: 'bg-warning/15 text-warning',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium',
        toneClasses[tone],
      ].join(' ')}
    >
      {children}
    </span>
  )
}
