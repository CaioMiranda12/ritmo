import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Dumbbell } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { WorkoutCard } from '../components/workout/WorkoutCard'
import { WorkoutsSkeleton } from '../components/workout/WorkoutsSkeleton'
import { NewWorkoutDrawer } from '../components/workout/NewWorkoutDrawer'
import { getCurrentCalendarWeek } from '../lib/weekday'
import { useWorkouts } from '../context/WorkoutsContext'
import { useAuth } from '../context/AuthContext'

export function Workouts() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const { workouts, isLoading, isError, addWorkout, addExercisesToWorkout } = useWorkouts()
  const [isCreateOpen, setCreateOpen] = useState(false)
  const hasWorkouts = workouts.length > 0
  const week = getCurrentCalendarWeek()
  const activeDays = week.filter((d) => workouts.some((w) => w.dayLabel === d.dayLabel))

  async function handleCreate({
    name,
    dayLabel,
    catalogExerciseIds,
  }: {
    name: string
    dayLabel: string
    catalogExerciseIds: string[]
  }) {
    const newWorkout = await addWorkout({ name, dayLabel })
    if (catalogExerciseIds.length > 0) {
      await addExercisesToWorkout(newWorkout.id, catalogExerciseIds)
    }
    setCreateOpen(false)
    navigate(`/treinos/${newWorkout.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">Sua rotina</p>
          <h1 className="mt-1 text-3xl font-semibold text-text">Treinos</h1>
        </div>
        <Button icon={<Plus size={16} />} variant="secondary" onClick={() => setCreateOpen(true)}>
          Novo treino
        </Button>
      </div>

      {isLoading && <WorkoutsSkeleton />}

      {!isLoading && isError && (
        <ErrorState
          title="Não foi possível carregar seus treinos"
          onRetry={() => queryClient.invalidateQueries({ queryKey: ['workouts', session?.user.id] })}
        />
      )}

      {!isLoading && !isError && !hasWorkouts && (
        <EmptyState
          icon={<Dumbbell size={22} />}
          title="Você ainda não tem treinos"
          description="Crie seu primeiro treino para montar sua rotina da semana."
          action={
            <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
              Criar treino
            </Button>
          }
        />
      )}

      {!isLoading && !isError && hasWorkouts && (
        <>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-text">Rotina semanal</h2>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {workouts.length} treinos
                  {activeDays.length > 0
                    ? ` · ${activeDays.map((d) => d.displayLetter).join(', ')}`
                    : ' · nenhum dia definido ainda'}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-1.5">
              {week.map((day) => {
                const hasWorkout = workouts.some((w) => w.dayLabel === day.dayLabel)
                return (
                  <div key={day.dayLabel} className="flex flex-col items-center gap-1">
                    <span className="text-[11px] font-medium uppercase text-text-secondary">{day.displayLetter}</span>
                    <div
                      className={[
                        'flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold',
                        day.isToday ? 'ring-1 ring-primary' : '',
                        hasWorkout ? 'bg-primary-soft text-primary' : 'bg-surface-muted text-text-secondary',
                      ].join(' ')}
                    >
                      {hasWorkout ? '●' : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-text">Seus treinos</h2>
              <span className="text-sm text-text-secondary">{workouts.length} ativos</span>
            </div>
            <div className="space-y-4">
              {workouts.map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
            </div>
          </div>
        </>
      )}

      <NewWorkoutDrawer open={isCreateOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
    </div>
  )
}
