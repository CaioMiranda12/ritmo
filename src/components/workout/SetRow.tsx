import { Check } from 'lucide-react'
import type { LoggedSet } from '../../types'

export function SetRow({
  set,
  isActive,
  onChange,
  onToggleDone,
}: {
  set: LoggedSet
  isActive: boolean
  onChange: (field: 'loadKg' | 'reps', value: number) => void
  onToggleDone: () => void
}) {
  return (
    <div
      className={[
        'grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2 rounded-xl px-1 py-2',
        isActive ? 'bg-primary-soft/40' : '',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
          set.isDone ? 'bg-primary text-white' : 'bg-surface-muted text-text-secondary',
        ].join(' ')}
      >
        {set.isDone ? <Check size={13} strokeWidth={3} /> : set.setNumber}
      </span>

      <label className="relative">
        <input
          type="number"
          inputMode="decimal"
          value={set.loadKg ?? ''}
          onChange={(e) => onChange('loadKg', Number(e.target.value))}
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 pr-8 text-base font-medium text-text focus:border-primary focus:outline-none"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary">
          kg
        </span>
      </label>

      <input
        type="number"
        inputMode="numeric"
        value={set.reps ?? ''}
        onChange={(e) => onChange('reps', Number(e.target.value))}
        className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-base font-medium text-text focus:border-primary focus:outline-none"
      />

      <button
        onClick={onToggleDone}
        aria-pressed={set.isDone}
        aria-label={set.isDone ? 'Desmarcar série' : 'Concluir série'}
        className={[
          'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors',
          set.isDone ? 'border-primary bg-primary text-white' : 'border-border text-transparent hover:border-primary/40',
        ].join(' ')}
      >
        <Check size={16} strokeWidth={3} />
      </button>
    </div>
  )
}
