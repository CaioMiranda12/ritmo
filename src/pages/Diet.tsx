import { useState } from 'react'
import { Settings2, UtensilsCrossed } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { TodayMealSlotCard } from '../components/diet/TodayMealSlotCard'
import { DietPlansDrawer } from '../components/diet/DietPlansDrawer'
import { DietSkeleton } from '../components/diet/DietSkeleton'
import { getTodayWeekdayCode } from '../lib/mock-data'
import { useDiet } from '../context/DietContext'

export function Diet() {
  const { dayTypes, weekdayAssignments, dailyLog, selectOption, toggleMealSlotDone, isLoading, isError } = useDiet()
  const [isManageOpen, setManageOpen] = useState(false)

  const todayCode = getTodayWeekdayCode()
  const todayDayType = dayTypes.find((dt) => dt.id === weekdayAssignments[todayCode])
  const mealSlots = todayDayType?.meals ?? []

  const doneCount = mealSlots.filter((slot) => dailyLog[slot.id]?.isDone).length
  const adherence = mealSlots.length > 0 ? (doneCount / mealSlots.length) * 100 : 0

  const totalKcal = mealSlots.reduce((sum, slot) => {
    const selectedId = dailyLog[slot.id]?.selectedOptionId
    const option = slot.options.find((o) => o.id === selectedId) ?? slot.options[0]
    return sum + (option?.estimatedKcal ?? 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">
            {todayDayType ? todayDayType.name : 'Nenhum plano para hoje'}
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-text">Dieta de hoje</h1>
        </div>
        <button
          onClick={() => setManageOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-secondary hover:bg-surface-muted"
          aria-label="Gerenciar tipos de dia"
        >
          <Settings2 size={18} />
        </button>
      </div>

      {isLoading && <DietSkeleton />}

      {!isLoading && isError && (
        <ErrorState title="Não foi possível carregar sua dieta" onRetry={() => window.location.reload()} />
      )}

      {!isLoading && !isError && !todayDayType && (
        <EmptyState
          icon={<UtensilsCrossed size={22} />}
          title={dayTypes.length === 0 ? 'Nenhum tipo de dia criado' : 'Hoje ainda não tem um tipo de dia definido'}
          description={
            dayTypes.length === 0
              ? 'Crie tipos de dia (ex.: dia de treino, dia de descanso) e monte as refeições de cada um.'
              : 'Associe um tipo de dia a cada dia da semana para ver o plano de hoje aqui.'
          }
          action={
            <Button icon={<Settings2 size={16} />} onClick={() => setManageOpen(true)}>
              Gerenciar tipos de dia
            </Button>
          }
        />
      )}

      {!isLoading && !isError && todayDayType && (
        <>
          {mealSlots.length === 0 ? (
            <EmptyState
              title={`"${todayDayType.name}" ainda não tem refeições`}
              description="Adicione refeições a esse tipo de dia para começar a acompanhar."
              action={
                <Button size="sm" onClick={() => setManageOpen(true)}>
                  Adicionar refeições
                </Button>
              }
            />
          ) : (
            <>
              <Card tone="dark">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-accent">Adesão do dia</span>
                  <span className="text-2xl font-bold">{Math.round(adherence)}%</span>
                </div>
                <p className="mt-1 text-sm text-text-onDark-secondary">
                  {doneCount} de {mealSlots.length} refeições · ≈ {totalKcal} kcal
                </p>
                <ProgressBar value={adherence} tone="onDark" className="mt-3" />
              </Card>

              <Card padding="none" className="divide-y divide-border px-5">
                {mealSlots.map((slot) => (
                  <TodayMealSlotCard
                    key={slot.id}
                    slot={slot}
                    selectedOptionId={dailyLog[slot.id]?.selectedOptionId}
                    isDone={dailyLog[slot.id]?.isDone ?? false}
                    onSelectOption={(optionId) => selectOption(slot.id, optionId)}
                    onToggleDone={() => toggleMealSlotDone(slot.id)}
                  />
                ))}
              </Card>
            </>
          )}

          <button
            onClick={() => setManageOpen(true)}
            className="text-sm font-medium text-text-secondary underline decoration-dotted underline-offset-4"
          >
            Gerenciar tipos de dia e refeições
          </button>
        </>
      )}

      <DietPlansDrawer open={isManageOpen} onClose={() => setManageOpen(false)} />
    </div>
  )
}
