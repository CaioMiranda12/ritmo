// These types describe the shape of the mock data used to validate the
// design in Phase 1. They intentionally mirror the future database model,
// but nothing here talks to Supabase yet.

export type WeekdayCode = 'S' | 'T' | 'Q' | 'Q2' | 'S2' | 'S3' | 'D'

export interface SetPlan {
  id: string
  targetReps: number
  targetLoadKg: number | null
}

export interface ExercisePlan {
  id: string
  name: string
  muscleGroup: string
  equipment: string
  restSeconds: number
  sets: SetPlan[]
  note?: string
  /** Stable link to the exercise catalog — used for load-progression comparisons over time. */
  catalogExerciseId?: string | null
}

export interface WorkoutPlan {
  id: string
  name: string
  dayLabel: string
  exerciseCount: number
  setCount: number
  estimatedMinutes: number
  lastPerformedLabel: string | null
  isToday: boolean
  exercises: ExercisePlan[]
}

export interface LoggedSet {
  id: string
  setNumber: number
  loadKg: number | null
  reps: number | null
  isDone: boolean
}

export interface SessionExercise {
  id: string
  name: string
  muscleGroup: string
  equipment: string
  previousBest: string | null
  sets: LoggedSet[]
  note: string
  catalogExerciseId?: string | null
}

export interface FoodItem {
  id: string
  description: string
  caloriesKcal?: number | null
}

export interface WeightEntry {
  date: string
  weightKg: number
}

export interface SessionSummary {
  id: string
  workoutName: string
  dateLabel: string
  durationMinutes: number
  highlight: string
}

// --- Diet day types (multiple diets per week, e.g. "training day" vs "rest
// day"), each meal slot can offer more than one option to choose from. ---

export interface MealOption {
  id: string
  name: string
  estimatedKcal: number
  foods: FoodItem[]
}

export interface MealSlot {
  id: string
  name: string
  time: string
  options: MealOption[]
}

export interface DietDayType {
  id: string
  name: string
  meals: MealSlot[]
}

export type WeekdayAssignments = Record<string, string | null>

