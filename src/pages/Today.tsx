import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, ChevronRight, CalendarPlus } from 'lucide-react'
import { WeekStrip } from '../components/workout/WeekStrip'
import { TodayWorkoutHero } from '../components/workout/TodayWorkoutHero'
import { WeeklyFrequency } from '../components/workout/WeeklyFrequency'
import { TodaySkeleton } from '../components/workout/TodaySkeleton'
import { TodayMealSlotCard } from '../components/diet/TodayMealSlotCard'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Button } from '../components/ui/Button'
import { getTodayWeekdayCode } from '../lib/mock-data'
import { fetchRecentSessions } from '../api/sessions'
import { useWorkouts } from '../context/WorkoutsContext'
import { useDiet } from '../context/DietContext'
import { useAuth } from '../context/AuthContext'

export function Today() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const userId = session?.user.id
  const { workouts, isLoading: isWorkoutsLoading, isError: isWorkoutsError } = useWorkouts()
  const {
    dayTypes,
    weekdayAssignments,
    dailyLog,
    selectOption,
    toggleMealSlotDone,
    isLoading: isDietLoading,
    isError: isDietError,
  } = useDiet()

  const { data: recentSessions } = useQuery({
    queryKey: ['recent-sessions', userId, 1],
    queryFn: () => fetchRecentSessions(userId!, 1),
    enabled: Boolean(userId),
  })

  const isLoading = isWorkoutsLoading || isDietLoading
  const isError = isWorkoutsError || isDietError

  const todayWorkout = workouts.find((w) => w.isToday)
  const todayDayType = dayTypes.find((dt) => dt.id === weekdayAssignments[getTodayWeekdayCode()])
  const mealSlots = todayDayType?.meals ?? []
  const lastSession = recentSessions?.[0]
  const isFirstAccess = !isLoading && !isError && workouts.length === 0 && dayTypes.length === 0

  const greeting = getGreeting()
  const displayName = session?.user.email?.split('@')[0] ?? ''

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-text-secondary">{formatToday()}</p>
        <h1 className="mt-1 text-3xl font-semibold text-text">
          {greeting}
          {displayName ? `, ${displayName}` : ''}.
        </h1>
      </div>

      {isLoading && <TodaySkeleton />}

      {!isLoading && isError && (
        <ErrorState
          title="Não foi possível carregar seu dia"
          description="Verifique sua conexão e tente novamente."
          onRetry={() => window.location.reload()}
        />
      )}

      {isFirstAccess && (
        <EmptyState
          icon={<CalendarPlus size={22} />}
          title="Vamos começar"
          description="Crie seu primeiro treino ou monte sua dieta para ver o plano do dia aqui."
          action={<Button onClick={() => navigate('/treinos')}>Criar primeiro treino</Button>}
        />
      )}

      {!isLoading && !isError && !isFirstAccess && (
        <>
          <WeekStrip />

          {todayWorkout ? (
            <TodayWorkoutHero workout={todayWorkout} onStart={() => navigate(`/execucao/${todayWorkout.id}`)} />
          ) : (
            <EmptyState
              title="Nenhum treino hoje"
              description="Seu próximo treino planejado aparece aqui assim que chegar o dia."
              action={<Button onClick={() => navigate('/treinos')}>Ver treinos</Button>}
            />
          )}

          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Plano do dia</p>
            </div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-text">Próximas refeições</h2>
              <button onClick={() => navigate('/dieta')} className="flex items-center text-sm font-medium text-primary">
                Ver dieta
                <ChevronRight size={16} />
              </button>
            </div>
            {mealSlots.length > 0 ? (
              <Card padding="none" className="mt-3 divide-y divide-border px-5">
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
            ) : (
              <div className="mt-3">
                <EmptyState
                  title="Sem refeições cadastradas para hoje"
                  description="Monte seus tipos de dia e refeições na página Dieta."
                  action={
                    <Button variant="ghost" size="sm" onClick={() => navigate('/dieta')}>
                      Ir para dieta
                    </Button>
                  }
                />
              </div>
            )}
          </section>

          <WeeklyFrequency />

          {lastSession && (
            <Card tone="muted" className="border border-primary/15 bg-primary-soft/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-primary">
                <Sparkles size={16} />
              </div>
              <h3 className="mt-3 font-semibold text-text">Última sessão</h3>
              <p className="mt-1 text-sm text-text-secondary">
                {lastSession.workoutName} · {lastSession.highlight}
              </p>
              <button
                onClick={() => navigate('/progresso')}
                className="mt-2 flex items-center gap-1 text-sm font-medium text-primary"
              >
                Ver resultado
                <ChevronRight size={15} />
              </button>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatToday() {
  const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const label = formatter.format(new Date())
  return label.charAt(0).toUpperCase() + label.slice(1)
}
