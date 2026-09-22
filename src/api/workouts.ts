import { supabase } from '../lib/supabase'
import { getTodayWorkoutDayLabel } from '../lib/weekday'
import { fetchLastPerformedLabels } from './sessions'
import type { WorkoutPlan, ExercisePlan, SetPlan } from '../types'

// --- DB row shapes (hand-written until `supabase gen types` is run against
// the real project — see supabase/README.md). ---

interface SetRow {
  id: string
  position: number
  target_reps: number
  target_load_kg: number | null
}

interface ExerciseRow {
  id: string
  exercise_id: string | null
  name: string
  muscle_group: string
  equipment: string
  rest_seconds: number
  note: string
  position: number
  workout_sets: SetRow[]
}

interface WorkoutRow {
  id: string
  name: string
  day_label: string
  archived_at: string | null
  created_at: string
  workout_exercises: ExerciseRow[]
}

const WORKOUT_SELECT = '*, workout_exercises(*, workout_sets(*))'

function toSetPlan(row: SetRow): SetPlan {
  return { id: row.id, targetReps: row.target_reps, targetLoadKg: row.target_load_kg }
}

function toExercisePlan(row: ExerciseRow): ExercisePlan {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    equipment: row.equipment,
    restSeconds: row.rest_seconds,
    note: row.note,
    catalogExerciseId: row.exercise_id,
    sets: [...row.workout_sets].sort((a, b) => a.position - b.position).map(toSetPlan),
  }
}

// lastPerformedLabel needs the sessions table too — computed by the caller
// (WorkoutsContext) once, and merged in via `lastPerformedByWorkoutId`.
export function toWorkoutPlan(row: WorkoutRow, lastPerformedLabel: string | null): WorkoutPlan {
  const exercises = [...row.workout_exercises].sort((a, b) => a.position - b.position).map(toExercisePlan)
  const setCount = exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  return {
    id: row.id,
    name: row.name,
    dayLabel: row.day_label,
    exerciseCount: exercises.length,
    setCount,
    // No estimated_minutes column — this is a rough approximation, not a
    // tracked value. Good enough for the "≈ X min" hint on the cards.
    estimatedMinutes: setCount > 0 ? Math.round(setCount * 2.5) : 0,
    lastPerformedLabel,
    isToday: row.day_label === getTodayWorkoutDayLabel(),
    exercises,
  }
}

export async function fetchWorkoutRows(userId: string): Promise<WorkoutRow[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(WORKOUT_SELECT)
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as WorkoutRow[]
}

/** Full list, ready for the UI: rows joined with each workout's last-performed label. */
export async function fetchWorkouts(userId: string): Promise<WorkoutPlan[]> {
  const [rows, lastPerformed] = await Promise.all([fetchWorkoutRows(userId), fetchLastPerformedLabels(userId)])
  return rows.map((row) => toWorkoutPlan(row, lastPerformed[row.id] ?? null))
}

export async function createWorkout(userId: string, input: { name: string; dayLabel: string }) {
  const { data, error } = await supabase
    .from('workouts')
    .insert({ user_id: userId, name: input.name, day_label: input.dayLabel })
    .select(WORKOUT_SELECT)
    .single()

  if (error) throw error
  return toWorkoutPlan(data as unknown as WorkoutRow, null)
}

export async function updateWorkoutMeta(workoutId: string, input: { name: string; dayLabel: string }) {
  const { error } = await supabase
    .from('workouts')
    .update({ name: input.name, day_label: input.dayLabel })
    .eq('id', workoutId)
  if (error) throw error
}

export async function archiveWorkout(workoutId: string) {
  const { error } = await supabase
    .from('workouts')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', workoutId)
  if (error) throw error
}

export async function duplicateWorkout(userId: string, workout: WorkoutPlan) {
  const { data: newWorkout, error: workoutError } = await supabase
    .from('workouts')
    .insert({ user_id: userId, name: `${workout.name} (cópia)`, day_label: '' })
    .select()
    .single()
  if (workoutError) throw workoutError

  for (const [exIndex, exercise] of workout.exercises.entries()) {
    const { data: newExercise, error: exerciseError } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id: newWorkout.id,
        exercise_id: exercise.catalogExerciseId ?? null,
        name: exercise.name,
        muscle_group: exercise.muscleGroup,
        equipment: exercise.equipment,
        rest_seconds: exercise.restSeconds,
        note: exercise.note ?? '',
        position: exIndex,
      })
      .select()
      .single()
    if (exerciseError) throw exerciseError

    if (exercise.sets.length > 0) {
      const { error: setsError } = await supabase.from('workout_sets').insert(
        exercise.sets.map((set, setIndex) => ({
          workout_exercise_id: newExercise.id,
          position: setIndex,
          target_reps: set.targetReps,
          target_load_kg: set.targetLoadKg,
        })),
      )
      if (setsError) throw setsError
    }
  }
}

export async function addExercisesToWorkout(
  workoutId: string,
  startPosition: number,
  catalogExercises: { id: string; name: string; muscleGroup: string; equipment: string }[],
) {
  for (const [index, catalogExercise] of catalogExercises.entries()) {
    const { data: newExercise, error } = await supabase
      .from('workout_exercises')
      .insert({
        workout_id: workoutId,
        exercise_id: catalogExercise.id,
        name: catalogExercise.name,
        muscle_group: catalogExercise.muscleGroup,
        equipment: catalogExercise.equipment,
        rest_seconds: 60,
        position: startPosition + index,
      })
      .select()
      .single()
    if (error) throw error

    const { error: setsError } = await supabase.from('workout_sets').insert(
      Array.from({ length: 3 }, (_, setIndex) => ({
        workout_exercise_id: newExercise.id,
        position: setIndex,
        target_reps: 10,
        target_load_kg: null,
      })),
    )
    if (setsError) throw setsError
  }
}

export async function removeExerciseFromWorkout(exerciseId: string) {
  const { error } = await supabase.from('workout_exercises').delete().eq('id', exerciseId)
  if (error) throw error
}

/** Renumbers every exercise's position to match its index in `orderedIds` — self-heals any gaps left by past deletions, simpler than pairwise position swaps. */
export async function reorderExercises(orderedIds: string[]) {
  const { error } = await supabase
    .from('workout_exercises')
    .upsert(orderedIds.map((id, position) => ({ id, position })))
  if (error) throw error
}

export async function updateExerciseNote(exerciseId: string, note: string) {
  const { error } = await supabase.from('workout_exercises').update({ note }).eq('id', exerciseId)
  if (error) throw error
}

export async function updateSet(setId: string, field: 'targetReps' | 'targetLoadKg', value: number | null) {
  const column = field === 'targetReps' ? 'target_reps' : 'target_load_kg'
  const { error } = await supabase.from('workout_sets').update({ [column]: value }).eq('id', setId)
  if (error) throw error
}

export async function addSetToExercise(
  exerciseId: string,
  position: number,
  defaults: { targetReps: number; targetLoadKg: number | null },
) {
  const { error } = await supabase.from('workout_sets').insert({
    workout_exercise_id: exerciseId,
    position,
    target_reps: defaults.targetReps,
    target_load_kg: defaults.targetLoadKg,
  })
  if (error) throw error
}

export async function removeSet(setId: string) {
  const { error } = await supabase.from('workout_sets').delete().eq('id', setId)
  if (error) throw error
}
