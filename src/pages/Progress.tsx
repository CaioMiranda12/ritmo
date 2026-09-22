import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, ArrowUpRight, LineChart } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { StatCard } from '../components/ui/StatCard'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { WeightChart } from '../components/progress/WeightChart'
import { RegisterWeightDrawer } from '../components/progress/RegisterWeightDrawer'
import { ProgressSkeleton } from '../components/progress/ProgressSkeleton'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { fetchRecentSessions, fetchSessionsThisWeekCount } from '../api/sessions'
import type { WeightEntry } from '../types'

export function Progress() {
  const { session } = useAuth()
  const userId = session?.user.id

  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isDrawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (!userId) return
    loadWeightHistory(userId)
  }, [userId])

  function loadWeightHistory(uid: string) {
    setIsLoading(true)
    setHasError(false)

    supabase
      .from('weight_entries')
      .select('recorded_at, weight_kg')
      .eq('user_id', uid)
      .order('recorded_at', { ascending: true })
      .then(({ data, error }) => {
        if (error || !data) {
          setHasError(true)
        } else {
          setWeightHistory(
            data.map((row) => ({
              date: formatShortDate(row.recorded_at),
              weightKg: Number(row.weight_kg),
            })),
          )
        }
        setIsLoading(false)
      })
  }

  const { data: recentSessions = [] } = useQuery({
    queryKey: ['recent-sessions', userId, 5],
    queryFn: () => fetchRecentSessions(userId!, 5),
    enabled: Boolean(userId),
  })

  const { data: sessionsThisWeek = 0 } = useQuery({
    queryKey: ['sessions-this-week-count', userId],
    queryFn: () => fetchSessionsThisWeekCount(userId!),
    enabled: Boolean(userId),
  })

  const hasHistory = weightHistory.length > 0 || recentSessions.length > 0
  const currentWeight = weightHistory[weightHistory.length - 1]?.weightKg ?? 0
  const firstWeight = weightHistory[0]?.weightKg ?? currentWeight
  const weightDelta = Math.round((currentWeight - firstWeight) * 10) / 10

  async function handleRegisterWeight(weightKg: number) {
    if (!userId) return
    const { error } = await supabase.from('weight_entries').insert({ user_id: userId, weight_kg: weightKg })
    setDrawerOpen(false)
    if (!error) loadWeightHistory(userId)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-text-secondary">Últimas 8 semanas</p>
          <h1 className="mt-1 text-3xl font-semibold text-text">Seu progresso</h1>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>
          Registrar peso
        </Button>
      </div>

      {isLoading && <ProgressSkeleton />}

      {!isLoading && hasError && (
        <ErrorState
          title="Não foi possível carregar seu progresso"
          onRetry={() => userId && loadWeightHistory(userId)}
        />
      )}

      {!isLoading && !hasError && !hasHistory && (
        <EmptyState
          icon={<LineChart size={22} />}
          title="Ainda não há histórico"
          description="Registre seu peso ou finalize um treino para começar a ver sua evolução aqui."
          action={
            <Button icon={<Plus size={16} />} onClick={() => setDrawerOpen(true)}>
              Registrar peso
            </Button>
          }
        />
      )}

      {!isLoading && !hasError && hasHistory && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              tone="dark"
              label="Peso atual"
              value={currentWeight.toString().replace('.', ',')}
              unit="kg"
              caption={`${weightDelta > 0 ? '+' : ''}${weightDelta.toString().replace('.', ',')} kg no período`}
            />
            <StatCard label="Treinos" value={sessionsThisWeek} unit="essa semana" caption="sessões finalizadas" />
            <StatCard
              tone="accent"
              label="Volume"
              value="—"
              caption="comparação de volume chega numa próxima versão"
            />
          </div>

          {weightHistory.length > 1 && (
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">Evolução de peso</p>
                  <h2 className="text-lg font-semibold text-text">Tendência consistente</h2>
                </div>
                <span className="rounded-pill bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                  {weightDelta <= 0 ? '' : '+'}
                  {((weightDelta / firstWeight) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="mt-4">
                <WeightChart data={weightHistory} />
              </div>
            </Card>
          )}

          {recentSessions.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-text">Sessões recentes</h2>
              </div>
              <Card padding="none" className="divide-y divide-border px-5">
                {recentSessions.map((sessionItem) => (
                  <div key={sessionItem.id} className="flex items-center gap-3 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
                      <ArrowUpRight size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-text">{sessionItem.workoutName}</p>
                      <p className="text-sm text-text-secondary">{sessionItem.dateLabel}</p>
                    </div>
                    <span className="text-sm font-medium text-primary">{sessionItem.highlight}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </>
      )}

      <RegisterWeightDrawer open={isDrawerOpen} onClose={() => setDrawerOpen(false)} onSubmit={handleRegisterWeight} />
    </div>
  )
}

function formatShortDate(isoDate: string) {
  const [, month, day] = isoDate.split('-')
  const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${day} ${monthNames[Number(month) - 1]}`
}
