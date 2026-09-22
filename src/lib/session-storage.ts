import type { SessionExercise } from '../types'

interface StoredSession {
  exercises: SessionExercise[]
  exerciseIndex: number
  savedAt: number
}

function storageKey(workoutId: string) {
  return `ritmo:session:${workoutId}`
}

export function saveSessionProgress(workoutId: string, data: Omit<StoredSession, 'savedAt'>) {
  try {
    localStorage.setItem(storageKey(workoutId), JSON.stringify({ ...data, savedAt: Date.now() }))
  } catch {
    // Storage can fail (private mode, quota). Losing the draft is acceptable here.
  }
}

export function loadSessionProgress(workoutId: string): StoredSession | null {
  try {
    const raw = localStorage.getItem(storageKey(workoutId))
    return raw ? (JSON.parse(raw) as StoredSession) : null
  } catch {
    return null
  }
}

export function clearSessionProgress(workoutId: string) {
  try {
    localStorage.removeItem(storageKey(workoutId))
  } catch {
    // Nothing to do if this fails — the key will simply be overwritten next time.
  }
}
