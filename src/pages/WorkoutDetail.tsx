import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Play, Copy, Archive, Plus, Pencil } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ExercisePickerDrawer } from '../components/workout/ExercisePickerDrawer'
import { ExercisePlanCard } from '../components/workout/ExercisePlanCard'
import { EditWorkoutDrawer } from '../components/workout/EditWorkoutDrawer'
import { WorkoutDetailSkeleton } from '../components/workout/WorkoutDetailSkeleton'
import { useWorkouts } from '../context/WorkoutsContext'

export function WorkoutDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { workouts, isLoading, isError, addExercisesToWorkout, duplicateWorkout, archiveWorkout, updateWorkoutMeta } =
    useWorkouts()
  const [isPickerOpen, setPickerOpen] = useState(false)
  const [isEditOpen, setEditOpen] = useState(false)
  const [isConfirmingArchive, setConfirmingArchive] = useState(false)
  const workout = workouts.find((w) => w.id === id)

  if (isLoading) return <WorkoutDetailSkeleton />

  if (isError) {
    return <ErrorState title="Não foi possível carregar esse treino" onRetry={() => window.location.reload()} />
  }

  if (!workout) {
    return (
      <EmptyState
        title="Treino não encontrado"
        description="Esse treino pode ter sido removido ou arquivado."
        action={
          <Button variant="ghost" onClick={() => navigate('/treinos')}>
            Voltar para treinos
          </Button>
        }
      />
    )
  }

  const hasExercises = workout.exercises.length > 0

  // Exercises already on this workout, by their stable catalog link — used
  // to exclude them from the picker so they can't be added twice.
  const alreadyAddedCatalogIds = workout.exercises
    .map((e) => e.catalogExerciseId)
    .filter((catalogId): catalogId is string => Boolean(catalogId))

  return (
    <div className="space-y-6">
      <Link to="/treinos" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary">
        <ArrowLeft size={16} />
        Treinos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-text-secondary">{workout.dayLabel || 'Sem dia definido'}</p>
            <button
              onClick={() => setEditOpen(true)}
              className="text-text-secondary hover:text-text"
              aria-label="Editar treino"
            >
              <Pencil size={13} />
            </button>
          </div>
          <h1 className="mt-1 text-3xl font-semibold text-text">{workout.name}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {workout.exerciseCount} exercícios · {workout.setCount} séries
            {workout.estimatedMinutes > 0 ? ` · ≈ ${workout.estimatedMinutes} min` : ''}
          </p>
        </div>
        <Button
          icon={<Play size={16} fill="currentColor" />}
          disabled={!hasExercises}
          onClick={() => navigate(`/execucao/${workout.id}`)}
        >
          Iniciar treino
        </Button>
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" icon={<Copy size={14} />} onClick={() => duplicateWorkout(workout.id)}>
          Duplicar
        </Button>
        <Button variant="ghost" size="sm" icon={<Archive size={14} />} onClick={() => setConfirmingArchive(true)}>
          Arquivar
        </Button>
      </div>

      <Card padding="none" className="px-5">
        <div className="flex items-center justify-between py-4">
          <h2 className="font-semibold text-text">Exercícios</h2>
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1 text-sm font-medium text-primary"
          >
            <Plus size={15} />
            Adicionar
          </button>
        </div>

        {hasExercises ? (
          workout.exercises.map((exercise, index) => (
            <ExercisePlanCard
              key={exercise.id}
              workoutId={workout.id}
              exercise={exercise}
              index={index}
              isFirst={index === 0}
              isLast={index === workout.exercises.length - 1}
            />
          ))
        ) : (
          <div className="pb-5">
            <EmptyState
              title="Nenhum exercício ainda"
              description="Adicione exercícios para poder iniciar esse treino."
              action={
                <Button size="sm" icon={<Plus size={14} />} onClick={() => setPickerOpen(true)}>
                  Adicionar exercício
                </Button>
              }
            />
          </div>
        )}
      </Card>

      <ExercisePickerDrawer
        open={isPickerOpen}
        onClose={() => setPickerOpen(false)}
        alreadyAddedIds={alreadyAddedCatalogIds}
        onConfirm={(ids) => addExercisesToWorkout(workout.id, ids)}
      />

      <EditWorkoutDrawer
        open={isEditOpen}
        onClose={() => setEditOpen(false)}
        initialValues={{ name: workout.name, dayLabel: workout.dayLabel }}
        onSubmit={(input) => {
          updateWorkoutMeta(workout.id, input)
          setEditOpen(false)
        }}
      />

      <ConfirmDialog
        open={isConfirmingArchive}
        title="Arquivar treino?"
        description="O treino sai da sua lista ativa, mas o histórico de sessões realizadas continua disponível no Progresso."
        confirmLabel="Arquivar"
        tone="destructive"
        onConfirm={() => {
          archiveWorkout(workout.id)
          setConfirmingArchive(false)
          navigate('/treinos')
        }}
        onCancel={() => setConfirmingArchive(false)}
      />
    </div>
  )
}
