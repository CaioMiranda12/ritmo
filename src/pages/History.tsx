import { useInfiniteQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, History as HistoryIcon } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { useAuth } from '../context/AuthContext'
import { fetchSessionHistory } from '../api/sessions'
import { formatFullDate } from '../lib/history-format'

const PAGE_SIZE = 20

export function History() {
  const { session } = useAuth()
  const userId = session?.user.id

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['session-history', userId],
      queryFn: ({ pageParam }) => fetchSessionHistory(userId!, pageParam, PAGE_SIZE),
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) => (lastPage.length === PAGE_SIZE ? pages.length : undefined),
      enabled: Boolean(userId),
    })

  const sessions = data?.pages.flat() ?? []

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/progresso"
          className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text"
        >
          <ChevronLeft size={16} /> Progresso
        </Link>
        <h1 className="mt-1 text-3xl font-semibold text-text">Histórico de treinos</h1>
      </div>

      {isLoading && (
        <Card className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-muted" />
          ))}
        </Card>
      )}

      {isError && <ErrorState title="Não foi possível carregar o histórico" onRetry={() => refetch()} />}

      {!isLoading && !isError && sessions.length === 0 && (
        <EmptyState
          icon={<HistoryIcon size={22} />}
          title="Nenhum treino registrado"
          description="Finalize um treino para ver as sessões e as cargas aqui."
        />
      )}

      {sessions.length > 0 && (
        <Card padding="none" className="divide-y divide-border px-5">
          {sessions.map((item) => (
            <Link
              key={item.id}
              to={`/historico/${item.id}`}
              className="flex items-center gap-3 py-4 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <div className="flex-1">
                <p className="font-medium text-text">{item.workoutName}</p>
                <p className="text-sm text-text-secondary">
                  {formatFullDate(item.finishedAt)}
                  {item.durationMinutes !== null && ` • ${item.durationMinutes} min`}
                  {` • ${item.exerciseCount} exercícios • ${item.doneSetCount} séries`}
                </p>
              </div>
              {item.status === 'partial' && (
                <span className="rounded-pill bg-surface-muted px-2.5 py-1 text-xs font-semibold text-text-secondary">
                  Parcial
                </span>
              )}
              <ChevronRight size={16} className="text-text-secondary" />
            </Link>
          ))}
        </Card>
      )}

      {hasNextPage && (
        <Button className="w-full" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
        </Button>
      )}
    </div>
  )
}