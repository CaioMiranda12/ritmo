import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { MealSlot } from '../../types'

export function TodayMealSlotCard({
  slot,
  selectedOptionId,
  isDone,
  defaultOpen = false,
  onSelectOption,
  onToggleDone,
}: {
  slot: MealSlot
  selectedOptionId: string | null | undefined
  isDone: boolean
  defaultOpen?: boolean
  onSelectOption: (optionId: string) => void
  onToggleDone: () => void
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const hasMultipleOptions = slot.options.length > 1
  const activeOption = slot.options.find((o) => o.id === selectedOptionId) ?? slot.options[0]

  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleDone}
          disabled={!activeOption}
          aria-pressed={isDone}
          aria-label={isDone ? `Marcar ${slot.name} como não concluída` : `Marcar ${slot.name} como concluída`}
          className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:opacity-40',
            isDone ? 'border-primary bg-primary text-white' : 'border-border text-transparent hover:border-primary/40',
          ].join(' ')}
        >
          <Check size={16} strokeWidth={3} />
        </button>

        <button className="flex flex-1 items-center justify-between text-left" onClick={() => setIsOpen((v) => !v)}>
          <div>
            <p className={['font-medium', isDone ? 'text-text-secondary line-through' : 'text-text'].join(' ')}>
              {slot.name}
            </p>
            <p className="text-sm text-text-secondary">
              {slot.time}
              {activeOption ? ` · ${activeOption.name} · ${activeOption.estimatedKcal} kcal` : ' · sem opções'}
            </p>
          </div>
          <ChevronDown size={18} className={['text-text-secondary transition-transform', isOpen ? 'rotate-180' : ''].join(' ')} />
        </button>
      </div>

      {isOpen && (
        <div className="mb-1 ml-12 mt-3 rounded-xl bg-surface-muted p-4">
          {hasMultipleOptions && (
            <div className="mb-3 flex flex-wrap gap-2">
              {slot.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onSelectOption(option.id)}
                  className={[
                    'rounded-pill border px-3 py-1.5 text-xs font-medium transition-colors',
                    option.id === activeOption?.id
                      ? 'border-ink bg-ink text-text-onDark'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-muted',
                  ].join(' ')}
                >
                  {option.name}
                </button>
              ))}
            </div>
          )}

          {activeOption ? (
            <ul className="space-y-2 text-sm text-text">
              {activeOption.foods.map((food) => (
                <li key={food.id} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {food.description}
                  </span>
                  {food.caloriesKcal != null && (
                    <span className="text-xs text-text-secondary">{food.caloriesKcal} kcal</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">
              Nenhuma opção cadastrada para essa refeição ainda.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
