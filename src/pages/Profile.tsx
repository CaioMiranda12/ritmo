import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, LogOut } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

type WeightUnit = 'kg' | 'lb'

export function Profile() {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const userId = session?.user.id

  const [name, setName] = useState('')
  const [unit, setUnit] = useState<WeightUnit>('kg')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    if (!userId) return

    let isCancelled = false
    setIsLoading(true)
    setLoadError(false)

    supabase
      .from('profiles')
      .select('name, weight_unit')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (isCancelled) return
        if (error || !data) {
          setLoadError(true)
        } else {
          setName(data.name)
          setUnit(data.weight_unit as WeightUnit)
        }
        setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [userId])

  async function handleSave() {
    if (!userId) return
    setIsSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({ name, weight_unit: unit })
      .eq('id', userId)

    setIsSaving(false)
    if (!error) setIsDirty(false)
  }

  async function handleSignOut() {
    setIsSigningOut(true)
    await signOut()
    navigate('/login')
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <p className="text-sm text-text-secondary">Sua conta</p>
        <h1 className="mt-1 text-3xl font-semibold text-text">Perfil e configurações</h1>
      </div>

      {isLoading ? (
        <Card>
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Skeleton className="mt-6 h-11 w-full rounded-xl" />
          <Skeleton className="mt-4 h-11 w-full rounded-xl" />
        </Card>
      ) : loadError ? (
        <Card className="flex items-start gap-2.5 border-error/20 bg-error/5 text-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span className="text-sm">Não foi possível carregar seu perfil agora.</span>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-lg font-semibold text-text">
              {name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-text">{name}</p>
              <p className="text-sm text-text-secondary">{session?.user.email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-text" htmlFor="name">
                Nome
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setIsDirty(true)
                }}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-4 text-text focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <span className="text-sm font-medium text-text">Unidade de peso</span>
              <div className="mt-1.5 flex gap-2">
                {(['kg', 'lb'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setUnit(option)
                      setIsDirty(true)
                    }}
                    className={[
                      'h-10 flex-1 rounded-xl border text-sm font-medium transition-colors',
                      unit === option
                        ? 'border-primary bg-primary-soft text-primary'
                        : 'border-border text-text-secondary hover:bg-surface-muted',
                    ].join(' ')}
                  >
                    {option === 'kg' ? 'Quilogramas (kg)' : 'Libras (lb)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button className="mt-6" fullWidth disabled={!isDirty || isSaving} onClick={handleSave}>
            {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </Card>
      )}

      <Card>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="flex w-full items-center justify-between text-left disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-error/10 text-error">
              <LogOut size={16} />
            </div>
            <span className="font-medium text-text">{isSigningOut ? 'Saindo...' : 'Sair da conta'}</span>
          </div>
        </button>
      </Card>
    </div>
  )
}
