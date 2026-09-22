import type { WeightEntry } from '../../types'

export function WeightChart({ data }: { data: WeightEntry[] }) {
  const width = 600
  const height = 180
  const paddingY = 16

  const weights = data.map((d) => d.weightKg)
  const min = Math.min(...weights)
  const max = Math.max(...weights)
  const range = max - min || 1

  const points = data.map((entry, index) => {
    const x = (index / (data.length - 1)) * width
    const y = paddingY + (1 - (entry.weightKg - min) / range) * (height - paddingY * 2)
    return { x, y }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`
  const last = points[points.length - 1]

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" role="img" aria-label="Evolução de peso corporal">
        <defs>
          <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#weightFill)" />
        <path d={linePath} fill="none" stroke="var(--color-primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last.x} cy={last.y} r={5} fill="var(--color-accent)" stroke="var(--color-primary)" strokeWidth={2} />
      </svg>
      <div className="mt-2 flex justify-between text-xs text-text-secondary">
        {data
          .filter((_, i) => i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1)
          .map((entry) => (
            <span key={entry.date}>{entry.date}</span>
          ))}
      </div>
    </div>
  )
}
