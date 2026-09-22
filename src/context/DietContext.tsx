import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { DietDayType, MealSlot, MealOption, WeekdayAssignments } from '../types'
import { useAuth } from './AuthContext'
import * as dietApi from '../api/diet'

interface DailyMealState {
  selectedOptionId: string | null
  isDone: boolean
}

type DailyLog = Record<string, DailyMealState>

interface DietContextValue {
  dayTypes: DietDayType[]
  weekdayAssignments: WeekdayAssignments
  dailyLog: DailyLog
  isLoading: boolean
  isError: boolean

  addDayType: (name: string) => Promise<DietDayType>
  renameDayType: (dayTypeId: string, name: string) => void
  removeDayType: (dayTypeId: string) => Promise<void>
  duplicateDayType: (dayTypeId: string) => Promise<void>
  assignWeekday: (weekdayCode: string, dayTypeId: string | null) => Promise<void>

  addMealSlot: (dayTypeId: string, input: { name: string; time: string }) => Promise<void>
  updateMealSlot: (dayTypeId: string, mealSlotId: string, input: { name: string; time: string }) => Promise<void>
  removeMealSlot: (dayTypeId: string, mealSlotId: string) => Promise<void>

  addOption: (dayTypeId: string, mealSlotId: string, input: { name: string }) => Promise<void>
  removeOption: (dayTypeId: string, mealSlotId: string, optionId: string) => Promise<void>
  addFoodToOption: (
    dayTypeId: string,
    mealSlotId: string,
    optionId: string,
    input: { description: string; caloriesKcal?: number | null },
  ) => Promise<void>
  updateFood: (
    dayTypeId: string,
    mealSlotId: string,
    optionId: string,
    foodId: string,
    input: { description: string; caloriesKcal?: number | null },
  ) => void
  removeFood: (dayTypeId: string, mealSlotId: string, optionId: string, foodId: string) => Promise<void>

  selectOption: (mealSlotId: string, optionId: string) => void
  toggleMealSlotDone: (mealSlotId: string) => void
}

const DietContext = createContext<DietContextValue | null>(null)

const DEBOUNCE_MS = 600

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function mapDayType(dayTypes: DietDayType[], dayTypeId: string, updater: (dt: DietDayType) => DietDayType) {
  return dayTypes.map((dt) => (dt.id === dayTypeId ? updater(dt) : dt))
}

function mapMealSlot(dayType: DietDayType, mealSlotId: string, updater: (slot: MealSlot) => MealSlot): DietDayType {
  return { ...dayType, meals: dayType.meals.map((slot) => (slot.id === mealSlotId ? updater(slot) : slot)) }
}

function mapOption(slot: MealSlot, optionId: string, updater: (option: MealOption) => MealOption): MealSlot {
  return { ...slot, options: slot.options.map((o) => (o.id === optionId ? updater(o) : o)) }
}

// Mirrors the sort applied when fetching from Supabase (api/diet.ts) — kept
// here too so the optimistic update after editing a meal's time re-sorts
// immediately instead of waiting for the next refetch.
function sortMealSlotsByTime(meals: MealSlot[]): MealSlot[] {
  return [...meals].sort((a, b) => {
    const aHasTime = /^\d{2}:\d{2}$/.test(a.time)
    const bHasTime = /^\d{2}:\d{2}$/.test(b.time)
    if (aHasTime && bHasTime) return a.time.localeCompare(b.time)
    if (aHasTime) return -1
    if (bHasTime) return 1
    return 0
  })
}

function withRecalculatedKcal(option: MealOption): MealOption {
  return { ...option, estimatedKcal: option.foods.reduce((sum, f) => sum + (f.caloriesKcal ?? 0), 0) }
}

export function DietProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id
  const queryClient = useQueryClient()
  const logDate = todayIsoDate()
  const debounceTimers = useRef<Record<string, number>>({})

  const dayTypesKey = useMemo(() => ['diet-day-types', userId] as const, [userId])
  const assignmentsKey = useMemo(() => ['diet-weekday-assignments', userId] as const, [userId])
  const dailyLogKey = useMemo(() => ['diet-daily-log', userId, logDate] as const, [userId, logDate])

  const dayTypesQuery = useQuery({
    queryKey: dayTypesKey,
    queryFn: () => dietApi.fetchDayTypes(userId!),
    enabled: Boolean(userId),
  })

  const assignmentsQuery = useQuery({
    queryKey: assignmentsKey,
    queryFn: () => dietApi.fetchWeekdayAssignments(userId!),
    enabled: Boolean(userId),
  })

  const dailyLogQuery = useQuery({
    queryKey: dailyLogKey,
    queryFn: async () => {
      const rows = await dietApi.fetchDailyLog(userId!, logDate)
      const log: DailyLog = {}
      for (const row of rows) {
        log[row.meal_slot_id] = { selectedOptionId: row.selected_option_id, isDone: row.is_done }
      }
      return log
    },
    enabled: Boolean(userId),
  })

  const dayTypes = dayTypesQuery.data ?? []
  const weekdayAssignments = assignmentsQuery.data ?? {}
  const dailyLog = dailyLogQuery.data ?? {}

  function setDayTypesCache(updater: (current: DietDayType[]) => DietDayType[]) {
    queryClient.setQueryData<DietDayType[]>(dayTypesKey, (current) => (current ? updater(current) : current))
  }

  function invalidateDayTypes() {
    queryClient.invalidateQueries({ queryKey: dayTypesKey })
  }

  function debounced(key: string, fn: () => void) {
    if (debounceTimers.current[key]) window.clearTimeout(debounceTimers.current[key])
    debounceTimers.current[key] = window.setTimeout(fn, DEBOUNCE_MS)
  }

  const value = useMemo<DietContextValue>(
    () => ({
      dayTypes,
      weekdayAssignments,
      dailyLog,
      isLoading: dayTypesQuery.isLoading || assignmentsQuery.isLoading || dailyLogQuery.isLoading,
      isError: dayTypesQuery.isError || assignmentsQuery.isError || dailyLogQuery.isError,

      async addDayType(name) {
        const created = await dietApi.addDayType(userId!, name)
        setDayTypesCache((current) => [...current, created])
        return created
      },

      renameDayType(dayTypeId, name) {
        setDayTypesCache((current) => mapDayType(current, dayTypeId, (dt) => ({ ...dt, name })))
        debounced(`daytype-name:${dayTypeId}`, () => {
          dietApi.renameDayType(dayTypeId, name).catch(invalidateDayTypes)
        })
      },

      async removeDayType(dayTypeId) {
        setDayTypesCache((current) => current.filter((dt) => dt.id !== dayTypeId))
        queryClient.setQueryData<WeekdayAssignments>(assignmentsKey, (current) => {
          if (!current) return current
          const next = { ...current }
          for (const code of Object.keys(next)) {
            if (next[code] === dayTypeId) next[code] = null
          }
          return next
        })
        await dietApi.removeDayType(dayTypeId)
      },

      async duplicateDayType(dayTypeId) {
        const dayType = dayTypes.find((dt) => dt.id === dayTypeId)
        if (!dayType) return
        await dietApi.duplicateDayType(userId!, dayType)
        invalidateDayTypes()
      },

      async assignWeekday(weekdayCode, dayTypeId) {
        queryClient.setQueryData<WeekdayAssignments>(assignmentsKey, (current) => ({
          ...(current ?? {}),
          [weekdayCode]: dayTypeId,
        }))
        await dietApi.assignWeekday(userId!, weekdayCode, dayTypeId)
      },

      async addMealSlot(dayTypeId, input) {
        const dayType = dayTypes.find((dt) => dt.id === dayTypeId)
        if (!dayType) return
        await dietApi.addMealSlot(dayTypeId, dayType.meals.length, input)
        invalidateDayTypes()
      },

      async updateMealSlot(dayTypeId, mealSlotId, input) {
        setDayTypesCache((current) =>
          mapDayType(current, dayTypeId, (dt) => ({
            ...dt,
            meals: sortMealSlotsByTime(
              dt.meals.map((slot) => (slot.id === mealSlotId ? { ...slot, name: input.name, time: input.time } : slot)),
            ),
          })),
        )
        await dietApi.updateMealSlot(mealSlotId, input)
      },

      async removeMealSlot(dayTypeId, mealSlotId) {
        setDayTypesCache((current) =>
          mapDayType(current, dayTypeId, (dt) => ({ ...dt, meals: dt.meals.filter((s) => s.id !== mealSlotId) })),
        )
        await dietApi.removeMealSlot(mealSlotId)
      },

      async addOption(dayTypeId, mealSlotId, input) {
        const dayType = dayTypes.find((dt) => dt.id === dayTypeId)
        const slot = dayType?.meals.find((s) => s.id === mealSlotId)
        if (!slot) return
        await dietApi.addOption(mealSlotId, slot.options.length, input)
        invalidateDayTypes()
      },

      async removeOption(dayTypeId, mealSlotId, optionId) {
        setDayTypesCache((current) =>
          mapDayType(current, dayTypeId, (dt) =>
            mapMealSlot(dt, mealSlotId, (slot) => ({
              ...slot,
              options: slot.options.filter((o) => o.id !== optionId),
            })),
          ),
        )
        await dietApi.removeOption(optionId)
      },

      async addFoodToOption(dayTypeId, mealSlotId, optionId, input) {
        const dayType = dayTypes.find((dt) => dt.id === dayTypeId)
        const slot = dayType?.meals.find((s) => s.id === mealSlotId)
        const option = slot?.options.find((o) => o.id === optionId)
        if (!option) return
        await dietApi.addFoodToOption(optionId, option.foods.length, input)
        invalidateDayTypes()
      },

      updateFood(dayTypeId, mealSlotId, optionId, foodId, input) {
        setDayTypesCache((current) =>
          mapDayType(current, dayTypeId, (dt) =>
            mapMealSlot(dt, mealSlotId, (slot) =>
              mapOption(slot, optionId, (option) =>
                withRecalculatedKcal({
                  ...option,
                  foods: option.foods.map((f) =>
                    f.id === foodId ? { ...f, description: input.description, caloriesKcal: input.caloriesKcal } : f,
                  ),
                }),
              ),
            ),
          ),
        )
        debounced(`food:${foodId}`, () => {
          dietApi.updateFood(foodId, input).catch(invalidateDayTypes)
        })
      },

      async removeFood(dayTypeId, mealSlotId, optionId, foodId) {
        setDayTypesCache((current) =>
          mapDayType(current, dayTypeId, (dt) =>
            mapMealSlot(dt, mealSlotId, (slot) =>
              mapOption(slot, optionId, (option) =>
                withRecalculatedKcal({ ...option, foods: option.foods.filter((f) => f.id !== foodId) }),
              ),
            ),
          ),
        )
        await dietApi.removeFood(foodId)
      },

      selectOption(mealSlotId, optionId) {
        const current = dailyLog[mealSlotId]
        queryClient.setQueryData<DailyLog>(dailyLogKey, (currentLog) => ({
          ...(currentLog ?? {}),
          [mealSlotId]: { isDone: current?.isDone ?? false, selectedOptionId: optionId },
        }))
        dietApi
          .upsertDailyLog(
            userId!,
            logDate,
            mealSlotId,
            { selectedOptionId: optionId },
            { selectedOptionId: current?.selectedOptionId ?? null, isDone: current?.isDone ?? false },
          )
          .catch(() => queryClient.invalidateQueries({ queryKey: dailyLogKey }))
      },

      toggleMealSlotDone(mealSlotId) {
        const current = dailyLog[mealSlotId]
        const nextIsDone = !current?.isDone
        queryClient.setQueryData<DailyLog>(dailyLogKey, (currentLog) => ({
          ...(currentLog ?? {}),
          [mealSlotId]: { selectedOptionId: current?.selectedOptionId ?? null, isDone: nextIsDone },
        }))
        dietApi
          .upsertDailyLog(
            userId!,
            logDate,
            mealSlotId,
            { isDone: nextIsDone },
            { selectedOptionId: current?.selectedOptionId ?? null, isDone: current?.isDone ?? false },
          )
          .catch(() => queryClient.invalidateQueries({ queryKey: dailyLogKey }))
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayTypes, weekdayAssignments, dailyLog, userId, logDate, dayTypesQuery.isLoading, assignmentsQuery.isLoading, dailyLogQuery.isLoading],
  )

  return <DietContext.Provider value={value}>{children}</DietContext.Provider>
}

export function useDiet() {
  const context = useContext(DietContext)
  if (!context) throw new Error('useDiet must be used within a DietProvider')
  return context
}
