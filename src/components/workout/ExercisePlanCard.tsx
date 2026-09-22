import { useState } from 'react'
import { ChevronDown, ChevronUp, Timer, X, Plus } from 'lucide-react'
import { ActionMenu } from '../ui/ActionMenu'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useWorkouts } from '../../context/WorkoutsContext'
import type { ExercisePlan } from '../../types'

export function ExercisePlanCard({
  workoutId,
  exercise,
  index,
  isFirst,
  isLast,
}: {
  workoutId: string
  exercise: ExercisePlan
  index: number
  isFirst: boolean
  isLast: boolean
}) {
  const { moveExercise, updateSet, addSetToExercise, removeSetFromExercise, updateExerciseNote, removeExerciseFromWorkout } =
    useWorkouts()
  const [isConfirmingRemoveExercise, setConfirmingRemoveExercise] = useState(false)
  const [confirmingRemoveSetId, setConfirmingRemoveSetId] = useState<string | null>(null)

  return (
    <div className="flex gap-3 border-b border-border py-4 last:border-b-0">
      <div className="mt-1 flex flex-col gap-0.5">
        <button
          onClick={() => moveExercise(workoutId, exercise.id, 'up')}
          disabled={isFirst}
          className="text-text-secondary/60 hover:text-text-secondary disabled:opacity-20"
          aria-label="Mover para cima"
        >
          <ChevronUp size={15} />
        </button>
        <button
          onClick={() => moveExercise(workoutId, exercise.id, 'down')}
          disabled={isLast}
          className="text-text-secondary/60 hover:text-text-secondary disabled:opacity-20"
          aria-label="Mover para baixo"
        >
          <ChevronDown size={15} />
        </button>
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-text-secondary">Exercício {index + 1}</p>
            <h3 className="text-base font-semibold text-text">{exercise.name}</h3>
            <p className="text-sm text-text-secondary">
              {exercise.equipment} · {exercise.muscleGroup}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 whitespace-nowrap text-xs text-text-secondary">
              <Timer size={13} />
              {exercise.restSeconds}s
            </span>
            <ActionMenu
              items={[
                {
                  label: 'Remover exercício',
                  icon: <X size={15} />,
                  destructive: true,
                  onClick: () => setConfirmingRemoveExercise(true),
                },
              ]}
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[1.5rem_1fr_1fr_1.75rem] gap-2 px-0.5 text-[11px] font-medium uppercase tracking-wide text-text-secondary">
          <span>Série</span>
          <span>Reps</span>
          <span>Carga sugerida</span>
          <span />
        </div>
        <div className="mt-1 space-y-1">
          {exercise.sets.map((set, setIndex) => (
            <div key={set.id} className="grid grid-cols-[1.5rem_1fr_1fr_1.75rem] items-center gap-2">
              <span className="text-xs font-medium text-text-secondary">{setIndex + 1}</span>
              <input
                type="number"
                inputMode="numeric"
                value={set.targetReps}
                onChange={(e) => updateSet(workoutId, exercise.id, set.id, 'targetReps', Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm text-text focus:border-primary focus:outline-none"
              />
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="livre"
                  value={set.targetLoadKg ?? ''}
                  onChange={(e) =>
                    updateSet(
                      workoutId,
                      exercise.id,
                      set.id,
                      'targetLoadKg',
                      e.target.value === '' ? null : Number(e.target.value),
                    )
                  }
                  className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 pr-7 text-sm text-text placeholder:text-text-secondary/70 focus:border-primary focus:outline-none"
                />
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-secondary">
                  kg
                </span>
              </div>
              <button
                onClick={() => setConfirmingRemoveSetId(set.id)}
                disabled={exercise.sets.length <= 1}
                className="flex h-9 w-7 items-center justify-center text-text-secondary/60 hover:text-error disabled:opacity-20"
                aria-label="Remover série"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => addSetToExercise(workoutId, exercise.id)}
          className="mt-2 flex items-center gap-1 text-xs font-medium text-primary"
        >
          <Plus size={13} />
          Adicionar série
        </button>

        <input
          value={exercise.note ?? ''}
          onChange={(e) => updateExerciseNote(workoutId, exercise.id, e.target.value)}
          placeholder="Observação sobre o exercício (opcional)"
          className="mt-3 h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
        />
      </div>

      <ConfirmDialog
        open={isConfirmingRemoveExercise}
        title="Remover exercício?"
        description={`"${exercise.name}" e todas as suas séries serão removidos deste treino.`}
        confirmLabel="Remover"
        tone="destructive"
        onConfirm={() => {
          removeExerciseFromWorkout(workoutId, exercise.id)
          setConfirmingRemoveExercise(false)
        }}
        onCancel={() => setConfirmingRemoveExercise(false)}
      />

      <ConfirmDialog
        open={confirmingRemoveSetId !== null}
        title="Remover série?"
        description="Essa série será removida do exercício."
        confirmLabel="Remover"
        tone="destructive"
        onConfirm={() => {
          if (confirmingRemoveSetId) removeSetFromExercise(workoutId, exercise.id, confirmingRemoveSetId)
          setConfirmingRemoveSetId(null)
        }}
        onCancel={() => setConfirmingRemoveSetId(null)}
      />
    </div>
  )
}
