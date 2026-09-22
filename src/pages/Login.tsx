import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { supabase } from '../lib/supabase'
import { translateAuthError } from '../lib/auth-errors'

// Drop the generated hero photo at public/login-hero.jpg (see the AI prompt
// shared with the design). Until then this falls back to a CSS gradient in
// the brand's dark tone, so the layout still looks intentional.
const HERO_IMAGE_URL = '/login-hero.jpg'

type View = 'signIn' | 'forgotPassword' | 'resetLinkSent'

export function Login() {
  const navigate = useNavigate()
  const [view, setView] = useState<View>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSignIn(event: FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setErrorMessage(translateAuthError(error.message))
      setStatus('error')
      return
    }

    navigate('/')
  }

  async function handleForgotPassword(event: FormEvent) {
    event.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })

    if (error) {
      setErrorMessage(translateAuthError(error.message))
      setStatus('error')
      return
    }

    setStatus('idle')
    setView('resetLinkSent')
  }

  return (
    <div className="flex min-h-dvh bg-bg lg:h-dvh lg:overflow-hidden">
      {/* Left panel — desktop only */}
      <div
        className="relative hidden w-1/2 shrink-0 bg-ink lg:block"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(22,33,26,0.15) 0%, rgba(22,33,26,0.85) 100%), url(${HERO_IMAGE_URL})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex h-full flex-col justify-between p-10 text-text-onDark">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-ink">
              R
            </div>
            <span className="text-lg font-semibold">ritmo</span>
          </div>
          <div className="max-w-sm">
            <p className="text-2xl font-semibold leading-snug">
              Treinos, dieta e progresso, tudo no seu ritmo.
            </p>
            <p className="mt-3 text-sm text-text-onDark-secondary">
              Registre suas séries em segundos e acompanhe sua evolução sem planilhas.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-bold text-accent">
              R
            </div>
            <span className="text-lg font-semibold text-text">ritmo</span>
          </div>

          {view === 'signIn' && (
            <>
              <h1 className="text-2xl font-semibold text-text">Bem-vindo de volta</h1>
              <p className="mt-1.5 text-sm text-text-secondary">
                Entre para continuar seus treinos e sua dieta.
              </p>

              {status === 'error' && <ErrorBanner message={errorMessage} />}

              <form className="mt-6 space-y-4" onSubmit={handleSignIn}>
                <div>
                  <label className="text-sm font-medium text-text" htmlFor="email">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text" htmlFor="password">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setView('forgotPassword')
                        setStatus('idle')
                        setErrorMessage('')
                      }}
                      className="text-xs font-medium text-primary"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
                  />
                </div>

                <Button type="submit" fullWidth disabled={status === 'loading'}>
                  {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : 'Entrar'}
                </Button>
              </form>

              <p className="mt-6 text-center text-xs text-text-secondary">
                Ainda não tem uma conta? Fale com o administrador do ritmo.
              </p>
            </>
          )}

          {view === 'forgotPassword' && (
            <>
              <button
                onClick={() => {
                  setView('signIn')
                  setStatus('idle')
                  setErrorMessage('')
                }}
                className="flex items-center gap-1.5 text-sm font-medium text-text-secondary"
              >
                <ArrowLeft size={15} />
                Voltar
              </button>

              <h1 className="mt-4 text-2xl font-semibold text-text">Redefinir senha</h1>
              <p className="mt-1.5 text-sm text-text-secondary">
                Envie um link de redefinição para o seu e-mail cadastrado.
              </p>

              {status === 'error' && <ErrorBanner message={errorMessage} />}

              <form className="mt-6 space-y-4" onSubmit={handleForgotPassword}>
                <div>
                  <label className="text-sm font-medium text-text" htmlFor="reset-email">
                    E-mail
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoFocus
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
                  />
                </div>

                <Button type="submit" fullWidth disabled={status === 'loading'}>
                  {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : 'Enviar link'}
                </Button>
              </form>
            </>
          )}

          {view === 'resetLinkSent' && (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                <CheckCircle2 size={24} />
              </div>
              <h1 className="mt-4 text-xl font-semibold text-text">Link enviado</h1>
              <p className="mt-1.5 text-sm text-text-secondary">
                Se {email} estiver cadastrado, você vai receber um e-mail com o link de redefinição em instantes.
              </p>
              <Button variant="ghost" fullWidth className="mt-6" onClick={() => setView('signIn')}>
                Voltar para o login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
