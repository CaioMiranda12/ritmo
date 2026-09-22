import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import { translateAuthError } from '../lib/auth-errors'

export function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (password.length < 8) {
      setErrorMessage('A senha precisa ter pelo menos 8 caracteres.')
      setStatus('error')
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage('As senhas não coincidem.')
      setStatus('error')
      return
    }

    setStatus('loading')
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setErrorMessage(translateAuthError(error.message))
      setStatus('error')
      return
    }

    setStatus('success')
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <CheckCircle2 size={28} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold text-text">Senha atualizada</h1>
        <p className="mt-1.5 text-sm text-text-secondary">Você já pode continuar usando o ritmo.</p>
        <Button className="mt-6 w-full max-w-xs" onClick={() => navigate('/')}>
          Ir para o app
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-text">Defina uma nova senha</h1>
        <p className="mt-1.5 text-sm text-text-secondary">Escolha uma senha com pelo menos 8 caracteres.</p>

        {status === 'error' && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-text" htmlFor="new-password">
              Nova senha
            </label>
            <input
              id="new-password"
              type="password"
              required
              autoFocus
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-text" htmlFor="confirm-password">
              Confirmar senha
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
            />
          </div>

          <Button type="submit" fullWidth disabled={status === 'loading'}>
            {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : 'Salvar nova senha'}
          </Button>
        </form>
      </div>
    </div>
  )
}
