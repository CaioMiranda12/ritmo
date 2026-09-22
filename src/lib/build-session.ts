import type { WorkoutPlan, SessionExercise } from '../types'

export function buildSessionExercises(
  workout: WorkoutPlan,
  previousBestByExerciseId: Record<string, string> = {},
): SessionExercise[] {
  return workout.exercises.map((exercise) => {
    const previousBest = exercise.catalogExerciseId
      ? previousBestByExerciseId[exercise.catalogExerciseId] ?? null
      : null
    return {
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      catalogExerciseId: exercise.catalogExerciseId,
      previousBest,
      note: '',
      sets: exercise.sets.map((set, index) => ({
        id: set.id,
        setNumber: index + 1,
        loadKg: set.targetLoadKg,
        reps: set.targetReps,
        isDone: false,
      })),
    }
  })
}
