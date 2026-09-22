import { useState } from 'react'
import { ChevronDown, Plus, X, Trash2, Pencil, Check } from 'lucide-react'
import { ActionMenu } from '../ui/ActionMenu'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useDiet } from '../../context/DietContext'
import type { MealSlot, FoodItem } from '../../types'

export function MealSlotEditor({
  dayTypeId,
  slot,
  onEditMeta,
}: {
  dayTypeId: string
  slot: MealSlot
  onEditMeta: () => void
}) {
  const { removeMealSlot, addOption, removeOption, addFoodToOption, updateFood, removeFood } = useDiet()
  const [isOpen, setIsOpen] = useState(false)
  const [isAddingOption, setIsAddingOption] = useState(false)
  const [optionName, setOptionName] = useState('')
  const [addingFoodFor, setAddingFoodFor] = useState<string | null>(null)
  const [foodDescription, setFoodDescription] = useState('')
  const [foodKcal, setFoodKcal] = useState('')
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editKcal, setEditKcal] = useState('')
  const [isConfirmingRemoveSlot, setConfirmingRemoveSlot] = useState(false)
  const [confirmingRemoveOption, setConfirmingRemoveOption] = useState<{ id: string; name: string } | null>(null)
  const [confirmingRemoveFood, setConfirmingRemoveFood] = useState<{
    optionId: string
    id: string
    description: string
  } | null>(null)

  function handleAddOption() {
    if (!optionName.trim()) return
    addOption(dayTypeId, slot.id, { name: optionName.trim() })
    setOptionName('')
    setIsAddingOption(false)
  }

  function handleAddFood(optionId: string) {
    if (!foodDescription.trim()) return
    addFoodToOption(dayTypeId, slot.id, optionId, {
      description: foodDescription.trim(),
      caloriesKcal: foodKcal.trim() ? Number(foodKcal) : null,
    })
    setFoodDescription('')
    setFoodKcal('')
    setAddingFoodFor(null)
  }

  function startEditingFood(food: FoodItem) {
    setEditingFoodId(food.id)
    setEditDescription(food.description)
    setEditKcal(food.caloriesKcal != null ? String(food.caloriesKcal) : '')
  }

  function saveEditingFood(optionId: string) {
    if (!editingFoodId || !editDescription.trim()) return
    updateFood(dayTypeId, slot.id, optionId, editingFoodId, {
      description: editDescription.trim(),
      caloriesKcal: editKcal.trim() ? Number(editKcal) : null,
    })
    setEditingFoodId(null)
  }

  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center gap-2 px-3.5 py-3">
        <button className="flex flex-1 items-center justify-between text-left" onClick={() => setIsOpen((v) => !v)}>
          <div>
            <p className="text-sm font-medium text-text">{slot.name}</p>
            <p className="text-xs text-text-secondary">
              {slot.time} · {slot.options.length} opç{slot.options.length === 1 ? 'ão' : 'ões'}
            </p>
          </div>
          <ChevronDown size={16} className={['text-text-secondary transition-transform', isOpen ? 'rotate-180' : ''].join(' ')} />
        </button>
        <ActionMenu
          items={[
            { label: 'Editar refeição', icon: <Pencil size={14} />, onClick: onEditMeta },
            {
              label: 'Remover refeição',
              icon: <Trash2 size={14} />,
              destructive: true,
              onClick: () => setConfirmingRemoveSlot(true),
            },
          ]}
        />
      </div>

      {isOpen && (
        <div className="space-y-2 border-t border-border p-3.5">
          {slot.options.map((option) => (
            <div key={option.id} className="rounded-lg bg-surface-muted p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-text">{option.name}</p>
                  <p className="text-xs text-text-secondary">
                    {option.estimatedKcal > 0 ? `≈ ${option.estimatedKcal} kcal` : 'Sem kcal informado'}
                  </p>
                </div>
                <button
                  onClick={() => setConfirmingRemoveOption({ id: option.id, name: option.name })}
                  className="text-text-secondary hover:text-error"
                  aria-label={`Remover opção ${option.name}`}
                >
                  <X size={15} />
                </button>
              </div>

              {option.foods.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {option.foods.map((food) =>
                    editingFoodId === food.id ? (
                      <li key={food.id} className="space-y-1.5 rounded-lg bg-surface p-2">
                        <input
                          autoFocus
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveEditingFood(option.id)}
                          className="h-8 w-full rounded-lg border border-border bg-surface px-2.5 text-xs text-text focus:border-primary focus:outline-none"
                        />
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={editKcal}
                            onChange={(e) => setEditKcal(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveEditingFood(option.id)}
                            placeholder="kcal (opcional)"
                            className="h-8 flex-1 rounded-lg border border-border bg-surface px-2.5 text-xs text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
                          />
                          <button
                            onClick={() => saveEditingFood(option.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-text-onDark"
                            aria-label="Salvar alimento"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setEditingFoodId(null)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary"
                            aria-label="Cancelar edição"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </li>
                    ) : (
                      <li key={food.id} className="flex items-center justify-between gap-2 text-xs text-text-secondary">
                        <span className="flex-1">
                          • {food.description}
                          {food.caloriesKcal != null && <span className="ml-1.5">({food.caloriesKcal} kcal)</span>}
                        </span>
                        <button
                          onClick={() => startEditingFood(food)}
                          className="text-text-secondary hover:text-text"
                          aria-label={`Editar ${food.description}`}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmingRemoveFood({ optionId: option.id, id: food.id, description: food.description })
                          }
                          className="text-text-secondary hover:text-error"
                          aria-label={`Remover ${food.description}`}
                        >
                          <X size={13} />
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              )}

              {addingFoodFor === option.id ? (
                <div className="mt-2 space-y-1.5">
                  <input
                    autoFocus
                    value={foodDescription}
                    onChange={(e) => setFoodDescription(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFood(option.id)}
                    placeholder="Ex.: 150 g de arroz"
                    className="h-8 w-full rounded-lg border border-border bg-surface px-2.5 text-xs text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={foodKcal}
                      onChange={(e) => setFoodKcal(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddFood(option.id)}
                      placeholder="kcal (opcional)"
                      className="h-8 flex-1 rounded-lg border border-border bg-surface px-2.5 text-xs text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
                    />
                    <button
                      onClick={() => handleAddFood(option.id)}
                      className="rounded-lg bg-ink px-2.5 text-xs font-medium text-text-onDark"
                    >
                      OK
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingFoodFor(option.id)}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-primary"
                >
                  <Plus size={12} />
                  Adicionar alimento
                </button>
              )}
            </div>
          ))}

          {isAddingOption ? (
            <div className="flex gap-1.5 rounded-lg border border-dashed border-border p-3">
              <input
                autoFocus
                value={optionName}
                onChange={(e) => setOptionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                placeholder="Nome da opção (ex.: Frango grelhado)"
                className="h-9 flex-1 rounded-lg border border-border bg-surface px-2.5 text-sm text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
              />
              <button onClick={handleAddOption} className="rounded-lg bg-ink px-3 text-sm font-medium text-text-onDark">
                Adicionar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingOption(true)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              <Plus size={14} />
              Nova opção
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={isConfirmingRemoveSlot}
        title="Remover refeição?"
        description={`"${slot.name}" e todas as suas opções e alimentos serão removidos.`}
        confirmLabel="Remover"
        tone="destructive"
        onConfirm={() => {
          removeMealSlot(dayTypeId, slot.id)
          setConfirmingRemoveSlot(false)
        }}
        onCancel={() => setConfirmingRemoveSlot(false)}
      />

      <ConfirmDialog
        open={confirmingRemoveOption !== null}
        title="Remover opção?"
        description={
          confirmingRemoveOption
            ? `"${confirmingRemoveOption.name}" e seus alimentos serão removidos dessa refeição.`
            : ''
        }
        confirmLabel="Remover"
        tone="destructive"
        onConfirm={() => {
          if (confirmingRemoveOption) removeOption(dayTypeId, slot.id, confirmingRemoveOption.id)
          setConfirmingRemoveOption(null)
        }}
        onCancel={() => setConfirmingRemoveOption(null)}
      />

      <ConfirmDialog
        open={confirmingRemoveFood !== null}
        title="Remover alimento?"
        description={confirmingRemoveFood ? `"${confirmingRemoveFood.description}" será removido da opção.` : ''}
        confirmLabel="Remover"
        tone="destructive"
        onConfirm={() => {
          if (confirmingRemoveFood) {
            removeFood(dayTypeId, slot.id, confirmingRemoveFood.optionId, confirmingRemoveFood.id)
          }
          setConfirmingRemoveFood(null)
        }}
        onCancel={() => setConfirmingRemoveFood(null)}
      />
    </div>
  )
}
