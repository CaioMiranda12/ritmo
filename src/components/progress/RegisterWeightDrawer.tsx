import { useState } from 'react'
import { Drawer } from '../ui/Drawer'
import { Button } from '../ui/Button'

export function RegisterWeightDrawer({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (weightKg: number) => void
}) {
  const [value, setValue] = useState('')
  const parsed = Number(value.replace(',', '.'))
  const isValid = value.trim().length > 0 && !Number.isNaN(parsed) && parsed > 0

  function handleClose() {
    setValue('')
    onClose()
  }

  function handleSubmit() {
    if (!isValid) return
    onSubmit(parsed)
    setValue('')
  }

  return (
    <Drawer open={open} title="Registrar peso" onClose={handleClose}>
      <label className="text-sm font-medium text-text" htmlFor="weight-input">
        Peso de hoje
      </label>
      <div className="relative mt-1.5">
        <input
          id="weight-input"
          autoFocus
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="78,4"
          className="h-12 w-full rounded-xl border border-border bg-surface px-4 pr-12 text-lg font-medium text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-secondary">
          kg
        </span>
      </div>
      <p className="mt-2 text-xs text-text-secondary">O registro é salvo com a data de hoje.</p>

      <Button fullWidth className="mt-6" disabled={!isValid} onClick={handleSubmit}>
        Salvar peso
      </Button>
    </Drawer>
  )
}
