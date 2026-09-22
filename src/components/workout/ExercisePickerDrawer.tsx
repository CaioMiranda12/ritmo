import { useMemo, useRef, useState } from 'react'
import { Search, Plus, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Drawer } from '../ui/Drawer'
import { Button } from '../ui/Button'
import { useExerciseCatalog } from '../../hooks/useExerciseCatalog'

interface ExercisePickerDrawerProps {
  open: boolean
  onClose: () => void
  onConfirm: (exerciseIds: string[]) => void
  /** Exercises already in the workout — shown as added and excluded from selection. */
  alreadyAddedIds?: string[]
}

export function ExercisePickerDrawer({
  open,
  onClose,
  onConfirm,
  alreadyAddedIds = [],
}: ExercisePickerDrawerProps) {
  const { data: catalog = [], isLoading } = useExerciseCatalog()
  const [query, setQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const chipsRef = useRef<HTMLDivElement>(null)

  const muscleGroupOptions = useMemo(
    () => Array.from(new Set(catalog.map((e) => e.muscleGroup))).sort(),
    [catalog],
  )
  // Rough heuristic instead of measuring scroll position (which was proving
  // unreliable to keep in sync on reopen): a drawer this width fits about
  // 4 chips comfortably, so more than that reliably overflows.
  const chipsLikelyOverflow = muscleGroupOptions.length + 1 > 4

  function scrollChips(direction: 'left' | 'right') {
    const el = chipsRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' })
  }

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return catalog.filter((exercise) => {
      const matchesGroup = !activeGroup || exercise.muscleGroup === activeGroup
      const matchesQuery = !normalizedQuery || exercise.name.toLowerCase().includes(normalizedQuery)
      return matchesGroup && matchesQuery
    })
  }, [catalog, query, activeGroup])

  function toggleSelected(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((existingId) => existingId !== id) : [...current, id],
    )
  }

  function handleClose() {
    setQuery('')
    setActiveGroup(null)
    setSelectedIds([])
    onClose()
  }

  function handleConfirm() {
    onConfirm(selectedIds)
    handleClose()
  }

  return (
    <Drawer open={open} title="Adicionar exercícios" onClose={handleClose}>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar exercício..."
          className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
        />
      </div>

      <div className="relative mt-3">
        {chipsLikelyOverflow && (
          <button
            onClick={() => scrollChips('left')}
            className="absolute left-0 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text-secondary shadow-sm hover:text-text sm:flex"
            aria-label="Ver categorias anteriores"
          >
            <ChevronLeft size={15} />
          </button>
        )}

        <div
          ref={chipsRef}
          className={[
            '-mx-5 flex gap-2 overflow-x-auto px-5 pb-1',
            chipsLikelyOverflow ? 'sm:mx-0 sm:px-8' : '',
          ].join(' ')}
          style={{ scrollbarWidth: 'none' }}
        >
          <FilterChip label="Todos" isActive={activeGroup === null} onClick={() => setActiveGroup(null)} />
          {muscleGroupOptions.map((group) => (
            <FilterChip key={group} label={group} isActive={activeGroup === group} onClick={() => setActiveGroup(group)} />
          ))}
        </div>

        {chipsLikelyOverflow && (
          <button
            onClick={() => scrollChips('right')}
            className="absolute right-0 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text-secondary shadow-sm hover:text-text sm:flex"
            aria-label="Ver mais categorias"
          >
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        {isLoading && <p className="py-8 text-center text-sm text-text-secondary">Carregando exercícios...</p>}

        {!isLoading && results.length === 0 && (
          <p className="py-8 text-center text-sm text-text-secondary">
            Nenhum exercício encontrado para essa busca.
          </p>
        )}

        {results.map((exercise) => {
          const isAdded = alreadyAddedIds.includes(exercise.id)
          const isSelected = selectedIds.includes(exercise.id)

          return (
            <button
              key={exercise.id}
              disabled={isAdded}
              onClick={() => toggleSelected(exercise.id)}
              className={[
                'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors',
                isAdded
                  ? 'border-border bg-surface-muted opacity-60'
                  : isSelected
                    ? 'border-primary bg-primary-soft/50'
                    : 'border-border hover:bg-surface-muted',
              ].join(' ')}
            >
              <div>
                <p className="text-sm font-medium text-text">{exercise.name}</p>
                <p className="text-xs text-text-secondary">
                  {exercise.muscleGroup} · {exercise.equipment}
                </p>
              </div>
              {isAdded ? (
                <span className="text-xs font-medium text-text-secondary">Já adicionado</span>
              ) : (
                <span
                  className={[
                    'flex h-7 w-7 items-center justify-center rounded-full border-2',
                    isSelected ? 'border-primary bg-primary text-white' : 'border-border text-transparent',
                  ].join(' ')}
                >
                  {isSelected ? <Check size={14} strokeWidth={3} /> : <Plus size={14} className="text-text-secondary" />}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="sticky bottom-0 -mx-5 mt-4 border-t border-border bg-surface px-5 pt-4">
        <Button fullWidth disabled={selectedIds.length === 0} onClick={handleConfirm}>
          {selectedIds.length > 0
            ? `Adicionar ${selectedIds.length} exercício${selectedIds.length > 1 ? 's' : ''}`
            : 'Selecione ao menos um exercício'}
        </Button>
      </div>
    </Drawer>
  )
}

function FilterChip({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'shrink-0 whitespace-nowrap rounded-pill border px-3.5 py-1.5 text-sm font-medium transition-colors',
        isActive ? 'border-ink bg-ink text-text-onDark' : 'border-border text-text-secondary hover:bg-surface-muted',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
