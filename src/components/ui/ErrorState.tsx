import { AlertCircle } from 'lucide-react'
import { Button } from './Button'

export function ErrorState({
  title = 'Algo deu errado',
  description = 'Não foi possível carregar essas informações agora.',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-error/20 bg-error/5 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error/10 text-error">
        <AlertCircle size={22} />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-text">{title}</p>
        <p className="mx-auto max-w-xs text-sm text-text-secondary">{description}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}
