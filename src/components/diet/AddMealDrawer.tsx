import { useState } from 'react'
import { Drawer } from '../ui/Drawer'
import { Button } from '../ui/Button'

export function AddMealDrawer({
  open,
  onClose,
  onSubmit,
  initialValues,
  title = 'Nova refeição',
  submitLabel = 'Adicionar refeição',
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: { name: string; time: string }) => void
  initialValues?: { name: string; time: string }
  title?: string
  submitLabel?: string
}) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [time, setTime] = useState(initialValues?.time === '--:--' ? '' : initialValues?.time ?? '')

  function reset() {
    setName('')
    setTime('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSubmit() {
    if (!name.trim()) return
    onSubmit({ name: name.trim(), time: time || '--:--' })
    reset()
  }

  return (
    <Drawer open={open} title={title} onClose={handleClose}>
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-text" htmlFor="meal-name">
            Nome da refeição
          </label>
          <input
            id="meal-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Ceia"
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-text" htmlFor="meal-time">
            Horário
          </label>
          <span className="ml-1 text-xs text-text-secondary">(opcional)</span>
          <input
            id="meal-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-text focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <Button fullWidth className="mt-6" disabled={!name.trim()} onClick={handleSubmit}>
        {submitLabel}
      </Button>
    </Drawer>
  )
}
