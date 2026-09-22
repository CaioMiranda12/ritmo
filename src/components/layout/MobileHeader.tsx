import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function MobileHeader() {
  const { session } = useAuth()
  const displayName = session?.user.email?.split('@')[0] ?? ''

  return (
    <header className="flex items-center justify-between border-b border-border bg-bg px-4 py-3 lg:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink text-xs font-bold text-accent">
          R
        </div>
        <span className="text-base font-semibold text-text">ritmo</span>
      </div>
      <Link
        to="/perfil"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-text"
      >
        {displayName.slice(0, 2).toUpperCase()}
      </Link>
    </header>
  )
}
