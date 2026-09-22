import { getCurrentCalendarWeek } from '../../lib/weekday'
import { useWorkouts } from '../../context/WorkoutsContext'

export function WeekStrip() {
  const { workouts } = useWorkouts()
  const week = getCurrentCalendarWeek()

  return (
    <div className="grid grid-cols-7 gap-1.5 rounded-card border border-border bg-surface p-3">
      {week.map((day) => {
        const hasWorkout = workouts.some((w) => w.dayLabel === day.dayLabel)
        return (
          <div key={day.dayLabel} className="flex flex-col items-center gap-1.5 py-1">
            <span className="text-[11px] font-medium uppercase text-text-secondary">{day.displayLetter}</span>
            <div
              className={[
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                day.isToday ? 'bg-ink text-text-onDark' : 'text-text',
              ].join(' ')}
            >
              {day.date}
            </div>
            <span
              className={[
                'h-1 w-1 rounded-full',
                hasWorkout ? (day.isToday ? 'bg-accent' : 'bg-primary') : 'bg-transparent',
              ].join(' ')}
            />
          </div>
        )
      })}
    </div>
  )
}
