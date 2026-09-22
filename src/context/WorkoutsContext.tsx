import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { WorkoutPlan, ExercisePlan } from '../types'
import { useAuth } from './AuthContext'
import { useExerciseCatalog } from '../hooks/useExerciseCatalog'
import * as workoutsApi from '../api/workouts'

interface WorkoutsContextValue {
  workouts: WorkoutPlan[]
  isLoading: boolean
  isError: boolean
  addWorkout: (input: { name: string; dayLabel: string }) => Promise<WorkoutPlan>
  updateWorkoutMeta: (workoutId: string, input: { name: string; dayLabel: string }) => Promise<void>
  addExercisesToWorkout: (workoutId: string, catalogExerciseIds: string[]) => Promise<void>
  removeExerciseFromWorkout: (workoutId: string, exerciseId: string) => Promise<void>
  moveExercise: (workoutId: string, exerciseId: string, direction: 'up' | 'down') => Promise<void>
  updateSet: (
    workoutId: string,
    exerciseId: string,
    setId: string,
    field: 'targetReps' | 'targetLoadKg',
    value: number | null,
  ) => void
  addSetToExercise: (workoutId: string, exerciseId: string) => Promise<void>
  removeSetFromExercise: (workoutId: string, exerciseId: string, setId: string) => Promise<void>
  updateExerciseNote: (workoutId: string, exerciseId: string, note: string) => void
  archiveWorkout: (workoutId: string) => Promise<void>
  duplicateWorkout: (workoutId: string) => Promise<void>
}

const WorkoutsContext = createContext<WorkoutsContextValue | null>(null)

const DEBOUNCE_MS = 600

function mapWorkout(workouts: WorkoutPlan[], workoutId: string, updater: (w: WorkoutPlan) => WorkoutPlan) {
  return workouts.map((w) => (w.id === workoutId ? recalcTotals(updater(w)) : w))
}

function mapExercise(workout: WorkoutPlan, exerciseId: string, updater: (e: ExercisePlan) => ExercisePlan): WorkoutPlan {
  return { ...workout, exercises: workout.exercises.map((e) => (e.id === exerciseId ? updater(e) : e)) }
}

function recalcTotals(workout: WorkoutPlan): WorkoutPlan {
  const setCount = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  return {
    ...workout,
    exerciseCount: workout.exercises.length,
    setCount,
    estimatedMinutes: setCount > 0 ? Math.round(setCount * 2.5) : 0,
  }
}

export function WorkoutsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['workouts', userId] as const, [userId])
  const debounceTimers = useRef<Record<string, number>>({})

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => workoutsApi.fetchWorkouts(userId!),
    enabled: Boolean(userId),
  })
  const workouts = data ?? []
  const { data: catalog = [] } = useExerciseCatalog()

  function setCache(updater: (current: WorkoutPlan[]) => WorkoutPlan[]) {
    queryClient.setQueryData<WorkoutPlan[]>(queryKey, (current) => (current ? updater(current) : current))
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey })
  }

  function debounced(key: string, fn: () => void) {
    if (debounceTimers.current[key]) window.clearTimeout(debounceTimers.current[key])
    debounceTimers.current[key] = window.setTimeout(fn, DEBOUNCE_MS)
  }

  const value = useMemo<WorkoutsContextValue>(
    () => ({
      workouts,
      isLoading,
      isError,

      async addWorkout(input) {
        const newWorkout = await workoutsApi.createWorkout(userId!, input)
        setCache((current) => [newWorkout, ...current])
        return newWorkout
      },

      async updateWorkoutMeta(workoutId, input) {
        setCache((current) => mapWorkout(current, workoutId, (w) => ({ ...w, name: input.name, dayLabel: input.dayLabel })))
        await workoutsApi.updateWorkoutMeta(workoutId, input)
      },

      async addExercisesToWorkout(workoutId, catalogExerciseIds) {
        const workout = workouts.find((w) => w.id === workoutId)
        if (!workout) return
        const catalogExercises = catalog.filter((e) => catalogExerciseIds.includes(e.id))
        await workoutsApi.addExercisesToWorkout(workoutId, workout.exercises.length, catalogExercises)
        invalidate()
      },

      async removeExerciseFromWorkout(workoutId, exerciseId) {
        setCache((current) =>
          mapWorkout(current, workoutId, (w) => ({ ...w, exercises: w.exercises.filter((e) => e.id !== exerciseId) })),
        )
        await workoutsApi.removeExerciseFromWorkout(exerciseId)
      },

      async moveExercise(workoutId, exerciseId, direction) {
        const workout = workouts.find((w) => w.id === workoutId)
        if (!workout) return
        const index = workout.exercises.findIndex((e) => e.id === exerciseId)
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (index === -1 || targetIndex < 0 || targetIndex >= workout.exercises.length) return

        const reordered = [...workout.exercises]
        ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]

        setCache((current) => mapWorkout(current, workoutId, (w) => ({ ...w, exercises: reordered })))
        await workoutsApi.reorderExercises(reordered.map((e) => e.id))
      },

      updateSet(workoutId, exerciseId, setId, field, value) {
        setCache((current) =>
          mapWorkout(current, workoutId, (w) =>
            mapExercise(w, exerciseId, (ex) => ({
              ...ex,
              sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
            })),
          ),
        )
        debounced(`set:${setId}:${field}`, () => {
          workoutsApi.updateSet(setId, field, value).catch(invalidate)
        })
      },

      async addSetToExercise(workoutId, exerciseId) {
        const workout = workouts.find((w) => w.id === workoutId)
        const exercise = workout?.exercises.find((e) => e.id === exerciseId)
        if (!exercise) return
        const lastSet = exercise.sets[exercise.sets.length - 1]
        const defaults = { targetReps: lastSet?.targetReps ?? 10, targetLoadKg: lastSet?.targetLoadKg ?? null }

        await workoutsApi.addSetToExercise(exerciseId, exercise.sets.length, defaults)
        invalidate()
      },

      async removeSetFromExercise(workoutId, exerciseId, setId) {
        setCache((current) =>
          mapWorkout(current, workoutId, (w) =>
            mapExercise(w, exerciseId, (ex) => ({ ...ex, sets: ex.sets.filter((s) => s.id !== setId) })),
          ),
        )
        await workoutsApi.removeSet(setId)
      },

      updateExerciseNote(workoutId, exerciseId, note) {
        setCache((current) =>
          mapWorkout(current, workoutId, (w) => mapExercise(w, exerciseId, (ex) => ({ ...ex, note }))),
        )
        debounced(`note:${exerciseId}`, () => {
          workoutsApi.updateExerciseNote(exerciseId, note).catch(invalidate)
        })
      },

      async archiveWorkout(workoutId) {
        setCache((current) => current.filter((w) => w.id !== workoutId))
        await workoutsApi.archiveWorkout(workoutId)
      },

      async duplicateWorkout(workoutId) {
        const workout = workouts.find((w) => w.id === workoutId)
        if (!workout) return
        await workoutsApi.duplicateWorkout(userId!, workout)
        invalidate()
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workouts, isLoading, isError, userId, queryKey, catalog],
  )

  return <WorkoutsContext.Provider value={value}>{children}</WorkoutsContext.Provider>
}

export function useWorkouts() {
  const context = useContext(WorkoutsContext)
  if (!context) throw new Error('useWorkouts must be used within a WorkoutsProvider')
  return context
}
