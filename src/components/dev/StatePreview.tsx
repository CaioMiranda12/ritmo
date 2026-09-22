import { useState } from 'react'

export type PreviewState = 'filled' | 'loading' | 'error' | 'empty'

const LABELS: Record<PreviewState, string> = {
  filled: 'Preenchido',
  loading: 'Carregando',
  error: 'Erro',
  empty: 'Vazio',
}

export function useStatePreview(initial: PreviewState = 'filled') {
  return useState<PreviewState>(initial)
}

export function StatePreviewBar({
  value,
  onChange,
  options = ['filled', 'loading', 'error', 'empty'],
}: {
  value: PreviewState
  onChange: (state: PreviewState) => void
  options?: PreviewState[]
}) {
  return (
    <div className="mb-1 flex flex-wrap items-center gap-1.5 rounded-xl border border-dashed border-border bg-surface-muted/50 p-1.5 text-xs">
      <span className="px-1.5 text-text-secondary">Ver estado:</span>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={[
            'rounded-pill px-2.5 py-1 font-medium transition-colors',
            value === option ? 'bg-ink text-text-onDark' : 'text-text-secondary hover:bg-surface',
          ].join(' ')}
        >
          {LABELS[option]}
        </button>
      ))}
    </div>
  )
}
