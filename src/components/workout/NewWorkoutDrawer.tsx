import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Drawer } from '../ui/Drawer'
import { Button } from '../ui/Button'
import { ExercisePickerDrawer } from './ExercisePickerDrawer'
import { useExerciseCatalog } from '../../hooks/useExerciseCatalog'

const DAY_OPTIONS = [
  { code: 'SEG', label: 'Segunda' },
  { code: 'TER', label: 'Terça' },
  { code: 'QUA', label: 'Quarta' },
  { code: 'QUI', label: 'Quinta' },
  { code: 'SEX', label: 'Sexta' },
  { code: 'SÁB', label: 'Sábado' },
  { code: 'DOM', label: 'Domingo' },
]

export function NewWorkoutDrawer({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (input: { name: string; dayLabel: string; catalogExerciseIds: string[] }) => void
}) {
  const [name, setName] = useState('')
  const [dayLabel, setDayLabel] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPickerOpen, setPickerOpen] = useState(false)

  function reset() {
    setName('')
    setDayLabel(null)
    setSelectedIds([])
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleCreate() {
    onCreate({ name: name.trim(), dayLabel: dayLabel ?? '', catalogExerciseIds: selectedIds })
    reset()
  }

  const { data: catalog = [] } = useExerciseCatalog()
  const selectedExercises = catalog.filter((e) => selectedIds.includes(e.id))

  return (
    <>
      <Drawer open={open} title="Novo treino" onClose={handleClose}>
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-text" htmlFor="workout-name">
              Nome do treino
            </label>
            <input
              id="workout-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Peito + tríceps"
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <span className="text-sm font-medium text-text">Dia da semana</span>
            <span className="ml-1 text-xs text-text-secondary">(opcional)</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => (
                <button
                  key={day.code}
                  onClick={() => setDayLabel((current) => (current === day.code ? null : day.code))}
                  className={[
                    'rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors',
                    dayLabel === day.code
                      ? 'border-ink bg-ink text-text-onDark'
                      : 'border-border text-text-secondary hover:bg-surface-muted',
                  ].join(' ')}
                >
                  {day.code}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text">Exercícios</span>
              <button onClick={() => setPickerOpen(true)} className="flex items-center gap-1 text-sm font-medium text-primary">
                <Plus size={15} />
                Selecionar
              </button>
            </div>

            {selectedExercises.length === 0 ? (
              <p className="mt-2 text-sm text-text-secondary">
                Nenhum exercício selecionado ainda. Você também pode adicionar depois, na tela do treino.
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {selectedExercises.map((exercise) => {
                  return (
                    <li
                      key={exercise.id}
                      className="flex items-center justify-between rounded-xl bg-surface-muted px-3.5 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-text">{exercise.name}</p>
                        <p className="text-xs text-text-secondary">{exercise.muscleGroup}</p>
                      </div>
                      <button
                        onClick={() => setSelectedIds((current) => current.filter((id) => id !== exercise.id))}
                        className="text-text-secondary hover:text-error"
                        aria-label={`Remover ${exercise.name}`}
                      >
                        <X size={16} />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 -mx-5 mt-6 border-t border-border bg-surface px-5 pt-4">
          <Button fullWidth disabled={name.trim().length === 0} onClick={handleCreate}>
            Criar treino
          </Button>
        </div>
      </Drawer>

      <ExercisePickerDrawer
        open={isPickerOpen}
        onClose={() => setPickerOpen(false)}
        alreadyAddedIds={selectedIds}
        onConfirm={(ids) => setSelectedIds((current) => [...current, ...ids])}
      />
    </>
  )
}
