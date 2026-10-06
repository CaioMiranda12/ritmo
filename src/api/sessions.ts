import { supabase } from '../lib/supabase'
import type { ExerciseHistoryEntry, HistorySession, HistorySessionDetail, HistorySet, SessionExercise, SessionSummary } from '../types'

interface RawSet {
  position: number
  load_kg: number | null
  reps: number | null
  is_done: boolean
}

interface RawHistorySession {
  id: string
  workout_name_snapshot: string
  status: 'completed' | 'partial'
  started_at: string
  finished_at: string
  session_exercises: { id: string; session_sets: { is_done: boolean }[] }[]
}


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

function mapSet(row: RawSet): HistorySet {
  return {
    position: row.position,
    loadKg: row.load_kg === null ? null : Number(row.load_kg),
    reps: row.reps,
    isDone: row.is_done,
  }
}

function minutesBetween(startIso: string, endIso: string | null): number | null {
  if (!endIso) return null
  const minutes = Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000)
  return minutes >= 0 ? minutes : null
}

export async function fetchSessionHistory(
  userId: string,
  page = 0,
  pageSize = 20,
): Promise<HistorySession[]> {
  const from = page * pageSize
  const { data, error } = await supabase
    .from('sessions')
    .select(
      'id, workout_name_snapshot, status, started_at, finished_at, session_exercises(id, session_sets(is_done))',
    )
    .eq('user_id', userId)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .range(from, from + pageSize - 1)

  if (error) throw error

  return ((data ?? []) as unknown as RawHistorySession[]).map((row) => ({
    id: row.id,
    workoutName: row.workout_name_snapshot,
    finishedAt: row.finished_at,
    durationMinutes: minutesBetween(row.started_at, row.finished_at),
    status: row.status,
    exerciseCount: row.session_exercises.length,
    doneSetCount: row.session_exercises.reduce(
      (total, ex) => total + ex.session_sets.filter((s) => s.is_done).length,
      0,
    ),
  }))
}

interface RawSessionDetail {
  id: string
  workout_name_snapshot: string
  status: 'completed' | 'partial'
  started_at: string
  finished_at: string
  session_exercises: {
    id: string
    exercise_id: string | null
    name: string
    muscle_group: string
    equipment: string
    note: string
    position: number
    session_sets: RawSet[]
  }[]
}

export async function fetchSessionDetail(
  userId: string,
  sessionId: string,
): Promise<HistorySessionDetail | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select(
      `id, workout_name_snapshot, status, started_at, finished_at,
       session_exercises(id, exercise_id, name, muscle_group, equipment, note, position,
         session_sets(position, load_kg, reps, is_done))`,
    )
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as unknown as RawSessionDetail
  const exercises = [...row.session_exercises]
    .sort((a, b) => a.position - b.position)
    .map((ex) => ({
      id: ex.id,
      name: ex.name,
      muscleGroup: ex.muscle_group,
      equipment: ex.equipment,
      note: ex.note,
      catalogExerciseId: ex.exercise_id,
      sets: [...ex.session_sets].sort((a, b) => a.position - b.position).map(mapSet),
    }))

  return {
    id: row.id,
    workoutName: row.workout_name_snapshot,
    finishedAt: row.finished_at,
    durationMinutes: minutesBetween(row.started_at, row.finished_at),
    status: row.status,
    exerciseCount: exercises.length,
    doneSetCount: exercises.reduce((t, ex) => t + ex.sets.filter((s) => s.isDone).length, 0),
    exercises,
  }
}

interface RawExerciseHistory {
  id: string
  exercise_id: string | null
  name: string
  session_sets: RawSet[]
  sessions: { id: string; workout_name_snapshot: string; finished_at: string | null; user_id: string }
}

/**
 * Every time the user did an exercise. Matches by catalog id when available
 * (survives renames) and falls back to the snapshot name otherwise.
 */
export async function fetchExerciseHistory(
  userId: string,
  target: { catalogExerciseId: string | null; name: string },
  limit = 50,
): Promise<ExerciseHistoryEntry[]> {
  let query = supabase
    .from('session_exercises')
    .select(
      'id, exercise_id, name, session_sets(position, load_kg, reps, is_done), sessions!inner(id, workout_name_snapshot, finished_at, user_id)',
    )
    .eq('sessions.user_id', userId)
    .not('sessions.finished_at', 'is', null)

  query = target.catalogExerciseId
    ? query.eq('exercise_id', target.catalogExerciseId)
    : query.eq('name', target.name)

  const { data, error } = await query.limit(limit)
  if (error) throw error

  return ((data ?? []) as unknown as RawExerciseHistory[])
    .map((row) => ({
      sessionId: row.sessions.id,
      workoutName: row.sessions.workout_name_snapshot,
      finishedAt: row.sessions.finished_at as string,
      sets: [...row.session_sets].sort((a, b) => a.position - b.position).map(mapSet),
    }))
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
}

/** Single session_exercises row — used to resolve the route param into a catalog id + name. */
export async function fetchSessionExerciseRef(
  userId: string,
  sessionExerciseId: string,
): Promise<{ catalogExerciseId: string | null; name: string } | null> {
  const { data, error } = await supabase
    .from('session_exercises')
    .select('exercise_id, name, sessions!inner(user_id)')
    .eq('id', sessionExerciseId)
    .eq('sessions.user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return { catalogExerciseId: data.exercise_id as string | null, name: data.name as string }
}