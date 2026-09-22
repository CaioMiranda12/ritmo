import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronRight, Clock, History, SkipForward, Sparkles } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { SetRow } from '../components/workout/SetRow'
import { SessionSummaryView } from '../components/workout/SessionSummaryView'
import { useWorkouts } from '../context/WorkoutsContext'
import { useAuth } from '../context/AuthContext'
import { buildSessionExercises } from '../lib/build-session'
import { useRestTimer } from '../hooks/useRestTimer'
import { saveSessionProgress, loadSessionProgress, clearSessionProgress } from '../lib/session-storage'
import { createSession } from '../api/sessions'
import type { SessionExercise } from '../types'

type ConfirmIntent = 'idle' | 'exit' | 'finish'

export function WorkoutSession() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { workouts } = useWorkouts()
  const { session } = useAuth()
  const userId = session?.user.id
  const queryClient = useQueryClient()
  const workout = workouts.find((w) => w.id === id)

  const freshExercises = useMemo(() => (workout ? buildSessionExercises(workout) : []), [workout])
  const savedProgress = useMemo(() => (workout ? loadSessionProgress(workout.id) : null), [workout])

  // Recovery gate: if there's a saved draft, ask before restoring it instead
  // of silently overwriting or resuming — the person may not want either.
  const [recoveryChoice, setRecoveryChoice] = useState<'pending' | 'resolved'>(
    savedProgress ? 'pending' : 'resolved',
  )
  const [exercises, setExercises] = useState<SessionExercise[]>(savedProgress?.exercises ?? freshExercises)
  const [exerciseIndex, setExerciseIndex] = useState(savedProgress?.exerciseIndex ?? 0)
  const [confirmIntent, setConfirmIntent] = useState<ConfirmIntent>('idle')
  const [isFinished, setIsFinished] = useState(false)
  const [isPartial, setIsPartial] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const restTimer = useRestTimer()

  useEffect(() => {
    if (!workout || recoveryChoice !== 'resolved' || isFinished) return
    saveSessionProgress(workout.id, { exercises, exerciseIndex })
  }, [workout, exercises, exerciseIndex, recoveryChoice, isFinished])

  if (!workout) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg p-6">
        <EmptyState
          title="Treino não encontrado"
          description="Volte e escolha um treino para iniciar."
          action={<Button onClick={() => navigate('/treinos')}>Voltar para treinos</Button>}
        />
      </div>
    )
  }

  if (freshExercises.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg p-6">
        <EmptyState
          title="Este treino não tem exercícios"
          description="Adicione exercícios ao treino antes de iniciar uma sessão."
          action={<Button onClick={() => navigate(`/treinos/${workout.id}`)}>Editar treino</Button>}
        />
      </div>
    )
  }

  if (recoveryChoice === 'pending') {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg p-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <History size={26} />
          </div>
          <h1 className="mt-5 text-xl font-semibold text-text">Sessão em andamento encontrada</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Parece que você saiu no meio de "{workout.name}" sem finalizar. Quer continuar de onde parou?
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button
              fullWidth
              onClick={() => {
                if (!savedProgress) return
                setExercises(savedProgress.exercises)
                setExerciseIndex(savedProgress.exerciseIndex)
                setRecoveryChoice('resolved')
              }}
            >
              Continuar de onde parei
            </Button>
            <Button
              fullWidth
              variant="ghost"
              onClick={() => {
                clearSessionProgress(workout.id)
                setExercises(freshExercises)
                setExerciseIndex(0)
                setRecoveryChoice('resolved')
              }}
            >
              Começar do zero
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentExercise = exercises[exerciseIndex]
  const workoutId = workout.id
  const workoutName = workout.name
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  const doneSets = exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.isDone).length, 0)
  const overallProgress = totalSets > 0 ? (doneSets / totalSets) * 100 : 0
  const isLastExercise = exerciseIndex === exercises.length - 1
  const allCurrentSetsDone = currentExercise.sets.every((s) => s.isDone)

  function updateSet(setId: string, field: 'loadKg' | 'reps', value: number) {
    setExercises((current) =>
      current.map((ex, i) =>
        i !== exerciseIndex
          ? ex
          : { ...ex, sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)) },
      ),
    )
  }

  function toggleSetDone(setId: string) {
    setExercises((current) =>
      current.map((ex, i) => {
        if (i !== exerciseIndex) return ex
        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id !== setId) return s
            const nextDone = !s.isDone
            if (nextDone) restTimer.start(90)
            return { ...s, isDone: nextDone }
          }),
        }
      }),
    )
  }

  function addSet() {
    setExercises((current) =>
      current.map((ex, i) => {
        if (i !== exerciseIndex) return ex
        const nextNumber = ex.sets.length + 1
        const lastSet = ex.sets[ex.sets.length - 1]
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              id: `${ex.id}-extra-${nextNumber}`,
              setNumber: nextNumber,
              loadKg: lastSet?.loadKg ?? null,
              reps: lastSet?.reps ?? null,
              isDone: false,
            },
          ],
        }
      }),
    )
  }

  function goToNextExercise() {
    if (isLastExercise) {
      setConfirmIntent('finish')
      return
    }
    setExerciseIndex((i) => i + 1)
  }

  async function finishSession(partial: boolean) {
    setIsSaving(true)
    try {
      if (userId) {
        await createSession(userId, {
          workoutId: workoutId,
          workoutName: workoutName,
          status: partial ? 'partial' : 'completed',
          exercises,
        })
        queryClient.invalidateQueries({ queryKey: ['workouts', userId] })
        queryClient.invalidateQueries({ queryKey: ['recent-sessions', userId] })
        queryClient.invalidateQueries({ queryKey: ['sessions-this-week-count', userId] })
      }
    } catch (err) {
      // Best-effort for now: still show the summary even if the save
      // failed, so the person isn't stuck. Worth a retry affordance later.
      console.error('Falha ao salvar a sessão', err)
    }
    clearSessionProgress(workoutId)
    setIsPartial(partial)
    setIsSaving(false)
    setIsFinished(true)
    setConfirmIntent('idle')
  }

  function handleExitConfirm() {
    if (doneSets === 0) {
      clearSessionProgress(workoutId)
      setConfirmIntent('idle')
      navigate(-1)
      return
    }
    finishSession(true)
  }

  if (isFinished) {
    return (
      <SessionSummaryView
        workoutName={workout.name}
        durationMinutes={workout.estimatedMinutes}
        completedSets={doneSets}
        totalSets={totalSets}
        isPartial={isPartial}
        onDone={() => navigate('/')}
      />
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setConfirmIntent('exit')} className="flex items-center gap-2 text-text-secondary" aria-label="Voltar">
            <ArrowLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-text">{workout.name}</p>
            <p className="text-xs text-text-secondary">
              {workout.estimatedMinutes} min · {exerciseIndex + 1} de {exercises.length} exercícios
            </p>
          </div>
          <button onClick={() => setConfirmIntent('exit')} className="text-sm font-medium text-error">
            Encerrar
          </button>
        </div>
        <ProgressBar value={overallProgress} tone="primary" className="rounded-none" />
      </header>

      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-32 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Exercício {exerciseIndex + 1} de {exercises.length}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-text">{currentExercise.name}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {currentExercise.equipment} · {currentExercise.muscleGroup}
        </p>

        {currentExercise.previousBest && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-primary-soft/50 px-4 py-3">
            <Sparkles size={16} className="text-primary" />
            <div>
              <p className="text-xs text-text-secondary">Última sessão</p>
              <p className="text-sm font-medium text-text">{currentExercise.previousBest}</p>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 px-1 text-xs font-medium uppercase tracking-wide text-text-secondary">
          <span>Série</span>
          <span>Carga</span>
          <span>Reps</span>
          <span>Feita</span>
        </div>
        <div className="mt-1 space-y-1">
          {currentExercise.sets.map((set) => (
            <SetRow
              key={set.id}
              set={set}
              isActive={!set.isDone}
              onChange={(field, value) => updateSet(set.id, field, value)}
              onToggleDone={() => toggleSetDone(set.id)}
            />
          ))}
        </div>

        <button
          onClick={addSet}
          className="mt-3 w-full rounded-xl border border-dashed border-border py-3 text-sm font-medium text-text-secondary hover:border-primary/40 hover:text-primary"
        >
          + Adicionar série
        </button>

        <textarea
          placeholder="Adicionar observação sobre o exercício..."
          rows={2}
          className="mt-4 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
        />

        <div className="mt-4 flex items-center justify-between">
          {!isLastExercise ? (
            <button
              onClick={() => setExerciseIndex((i) => i + 1)}
              className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text"
            >
              <SkipForward size={15} />
              Pular exercício
            </button>
          ) : (
            <span />
          )}

          {allCurrentSetsDone && !isLastExercise && (
            <Button variant="ghost" size="sm" icon={<ChevronRight size={16} />} onClick={goToNextExercise}>
              Próximo exercício
            </Button>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          <div className="flex h-11 items-center gap-1.5 rounded-pill bg-surface-muted px-3 text-sm font-medium text-text tabular-nums">
            <Clock size={15} className={restTimer.isRunning && restTimer.secondsLeft <= 10 ? 'text-error' : 'text-text-secondary'} />
            {restTimer.formatted()}
          </div>
          <Button
            fullWidth
            variant="secondary"
            onClick={() => {
              const nextSet = currentExercise.sets.find((s) => !s.isDone)
              if (nextSet) toggleSetDone(nextSet.id)
              else goToNextExercise()
            }}
          >
            {allCurrentSetsDone ? (isLastExercise ? 'Finalizar treino' : 'Próximo exercício') : 'Concluir série'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmIntent === 'finish'}
        title="Finalizar treino?"
        description="Você concluiu todas as séries. Vamos salvar essa sessão no seu histórico."
        confirmLabel={isSaving ? 'Salvando...' : 'Finalizar'}
        cancelLabel="Continuar treinando"
        onConfirm={() => finishSession(false)}
        onCancel={() => setConfirmIntent('idle')}
      />

      <ConfirmDialog
        open={confirmIntent === 'exit'}
        title={doneSets === 0 ? 'Sair sem salvar?' : 'Encerrar sessão?'}
        description={
          doneSets === 0
            ? 'Nenhuma série foi registrada ainda, então não há nada para salvar.'
            : 'Você ainda tem séries pendentes. Podemos salvar o que já foi feito como uma sessão parcial.'
        }
        confirmLabel={isSaving ? 'Salvando...' : doneSets === 0 ? 'Sair' : 'Salvar e sair'}
        cancelLabel="Continuar treinando"
        tone="destructive"
        onConfirm={handleExitConfirm}
        onCancel={() => setConfirmIntent('idle')}
      />
    </div>
  )
}
