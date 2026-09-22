import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { navItems } from './nav-items'
import { ProgressBar } from '../ui/ProgressBar'
import { useAuth } from '../../context/AuthContext'
import { fetchSessionsThisWeekCount } from '../../api/sessions'

const WEEKLY_GOAL_TARGET = 4

export function Sidebar() {
  const { session } = useAuth()
  const userId = session?.user.id
  const displayName = session?.user.email?.split('@')[0] ?? ''

  const { data: completed = 0 } = useQuery({
    queryKey: ['sessions-this-week-count', userId],
    queryFn: () => fetchSessionsThisWeekCount(userId!),
    enabled: Boolean(userId),
  })
  const weeklyPercent = (completed / WEEKLY_GOAL_TARGET) * 100

  return (
    <aside className="hidden w-64 shrink-0 flex-col justify-between border-r border-border bg-bg px-5 py-6 lg:flex">
      <div>
        <div className="mb-8 flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-bold text-accent">
            R
          </div>
          <span className="text-lg font-semibold text-text">ritmo</span>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-soft text-primary'
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text',
                ].join(' ')
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex flex-col gap-3">
        <div className="rounded-card bg-ink p-4 text-text-onDark">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-accent">Esta semana</span>
            <span className="rounded-pill bg-accent px-2 py-0.5 text-xs font-semibold text-ink">
              {completed}/{WEEKLY_GOAL_TARGET}
            </span>
          </div>
          <p className="text-sm font-medium leading-snug">Um treino para fechar a semana.</p>
          <ProgressBar value={weeklyPercent} tone="onDark" className="mt-3" />
        </div>

        <NavLink
          to="/perfil"
          className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm hover:bg-surface-muted"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-sm font-semibold text-text">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="leading-tight">
            <p className="font-medium text-text">{displayName}</p>
            <p className="text-xs text-text-secondary">Perfil e ajustes</p>
          </div>
        </NavLink>
      </div>
    </aside>
  )
}
