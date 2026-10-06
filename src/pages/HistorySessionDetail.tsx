import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, History as HistoryIcon } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { useAuth } from '../context/AuthContext'
import { fetchSessionDetail } from '../api/sessions'
import { bestSet, formatFullDate, formatSet, performedSets } from '../lib/history-format'

export function HistorySessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { session } = useAuth()
  const userId = session?.user.id

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['session-detail', userId, sessionId],
    queryFn: () => fetchSessionDetail(userId!, sessionId!),
    enabled: Boolean(userId && sessionId),
  })

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/historico"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text"
        >
          <ChevronLeft size={16} /> Histórico
        </Link>
        {data && (
          <>
            <h1 className="mt-1 text-3xl font-semibold text-text">{data.workoutName}</h1>
            <p className="mt-1 text-text-secondary">
              {formatFullDate(data.finishedAt)}
              {data.durationMinutes !== null && ` • ${data.durationMinutes} min`}
              {data.status === 'partial' && ' • sessão parcial'}
            </p>
          </>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-muted" />
          ))}
        </div>
      )}

      {isError && <ErrorState title="Não foi possível carregar a sessão" onRetry={() => refetch()} />}

      {!isLoading && !isError && data === null && (
        <EmptyState
          icon={<HistoryIcon size={22} />}
          title="Sessão não encontrada"
          description="Ela pode ter sido removida ou não pertence à sua conta."
        />
      )}

      {data && (
        <div className="space-y-3">
          {data.exercises.map((exercise) => {
            const sets = performedSets(exercise.sets)
            const best = bestSet(exercise.sets)
            return (
              <Link
                key={exercise.id}
                to={`/historico/exercicio/${exercise.id}`}
                className="block focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Card>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-text">{exercise.name}</p>
                      <p className="text-sm text-text-secondary">
                        {exercise.muscleGroup} • {exercise.equipment}
                      </p>
                    </div>
                    <ChevronRight size={16} className="mt-1 text-text-secondary" />
                  </div>

                  {sets.length === 0 ? (
                    <p className="mt-3 text-sm text-text-secondary">Nenhuma série registrada.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-border">
                      {sets.map((set, index) => (
                        <li key={set.position} className="flex items-center justify-between py-2 text-sm">
                          <span className="text-text-secondary">Série {index + 1}</span>
                          <span className="font-medium text-text">
                            {formatSet(set)}
                            {best === set && (
                              <span className="ml-2 rounded-pill bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                                melhor
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {exercise.note && <p className="mt-3 text-sm text-text-secondary">{exercise.note}</p>}
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}