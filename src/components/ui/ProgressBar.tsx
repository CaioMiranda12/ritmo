type Tone = 'accent' | 'primary' | 'onDark'

const trackTone: Record<Tone, string> = {
  accent: 'bg-black/10',
  primary: 'bg-primary-soft',
  onDark: 'bg-white/10',
}

const fillTone: Record<Tone, string> = {
  accent: 'bg-ink',
  primary: 'bg-primary',
  onDark: 'bg-accent',
}

export function ProgressBar({
  value,
  tone = 'primary',
  className = '',
}: {
  value: number
  tone?: Tone
  className?: string
}) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={['h-1.5 w-full overflow-hidden rounded-pill', trackTone[tone], className].join(' ')}>
      <div
        className={['h-full rounded-pill transition-[width] duration-500', fillTone[tone]].join(' ')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
