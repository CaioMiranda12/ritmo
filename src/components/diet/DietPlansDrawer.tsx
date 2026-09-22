import { useState } from 'react'
import { ArrowLeft, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { Drawer } from '../ui/Drawer'
import { ActionMenu } from '../ui/ActionMenu'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { AddMealDrawer } from './AddMealDrawer'
import { MealSlotEditor } from './MealSlotEditor'
import { useDiet } from '../../context/DietContext'
import { weekDays } from '../../lib/mock-data'

type View = 'list' | 'detail'

export function DietPlansDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const {
    dayTypes,
    weekdayAssignments,
    addDayType,
    renameDayType,
    removeDayType,
    duplicateDayType,
    assignWeekday,
    addMealSlot,
    updateMealSlot,
  } = useDiet()

  const [view, setView] = useState<View>('list')
  const [activeDayTypeId, setActiveDayTypeId] = useState<string | null>(null)
  const [assigningWeekday, setAssigningWeekday] = useState<string | null>(null)
  const [isAddingDayType, setIsAddingDayType] = useState(false)
  const [newDayTypeName, setNewDayTypeName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [isSlotDrawerOpen, setSlotDrawerOpen] = useState(false)
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null)

  const activeDayType = dayTypes.find((dt) => dt.id === activeDayTypeId)
  const editingSlot = activeDayType?.meals.find((m) => m.id === editingSlotId)

  function handleClose() {
    setView('list')
    setActiveDayTypeId(null)
    setAssigningWeekday(null)
    setIsAddingDayType(false)
    setNewDayTypeName('')
    onClose()
  }

  function openDetail(dayTypeId: string) {
    setActiveDayTypeId(dayTypeId)
    setView('detail')
  }

  async function handleCreateDayType() {
    if (!newDayTypeName.trim()) return
    const created = await addDayType(newDayTypeName.trim())
    setNewDayTypeName('')
    setIsAddingDayType(false)
    openDetail(created.id)
  }

  function handleMealSlotSubmit(input: { name: string; time: string }) {
    if (!activeDayType) return
    if (editingSlotId) {
      updateMealSlot(activeDayType.id, editingSlotId, input)
    } else {
      addMealSlot(activeDayType.id, input)
    }
    setSlotDrawerOpen(false)
    setEditingSlotId(null)
  }

  return (
    <>
      <Drawer
        open={open}
        title={view === 'list' ? 'Tipos de dia' : activeDayType?.name ?? 'Tipo de dia'}
        onClose={handleClose}
      >
        {view === 'list' && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-text">Dias da semana</p>
              <p className="mt-0.5 text-xs text-text-secondary">Toque em um dia para escolher o tipo.</p>
              <div className="mt-2 grid grid-cols-7 gap-1.5">
                {weekDays.map((day) => {
                  const assignedId = weekdayAssignments[day.code]
                  const assigned = dayTypes.find((dt) => dt.id === assignedId)
                  return (
                    <button
                      key={day.code}
                      onClick={() => setAssigningWeekday((current) => (current === day.code ? null : day.code))}
                      className={[
                        'flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center',
                        assigningWeekday === day.code ? 'border-primary bg-primary-soft/40' : 'border-border',
                      ].join(' ')}
                    >
                      <span className="text-[11px] font-medium text-text-secondary">{day.label}</span>
                      <span
                        className={[
                          'h-2 w-2 rounded-full',
                          assigned ? 'bg-primary' : 'bg-surface-muted',
                        ].join(' ')}
                      />
                    </button>
                  )
                })}
              </div>

              {assigningWeekday && (
                <div className="mt-2 flex flex-wrap gap-1.5 rounded-xl bg-surface-muted p-2.5">
                  <button
                    onClick={() => {
                      assignWeekday(assigningWeekday, null)
                      setAssigningWeekday(null)
                    }}
                    className="rounded-pill border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary"
                  >
                    Nenhum
                  </button>
                  {dayTypes.map((dt) => (
                    <button
                      key={dt.id}
                      onClick={() => {
                        assignWeekday(assigningWeekday, dt.id)
                        setAssigningWeekday(null)
                      }}
                      className={[
                        'rounded-pill border px-3 py-1 text-xs font-medium',
                        weekdayAssignments[assigningWeekday] === dt.id
                          ? 'border-ink bg-ink text-text-onDark'
                          : 'border-border bg-surface text-text',
                      ].join(' ')}
                    >
                      {dt.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-text">Seus tipos de dia</p>
              <div className="space-y-2">
                {dayTypes.map((dayType) => (
                  <div key={dayType.id} className="flex items-center gap-2 rounded-xl border border-border px-3.5 py-3">
                    {renamingId === dayType.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && renameValue.trim()) {
                            renameDayType(dayType.id, renameValue.trim())
                            setRenamingId(null)
                          }
                        }}
                        onBlur={() => {
                          if (renameValue.trim()) renameDayType(dayType.id, renameValue.trim())
                          setRenamingId(null)
                        }}
                        className="h-9 flex-1 rounded-lg border border-border bg-surface px-2.5 text-sm text-text focus:border-primary focus:outline-none"
                      />
                    ) : (
                      <button className="flex-1 text-left" onClick={() => openDetail(dayType.id)}>
                        <p className="text-sm font-medium text-text">{dayType.name}</p>
                        <p className="text-xs text-text-secondary">
                          {dayType.meals.length} refeiç{dayType.meals.length === 1 ? 'ão' : 'ões'}
                        </p>
                      </button>
                    )}
                    <ActionMenu
                      items={[
                        {
                          label: 'Renomear',
                          icon: <Pencil size={14} />,
                          onClick: () => {
                            setRenamingId(dayType.id)
                            setRenameValue(dayType.name)
                          },
                        },
                        {
                          label: 'Duplicar',
                          icon: <Copy size={14} />,
                          onClick: () => duplicateDayType(dayType.id),
                        },
                        {
                          label: 'Excluir',
                          icon: <Trash2 size={14} />,
                          destructive: true,
                          onClick: () => setConfirmDeleteId(dayType.id),
                        },
                      ]}
                    />
                  </div>
                ))}
              </div>

              {isAddingDayType ? (
                <div className="mt-2 flex gap-1.5">
                  <input
                    autoFocus
                    value={newDayTypeName}
                    onChange={(e) => setNewDayTypeName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateDayType()}
                    placeholder="Ex.: Dia de treino"
                    className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-text-secondary focus:border-primary focus:outline-none"
                  />
                  <button onClick={handleCreateDayType} className="rounded-lg bg-ink px-3 text-sm font-medium text-text-onDark">
                    Criar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingDayType(true)}
                  className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary"
                >
                  <Plus size={15} />
                  Novo tipo de dia
                </button>
              )}
            </div>
          </div>
        )}

        {view === 'detail' && activeDayType && (
          <div className="space-y-4">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-1.5 text-sm font-medium text-text-secondary"
            >
              <ArrowLeft size={15} />
              Tipos de dia
            </button>

            <div className="space-y-2">
              {activeDayType.meals.map((slot) => (
                <MealSlotEditor
                  key={slot.id}
                  dayTypeId={activeDayType.id}
                  slot={slot}
                  onEditMeta={() => {
                    setEditingSlotId(slot.id)
                    setSlotDrawerOpen(true)
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => {
                setEditingSlotId(null)
                setSlotDrawerOpen(true)
              }}
              className="flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              <Plus size={15} />
              Nova refeição
            </button>
          </div>
        )}
      </Drawer>

      <AddMealDrawer
        key={editingSlotId ?? 'new-slot'}
        open={isSlotDrawerOpen}
        onClose={() => {
          setSlotDrawerOpen(false)
          setEditingSlotId(null)
        }}
        onSubmit={handleMealSlotSubmit}
        initialValues={editingSlot ? { name: editingSlot.name, time: editingSlot.time } : undefined}
        title={editingSlot ? 'Editar refeição' : 'Nova refeição'}
        submitLabel={editingSlot ? 'Salvar alterações' : 'Adicionar refeição'}
      />

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Excluir tipo de dia?"
        description="As refeições e opções desse tipo de dia serão removidas. Dias da semana associados a ele ficarão sem tipo definido."
        confirmLabel="Excluir"
        tone="destructive"
        onConfirm={() => {
          if (confirmDeleteId) removeDayType(confirmDeleteId)
          if (confirmDeleteId === activeDayTypeId) setView('list')
          setConfirmDeleteId(null)
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </>
  )
}
