import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Dumbbell } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { StatCard } from '../components/ui/StatCard'
import { WeightChart } from '../components/progress/WeightChart'
import { useAuth } from '../context/AuthContext'
import { fetchExerciseHistory, fetchSessionExerciseRef } from '../api/sessions'
import { bestSet, formatFullDate, formatLoad, formatSet, performedSets } from '../lib/history-format'

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

export function ExerciseHistory() {
  const { sessionExerciseId } = useParams<{ sessionExerciseId: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const userId = session?.user.id

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['exercise-history', userId, sessionExerciseId],
    queryFn: async () => {
      const ref = await fetchSessionExerciseRef(userId!, sessionExerciseId!)
      if (!ref) return null
      const entries = await fetchExerciseHistory(userId!, ref)
      return { name: ref.name, entries }
    },
    enabled: Boolean(userId && sessionExerciseId),
  })

  const entries = data?.entries ?? []

  // Best load per session, oldest → newest, for the evolution chart.
  const evolution = [...entries]
    .reverse()
    .map((entry) => ({ date: shortDate(entry.finishedAt), weightKg: bestSet(entry.sets)?.loadKg ?? 0 }))
    .filter((point) => point.weightKg > 0)

  const allTimeBest = entries
    .map((entry) => bestSet(entry.sets)?.loadKg ?? 0)
    .reduce((max, value) => Math.max(max, value), 0)

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text"
        >
          <ChevronLeft size={16} /> Voltar
        </button>
        <h1 className="mt-1 text-3xl font-semibold text-text">{data?.name ?? 'Exercício'}</h1>
        {data && (
          <p className="mt-1 text-text-secondary">
            {entries.length} {entries.length === 1 ? 'sessão' : 'sessões'} registradas
          </p>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      )}

      {isError && (
        <ErrorState title="Não foi possível carregar o histórico do exercício" onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && data && entries.length === 0 && (
        <EmptyState
          icon={<Dumbbell size={22} />}
          title="Sem registros deste exercício"
          description="Quando você finalizar treinos com ele, as cargas aparecem aqui."
        />
      )}

      {entries.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard tone="dark" label="Maior carga" value={formatLoad(allTimeBest || null)} caption="em todas as sessões" />
            <StatCard label="Última sessão" value={formatFullDate(entries[0].finishedAt)} caption={entries[0].workoutName} />
          </div>

          {evolution.length > 1 && (
            <Card>
              <p className="text-sm text-text-secondary">Melhor carga por sessão</p>
              <div className="mt-4">
                <WeightChart data={evolution} />
              </div>
            </Card>
          )}

          <div className="space-y-3">
            {entries.map((entry) => {
              const sets = performedSets(entry.sets)
              const best = bestSet(entry.sets)
              return (
                <Link
                  key={entry.sessionId + entry.finishedAt}
                  to={`/historico/${entry.sessionId}`}
                  className="block focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Card>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-text">{formatFullDate(entry.finishedAt)}</p>
                      <p className="text-sm text-text-secondary">{entry.workoutName}</p>
                    </div>
                    {sets.length === 0 ? (
                      <p className="mt-2 text-sm text-text-secondary">Nenhuma série registrada.</p>
                    ) : (
                      <ul className="mt-2 divide-y divide-border">
                        {sets.map((set, index) => (
                          <li key={set.position} className="flex justify-between py-1.5 text-sm">
                            <span className="text-text-secondary">Série {index + 1}</span>
                            <span className={set === best ? 'font-semibold text-primary' : 'font-medium text-text'}>
                              {formatSet(set)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}