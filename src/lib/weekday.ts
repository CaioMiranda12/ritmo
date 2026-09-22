// Workouts use 3-letter day labels (SEG/TER/QUA/QUI/SEX/SÁB/DOM), set via
// NewWorkoutDrawer/EditWorkoutDrawer. This is a different scheme from the
// diet's single-letter weekday codes (see lib/mock-data.ts) — the two
// features were built independently and unifying them is out of scope here.

export const WORKOUT_DAY_LABELS_MON_FIRST = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']

// JS Date#getDay(): 0 = Sunday
const WORKOUT_DAY_LABELS_BY_JS_DAY = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

export function getTodayWorkoutDayLabel() {
  return WORKOUT_DAY_LABELS_BY_JS_DAY[new Date().getDay()]
}

export interface CalendarWeekDay {
  dayLabel: string
  displayLetter: string
  date: number
  isToday: boolean
}

/** The current Mon–Sun week, with real calendar dates. */
export function getCurrentCalendarWeek(): CalendarWeekDay[] {
  const today = new Date()
  const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)

  return WORKOUT_DAY_LABELS_MON_FIRST.map((dayLabel, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return {
      dayLabel,
      displayLetter: dayLabel === 'SÁB' ? 'S' : dayLabel[0],
      date: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
    }
  })
}

export function isThisCalendarWeek(isoDate: string) {
  const week = getCurrentCalendarWeek()
  const date = new Date(isoDate)
  const monday = new Date()
  const mondayOffset = monday.getDay() === 0 ? -6 : 1 - monday.getDay()
  monday.setDate(monday.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return date >= monday && date <= sunday && week.length > 0
}
