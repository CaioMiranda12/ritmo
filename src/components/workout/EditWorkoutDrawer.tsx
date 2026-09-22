import { useState } from 'react'
import { Drawer } from '../ui/Drawer'
import { Button } from '../ui/Button'

const DAY_OPTIONS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM']

export function EditWorkoutDrawer({
  open,
  onClose,
  initialValues,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  initialValues: { name: string; dayLabel: string }
  onSubmit: (input: { name: string; dayLabel: string }) => void
}) {
  const [name, setName] = useState(initialValues.name)
  const [dayLabel, setDayLabel] = useState<string | null>(initialValues.dayLabel || null)

  function handleSubmit() {
    if (!name.trim()) return
    onSubmit({ name: name.trim(), dayLabel: dayLabel ?? '' })
  }

  return (
    <Drawer open={open} title="Editar treino" onClose={onClose}>
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-text" htmlFor="edit-workout-name">
            Nome do treino
          </label>
          <input
            id="edit-workout-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-text focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <span className="text-sm font-medium text-text">Dia da semana</span>
          <span className="ml-1 text-xs text-text-secondary">(opcional)</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {DAY_OPTIONS.map((day) => (
              <button
                key={day}
                onClick={() => setDayLabel((current) => (current === day ? null : day))}
                className={[
                  'rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors',
                  dayLabel === day
                    ? 'border-ink bg-ink text-text-onDark'
                    : 'border-border text-text-secondary hover:bg-surface-muted',
                ].join(' ')}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button fullWidth className="mt-6" disabled={!name.trim()} onClick={handleSubmit}>
        Salvar alterações
      </Button>
    </Drawer>
  )
}
