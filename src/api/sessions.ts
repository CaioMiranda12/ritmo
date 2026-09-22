import { supabase } from '../lib/supabase'
import type { SessionExercise, SessionSummary } from '../types'

function formatRelativeDate(isoDate: string) {
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'hoje'
  if (days === 1) return 'há 1 dia'
  return `há ${days} dias`
}

function formatShortDate(isoDate: string) {
  const date = new Date(isoDate)
  const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${date.getDate()} ${monthNames[date.getMonth()]}`
}

/** Most recent finished session per workout, as a "há N dias" label. */
export async function fetchLastPerformedLabels(userId: string): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('sessions')
    .select('workout_id, finished_at')
    .eq('user_id', userId)
    .not('workout_id', 'is', null)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })

  if (error) throw error

  const labels: Record<string, string> = {}
  for (const row of data ?? []) {
    if (row.workout_id && !labels[row.workout_id]) {
      labels[row.workout_id] = formatRelativeDate(row.finished_at as string)
    }
  }
  return labels
}

interface PreviousBestSetRow {
  load_kg: number | null
  reps: number | null
}

interface PreviousBestExerciseRow {
  exercise_id: string | null
  session_sets: PreviousBestSetRow[]
  sessions: { finished_at: string | null } | null
}

/** For each catalog exercise id, the best set (highest load) from the most recent session that included it. */
export async function fetchPreviousBest(
  userId: string,
  catalogExerciseIds: string[],
): Promise<Record<string, string>> {
  if (catalogExerciseIds.length === 0) return {}

  const { data, error } = await supabase
    .from('session_exercises')
    .select('exercise_id, session_sets(load_kg, reps), sessions!inner(finished_at, user_id)')
    .in('exercise_id', catalogExerciseIds)
    .eq('sessions.user_id', userId)
    .order('sessions(finished_at)', { ascending: false })

  if (error) throw error

  const result: Record<string, string> = {}
  for (const row of (data ?? []) as unknown as PreviousBestExerciseRow[]) {
    if (!row.exercise_id || result[row.exercise_id]) continue
    const bestSet = [...row.session_sets]
      .filter((s) => s.load_kg !== null && s.reps !== null)
      .sort((a, b) => (b.load_kg ?? 0) - (a.load_kg ?? 0))[0]
    if (bestSet) {
      result[row.exercise_id] = `${bestSet.load_kg} kg × ${bestSet.reps} reps na melhor série`
    }
  }
  return result
}

export async function createSession(
  userId: string,
  input: {
    workoutId: string | null
    workoutName: string
    status: 'completed' | 'partial'
    exercises: SessionExercise[]
  },
) {
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      workout_id: input.workoutId,
      workout_name_snapshot: input.workoutName,
      status: input.status,
      finished_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (sessionError) throw sessionError

  for (const [exIndex, exercise] of input.exercises.entries()) {
    const { data: sessionExercise, error: exerciseError } = await supabase
      .from('session_exercises')
      .insert({
        session_id: session.id,
        exercise_id: exercise.catalogExerciseId ?? null,
        name: exercise.name,
        muscle_group: exercise.muscleGroup,
        equipment: exercise.equipment,
        note: exercise.note,
        position: exIndex,
      })
      .select()
      .single()
    if (exerciseError) throw exerciseError

    const doneSets = exercise.sets.filter((s) => s.isDone || s.loadKg !== null || s.reps !== null)
    if (doneSets.length > 0) {
      const { error: setsError } = await supabase.from('session_sets').insert(
        doneSets.map((set, setIndex) => ({
          session_exercise_id: sessionExercise.id,
          position: setIndex,
          load_kg: set.loadKg,
          reps: set.reps,
          is_done: set.isDone,
        })),
      )
      if (setsError) throw setsError
    }
  }

  return session
}

export async function fetchRecentSessions(userId: string, limit = 5): Promise<SessionSummary[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, workout_name_snapshot, finished_at, status')
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    workoutName: row.workout_name_snapshot,
    dateLabel: formatShortDate(row.finished_at as string),
    durationMinutes: 0,
    highlight: row.status === 'partial' ? 'Sessão parcial' : 'Concluído',
  }))
}

export async function fetchSessionsThisWeekCount(userId: string): Promise<number> {
  const today = new Date()
  const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .gte('finished_at', monday.toISOString())

  if (error) throw error
  return count ?? 0
}
