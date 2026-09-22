import { supabase } from '../lib/supabase'
import type { DietDayType, MealSlot, MealOption, FoodItem, WeekdayAssignments } from '../types'

// --- DB row shapes ---

interface FoodRow {
  id: string
  description: string
  calories_kcal: number | null
  position: number
}

interface OptionRow {
  id: string
  name: string
  position: number
  diet_meal_option_foods: FoodRow[]
}

interface SlotRow {
  id: string
  name: string
  time: string
  position: number
  diet_meal_options: OptionRow[]
}

interface DayTypeRow {
  id: string
  name: string
  diet_meal_slots: SlotRow[]
}

const DAY_TYPE_SELECT = '*, diet_meal_slots(*, diet_meal_options(*, diet_meal_option_foods(*)))'

function toFoodItem(row: FoodRow): FoodItem {
  return { id: row.id, description: row.description, caloriesKcal: row.calories_kcal }
}

function toMealOption(row: OptionRow): MealOption {
  const foods = [...row.diet_meal_option_foods].sort((a, b) => a.position - b.position).map(toFoodItem)
  return {
    id: row.id,
    name: row.name,
    // Computed from each food's own (optional) calories — not a separately
    // typed number, so there's nothing for it to drift out of sync with.
    estimatedKcal: foods.reduce((sum, food) => sum + (food.caloriesKcal ?? 0), 0),
    foods,
  }
}

function compareByTime(a: { time: string; position: number }, b: { time: string; position: number }) {
  const aHasTime = /^\d{2}:\d{2}$/.test(a.time)
  const bHasTime = /^\d{2}:\d{2}$/.test(b.time)
  if (aHasTime && bHasTime) return a.time.localeCompare(b.time)
  if (aHasTime) return -1
  if (bHasTime) return 1
  return a.position - b.position // both unscheduled — fall back to creation order
}

function toMealSlot(row: SlotRow): MealSlot {
  return {
    id: row.id,
    name: row.name,
    time: row.time,
    options: [...row.diet_meal_options].sort((a, b) => a.position - b.position).map(toMealOption),
  }
}

function toDayType(row: DayTypeRow): DietDayType {
  return {
    id: row.id,
    name: row.name,
    meals: [...row.diet_meal_slots].sort(compareByTime).map(toMealSlot),
  }
}

export async function fetchDayTypes(userId: string): Promise<DietDayType[]> {
  const { data, error } = await supabase
    .from('diet_day_types')
    .select(DAY_TYPE_SELECT)
    .eq('user_id', userId)
    .order('name')

  if (error) throw error
  return ((data ?? []) as unknown as DayTypeRow[]).map(toDayType)
}

export async function fetchWeekdayAssignments(userId: string): Promise<WeekdayAssignments> {
  const { data, error } = await supabase
    .from('diet_weekday_assignments')
    .select('weekday_code, day_type_id')
    .eq('user_id', userId)

  if (error) throw error

  const assignments: WeekdayAssignments = {}
  for (const row of data ?? []) {
    assignments[row.weekday_code] = row.day_type_id
  }
  return assignments
}

export async function addDayType(userId: string, name: string) {
  const { data, error } = await supabase
    .from('diet_day_types')
    .insert({ user_id: userId, name })
    .select(DAY_TYPE_SELECT)
    .single()
  if (error) throw error
  return toDayType(data as unknown as DayTypeRow)
}

export async function renameDayType(dayTypeId: string, name: string) {
  const { error } = await supabase.from('diet_day_types').update({ name }).eq('id', dayTypeId)
  if (error) throw error
}

export async function removeDayType(dayTypeId: string) {
  const { error } = await supabase.from('diet_day_types').delete().eq('id', dayTypeId)
  if (error) throw error
}

export async function duplicateDayType(userId: string, dayType: DietDayType) {
  const { data: newDayType, error: dayTypeError } = await supabase
    .from('diet_day_types')
    .insert({ user_id: userId, name: `${dayType.name} (cópia)` })
    .select()
    .single()
  if (dayTypeError) throw dayTypeError

  for (const [slotIndex, slot] of dayType.meals.entries()) {
    const { data: newSlot, error: slotError } = await supabase
      .from('diet_meal_slots')
      .insert({ day_type_id: newDayType.id, name: slot.name, time: slot.time, position: slotIndex })
      .select()
      .single()
    if (slotError) throw slotError

    for (const [optionIndex, option] of slot.options.entries()) {
      const { data: newOption, error: optionError } = await supabase
        .from('diet_meal_options')
        .insert({ meal_slot_id: newSlot.id, name: option.name, position: optionIndex })
        .select()
        .single()
      if (optionError) throw optionError

      if (option.foods.length > 0) {
        const { error: foodsError } = await supabase.from('diet_meal_option_foods').insert(
          option.foods.map((food, foodIndex) => ({
            option_id: newOption.id,
            description: food.description,
            calories_kcal: food.caloriesKcal ?? null,
            position: foodIndex,
          })),
        )
        if (foodsError) throw foodsError
      }
    }
  }
}

export async function assignWeekday(userId: string, weekdayCode: string, dayTypeId: string | null) {
  const { error } = await supabase
    .from('diet_weekday_assignments')
    .upsert({ user_id: userId, weekday_code: weekdayCode, day_type_id: dayTypeId }, { onConflict: 'user_id,weekday_code' })
  if (error) throw error
}

export async function addMealSlot(dayTypeId: string, position: number, input: { name: string; time: string }) {
  const { error } = await supabase
    .from('diet_meal_slots')
    .insert({ day_type_id: dayTypeId, name: input.name, time: input.time, position })
  if (error) throw error
}

export async function updateMealSlot(mealSlotId: string, input: { name: string; time: string }) {
  const { error } = await supabase
    .from('diet_meal_slots')
    .update({ name: input.name, time: input.time })
    .eq('id', mealSlotId)
  if (error) throw error
}

export async function removeMealSlot(mealSlotId: string) {
  const { error } = await supabase.from('diet_meal_slots').delete().eq('id', mealSlotId)
  if (error) throw error
}

export async function addOption(mealSlotId: string, position: number, input: { name: string }) {
  const { error } = await supabase
    .from('diet_meal_options')
    .insert({ meal_slot_id: mealSlotId, name: input.name, position })
  if (error) throw error
}

export async function removeOption(optionId: string) {
  const { error } = await supabase.from('diet_meal_options').delete().eq('id', optionId)
  if (error) throw error
}

export async function addFoodToOption(
  optionId: string,
  position: number,
  input: { description: string; caloriesKcal?: number | null },
) {
  const { error } = await supabase.from('diet_meal_option_foods').insert({
    option_id: optionId,
    description: input.description,
    calories_kcal: input.caloriesKcal ?? null,
    position,
  })
  if (error) throw error
}

export async function updateFood(foodId: string, input: { description: string; caloriesKcal?: number | null }) {
  const { error } = await supabase
    .from('diet_meal_option_foods')
    .update({ description: input.description, calories_kcal: input.caloriesKcal ?? null })
    .eq('id', foodId)
  if (error) throw error
}

export async function removeFood(foodId: string) {
  const { error } = await supabase.from('diet_meal_option_foods').delete().eq('id', foodId)
  if (error) throw error
}

// --- Daily log ("today") ---

export interface DailyLogRow {
  meal_slot_id: string
  selected_option_id: string | null
  is_done: boolean
}

export async function fetchDailyLog(userId: string, logDate: string): Promise<DailyLogRow[]> {
  const { data, error } = await supabase
    .from('diet_daily_log')
    .select('meal_slot_id, selected_option_id, is_done')
    .eq('user_id', userId)
    .eq('log_date', logDate)

  if (error) throw error
  return data ?? []
}

export async function upsertDailyLog(
  userId: string,
  logDate: string,
  mealSlotId: string,
  patch: { selectedOptionId?: string; isDone?: boolean },
  current: { selectedOptionId: string | null; isDone: boolean },
) {
  const { error } = await supabase.from('diet_daily_log').upsert(
    {
      user_id: userId,
      log_date: logDate,
      meal_slot_id: mealSlotId,
      selected_option_id: patch.selectedOptionId ?? current.selectedOptionId,
      is_done: patch.isDone ?? current.isDone,
    },
    { onConflict: 'user_id,log_date,meal_slot_id' },
  )
  if (error) throw error
}
