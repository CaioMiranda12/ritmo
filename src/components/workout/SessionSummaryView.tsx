import { CheckCircle2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

export function SessionSummaryView({
  workoutName,
  durationMinutes,
  completedSets,
  totalSets,
  isPartial = false,
  onDone,
}: {
  workoutName: string
  durationMinutes: number
  completedSets: number
  totalSets: number
  isPartial?: boolean
  onDone: () => void
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 py-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
        <CheckCircle2 size={32} />
      </div>
      <h1 className="mt-5 text-2xl font-semibold text-text">
        {isPartial ? 'Sessão salva' : 'Treino concluído'}
      </h1>
      <p className="mt-1 text-text-secondary">{workoutName}</p>

      <Card className="mt-8 w-full max-w-sm text-left">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-text-secondary">Duração</p>
            <p className="text-2xl font-semibold text-text">{durationMinutes} min</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Séries concluídas</p>
            <p className="text-2xl font-semibold text-text">
              {completedSets}/{totalSets}
            </p>
          </div>
        </div>
      </Card>

      <Button className="mt-8 w-full max-w-sm" onClick={onDone}>
        Voltar para hoje
      </Button>
    </div>
  )
}
