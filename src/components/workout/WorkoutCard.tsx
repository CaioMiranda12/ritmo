import { useState } from 'react'
import { Play, Copy, Archive } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { ActionMenu } from '../ui/ActionMenu'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useWorkouts } from '../../context/WorkoutsContext'
import type { WorkoutPlan } from '../../types'

const dayTone: Record<string, string> = {
  TER: 'bg-accent text-ink',
  QUI: 'bg-primary-soft text-primary',
  SÁB: 'bg-warning/15 text-warning',
}

export function WorkoutCard({ workout }: { workout: WorkoutPlan }) {
  const { duplicateWorkout, archiveWorkout } = useWorkouts()
  const [isConfirmingArchive, setConfirmingArchive] = useState(false)

  return (
    <Card className="relative">
      <div className="flex items-start justify-between">
        <div
          className={[
            'flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-bold',
            dayTone[workout.dayLabel] ?? 'bg-surface-muted text-text',
          ].join(' ')}
        >
          {workout.dayLabel || '—'}
        </div>
        <ActionMenu
          items={[
            { label: 'Duplicar', icon: <Copy size={15} />, onClick: () => duplicateWorkout(workout.id) },
            {
              label: 'Arquivar',
              icon: <Archive size={15} />,
              destructive: true,
              onClick: () => setConfirmingArchive(true),
            },
          ]}
        />
      </div>

      <Link to={`/treinos/${workout.id}`} className="mt-3 block">
        <h3 className="text-xl font-semibold text-text">{workout.name}</h3>
        <p className="mt-1 text-sm text-text-secondary">
          {workout.exerciseCount} exercícios · {workout.setCount} séries
        </p>
      </Link>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-text-secondary">
          {workout.lastPerformedLabel ? `Último: ${workout.lastPerformedLabel}` : 'Ainda não realizado'}
        </span>
        <Link
          to={`/execucao/${workout.id}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-accent hover:bg-ink-soft"
          aria-label={`Iniciar ${workout.name}`}
        >
          <Play size={15} fill="currentColor" />
        </Link>
      </div>

      {workout.isToday && (
        <div className="mt-3">
          <Badge tone="primary">Treino de hoje</Badge>
        </div>
      )}

      <ConfirmDialog
        open={isConfirmingArchive}
        title="Arquivar treino?"
        description="O treino sai da sua lista ativa, mas o histórico de sessões realizadas continua disponível no Progresso."
        confirmLabel="Arquivar"
        tone="destructive"
        onConfirm={() => {
          archiveWorkout(workout.id)
          setConfirmingArchive(false)
        }}
        onCancel={() => setConfirmingArchive(false)}
      />
    </Card>
  )
}
