import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 sm:items-stretch">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-sm flex-col bg-surface shadow-xl sm:m-4 sm:h-auto sm:max-h-[90vh] sm:rounded-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-semibold text-text">{title}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text" aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
