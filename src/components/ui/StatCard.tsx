import type { ReactNode } from 'react'

type Tone = 'surface' | 'dark' | 'accent'

const toneClasses: Record<Tone, string> = {
  surface: 'bg-surface border border-border text-text',
  dark: 'bg-ink text-text-onDark',
  accent: 'bg-accent text-ink',
}

export function StatCard({
  label,
  value,
  unit,
  caption,
  tone = 'surface',
}: {
  label: string
  value: ReactNode
  unit?: string
  caption?: string
  tone?: Tone
}) {
  return (
    <div className={['rounded-card p-5', toneClasses[tone]].join(' ')}>
      <p className={['text-sm', tone === 'surface' ? 'text-text-secondary' : 'opacity-80'].join(' ')}>{label}</p>
      <p className="mt-2 flex items-baseline gap-1 text-3xl font-semibold">
        {value}
        {unit && <span className="text-base font-medium opacity-70">{unit}</span>}
      </p>
      {caption && (
        <p className={['mt-1 text-xs', tone === 'surface' ? 'text-text-secondary' : 'opacity-70'].join(' ')}>
          {caption}
        </p>
      )}
    </div>
  )
}
