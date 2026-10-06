import type { HistorySet } from '../types'

export function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatLoad(kg: number | null) {
  if (kg === null) return '—'
  return `${kg.toString().replace('.', ',')} kg`
}

/** Sets that were actually performed (done, or at least with a load/reps filled in). */
export function performedSets(sets: HistorySet[]) {
  return sets.filter((s) => s.isDone || s.loadKg !== null || s.reps !== null)
}

export function bestSet(sets: HistorySet[]): HistorySet | null {
  const candidates = performedSets(sets).filter((s) => s.loadKg !== null)
  if (candidates.length === 0) return null
  return candidates.reduce((best, s) =>
    (s.loadKg ?? 0) > (best.loadKg ?? 0) ||
    ((s.loadKg ?? 0) === (best.loadKg ?? 0) && (s.reps ?? 0) > (best.reps ?? 0))
      ? s
      : best,
  )
}

export function formatSet(set: HistorySet) {
  return `${formatLoad(set.loadKg)} × ${set.reps ?? '—'}`
}