import { Play, ListChecks } from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { WorkoutPlan } from '../../types'

export function TodayWorkoutHero({
  workout,
  onStart,
}: {
  workout: WorkoutPlan
  onStart: () => void
}) {
  return (
    <Card tone="dark" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10" />
      <Badge tone="accent">Treino de hoje</Badge>
      <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">{workout.name}</h2>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-onDark-secondary">
        <span>{workout.exerciseCount} exercícios</span>
        <span>{workout.setCount} séries</span>
        <span>≈ {workout.estimatedMinutes} min</span>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="primary" icon={<Play size={16} fill="currentColor" />} onClick={onStart}>
          Iniciar treino
        </Button>
        <Button variant="ghost" icon={<ListChecks size={16} />} className="!border-white/15 !text-text-onDark hover:!bg-white/5">
          Ver exercícios
        </Button>
      </div>
    </Card>
  )
}
