import { useState, type ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'

interface ActionMenuItem {
  label: string
  icon: ReactNode
  onClick: () => void
  destructive?: boolean
}

export function ActionMenu({ items }: { items: ActionMenuItem[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-surface-muted"
        aria-label="Mais ações"
        aria-expanded={isOpen}
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen && (
        <>
          <button
            className="fixed inset-0 z-30 cursor-default"
            aria-label="Fechar menu"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-9 z-40 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
            {items.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick()
                  setIsOpen(false)
                }}
                className={[
                  'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium',
                  item.destructive ? 'text-error hover:bg-error/5' : 'text-text hover:bg-surface-muted',
                ].join(' ')}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
