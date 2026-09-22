import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'
import { Card } from '../ui/Card'
import { Skeleton } from '../ui/Skeleton'
import { getCurrentCalendarWeek } from '../../lib/weekday'
import { fetchSessionsThisWeekCount } from '../../api/sessions'
import { useAuth } from '../../context/AuthContext'
import { useWorkouts } from '../../context/WorkoutsContext'

const WEEKLY_GOAL_TARGET = 4

export function WeeklyFrequency() {
  const { session } = useAuth()
  const userId = session?.user.id
  const { workouts } = useWorkouts()
  const week = getCurrentCalendarWeek()

  const { data: completed, isLoading } = useQuery({
    queryKey: ['sessions-this-week-count', userId],
    queryFn: () => fetchSessionsThisWeekCount(userId!),
    enabled: Boolean(userId),
  })

  const remaining = WEEKLY_GOAL_TARGET - (completed ?? 0)

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-text">Seu ritmo</h3>
        <TrendingUp size={16} className="text-primary" />
      </div>

      {isLoading ? (
        <Skeleton className="mt-3 h-10 w-32" />
      ) : (
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="text-4xl font-bold text-text">{completed}</span>
          <span className="text-sm text-text-secondary">treinos esta semana</span>
        </p>
      )}

      <div className="mt-4 grid grid-cols-7 gap-2">
        {week.map((day) => {
          const hasWorkout = workouts.some((w) => w.dayLabel === day.dayLabel)
          return <div key={day.dayLabel} className={['h-9 rounded-lg', hasWorkout ? 'bg-primary' : 'bg-surface-muted'].join(' ')} />
        })}
      </div>

      {!isLoading && (
        <p className="mt-3 text-sm text-text-secondary">
          {remaining > 0
            ? `Você está a ${remaining} treino${remaining > 1 ? 's' : ''} da meta semanal.`
            : 'Meta semanal concluída. Bom trabalho!'}
        </p>
      )}
    </Card>
  )
}
