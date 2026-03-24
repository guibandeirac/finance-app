'use client'

import { useState, useEffect, useTransition } from 'react'
import { PlusIcon, Trash2Icon, LoaderIcon, PencilIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  getCardBillBreakdown,
  createVariableCardItem,
  deleteVariableCardItem,
  updateCardItem,
  upsertCardItemOverride,
  type BillBreakdown,
  type BillBreakdownItem,
} from '@/app/actions/cards'
import type { Category } from '@/app/actions/categories'

interface CardBillBreakdownProps {
  creditCardId: string
  year: number
  month: number
  categories: Category[]
  onMutate?: () => void
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatAmountDisplay(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return (parseInt(digits, 10) / 100).toFixed(2).replace('.', ',')
}

function parseAmount(display: string): number {
  return parseFloat(display.replace(/\./g, '').replace(',', '.')) || 0
}

export function CardBillBreakdown({
  creditCardId,
  year,
  month,
  categories,
  onMutate,
}: CardBillBreakdownProps) {
  const [breakdown, setBreakdown] = useState<BillBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Add form state
  const [addDesc, setAddDesc] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [addCatId, setAddCatId] = useState<string>('')
  const [addExpenseDate, setAddExpenseDate] = useState<string>('')

  // Edit state
  const [editingItem, setEditingItem] = useState<BillBreakdownItem | null>(null)
  const [editDesc, setEditDesc] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCatId, setEditCatId] = useState('')
  const [editExpenseDate, setEditExpenseDate] = useState<string>('')

  function fetchBreakdown() {
    setLoading(true)
    getCardBillBreakdown(creditCardId, year, month).then(({ data }) => {
      setBreakdown(data)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchBreakdown()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creditCardId, year, month])

  function startEdit(item: BillBreakdownItem) {
    setEditingItem(item)
    setEditDesc(item.description)
    setEditAmount(item.amount.toFixed(2).replace('.', ','))
    setEditCatId(item.category_id ?? '')
    setEditExpenseDate(item.expense_date ?? '')
  }

  const referenceMonth = `${year}-${String(month).padStart(2, '0')}-01`

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingItem) return
    if (!editDesc.trim()) { toast.error('Descrição obrigatória.'); return }
    const amount = parseAmount(editAmount)
    if (!amount || amount <= 0) { toast.error('Valor inválido.'); return }

    startTransition(async () => {
      // Fixed items: save as a month-specific override (never touch the global template)
      // Variable/installment items: edit globally (they are already month-scoped)
      const isFixed = editingItem.item_type === 'fixed'
      const result = isFixed
        ? await upsertCardItemOverride(editingItem.id, referenceMonth, {
            amount,
            category_id: editCatId || null,
          })
        : await updateCardItem(editingItem.id, {
            amount,
            category_id: editCatId || null,
            ...(editingItem.item_type === 'variable' && { expense_date: editExpenseDate || null }),
          })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Item atualizado!')
        setEditingItem(null)
        fetchBreakdown()
        onMutate?.()
      }
    })
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!addDesc.trim()) { toast.error('Descrição obrigatória.'); return }
    const amount = parseAmount(addAmount)
    if (!amount || amount <= 0) { toast.error('Valor inválido.'); return }

    const referenceMonth = `${year}-${String(month).padStart(2, '0')}-01`

    startTransition(async () => {
      const result = await createVariableCardItem({
        card_id: creditCardId,
        description: addDesc.trim(),
        amount,
        category_id: addCatId || null,
        reference_month: referenceMonth,
        expense_date: addExpenseDate || null,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Gasto adicionado!')
        setAddDesc('')
        setAddAmount('')
        setAddCatId('')
        setAddExpenseDate('')
        setShowAddForm(false)
        fetchBreakdown()
        onMutate?.()
      }
    })
  }

  function handleDeleteVariable(item: BillBreakdownItem) {
    startTransition(async () => {
      const result = await deleteVariableCardItem(item.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Gasto removido.')
        fetchBreakdown()
        onMutate?.()
      }
    })
  }

  function handleDeleteFixed(item: BillBreakdownItem) {
    // Creates a month-specific "deleted" override — does NOT remove the global template
    startTransition(async () => {
      const result = await upsertCardItemOverride(item.id, referenceMonth, { is_deleted: true })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Removido somente neste mês.')
        fetchBreakdown()
        onMutate?.()
      }
    })
  }

  const expenseCategories = categories.filter(
    (c) => c.type === 'saida' || c.type === 'all'
  )

  const editForm = (
    <form onSubmit={handleEditSubmit} className="flex flex-col gap-2 px-3 py-2" style={{ backgroundColor: 'var(--surface)' }}>
      <Input
        placeholder="Descrição"
        value={editDesc}
        onChange={(e) => setEditDesc(e.target.value)}
        disabled={isPending}
        autoFocus
      />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
            style={{ color: 'var(--text-secondary)' }}
          >
            R$
          </span>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="0,00"
            value={editAmount}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '')
              setEditAmount(raw ? formatAmountDisplay(raw) : '')
            }}
            disabled={isPending}
            className="pl-9 font-mono"
          />
        </div>
        <Select
          value={editCatId}
          onValueChange={(v) => setEditCatId(v === '__none__' ? '' : (v ?? ''))}
        >
          <SelectTrigger className="flex-1" size="default">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Sem categoria</SelectItem>
            {expenseCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {editingItem?.item_type === 'variable' && (
        <Input
          type="date"
          value={editExpenseDate}
          onChange={(e) => setEditExpenseDate(e.target.value)}
          disabled={isPending}
          style={{ colorScheme: 'dark' }}
        />
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => setEditingItem(null)}
          disabled={isPending}
        >
          <XIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="submit"
          size="sm"
          className="flex-1"
          disabled={isPending}
          style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}
        >
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 gap-2" style={{ color: 'var(--text-muted)' }}>
        <LoaderIcon className="h-4 w-4 animate-spin" />
        <span className="text-xs">Carregando fatura...</span>
      </div>
    )
  }

  if (!breakdown) return null

  const { fixed, installments, variable, totals } = breakdown

  return (
    <div className="flex flex-col gap-3">
      {/* Mini-summary */}
      <div
        className="flex flex-wrap gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-xs"
        style={{ backgroundColor: 'var(--background)', color: 'var(--text-muted)' }}
      >
        <span>Fixos: <strong style={{ color: 'var(--text-secondary)' }}>{fmt(totals.fixed)}</strong></span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>Parcelas: <strong style={{ color: 'var(--text-secondary)' }}>{fmt(totals.installments)}</strong></span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>Variáveis: <strong style={{ color: 'var(--text-secondary)' }}>{fmt(totals.variable)}</strong></span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>Total: <strong style={{ color: 'var(--card-bill)' }}>{fmt(totals.total)}</strong></span>
      </div>

      {/* Fixos */}
      {fixed.length > 0 && (
        <Section
          title="Fixos"
          items={fixed}
          editingItemId={editingItem?.id ?? null}
          editForm={editForm}
          onEdit={startEdit}
          onDelete={handleDeleteFixed}
        />
      )}

      {/* Parcelas */}
      {installments.length > 0 && (
        <Section title="Parcelas" items={installments} />
      )}

      {/* Variáveis */}
      <div>
        <p className="mb-1.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Variáveis
          {variable.length > 0 && (
            <span className="ml-1.5 font-normal" style={{ color: 'var(--text-muted)' }}>
              ({variable.length})
            </span>
          )}
        </p>

        {variable.length > 0 && (
          <div
            className="mb-2 rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--border)' }}
          >
            {variable.map((item, idx) => {
              const cat = expenseCategories.find((c) => c.id === item.category_id)
              const isEditing = editingItem?.id === item.id
              return (
                <div key={item.id}>
                  {idx > 0 && <Separator style={{ backgroundColor: 'var(--border)' }} />}
                  {isEditing ? editForm : (
                    <div
                      className="flex items-center gap-2 px-3 py-2"
                      style={{ backgroundColor: 'var(--surface)' }}
                    >
                      {cat?.color && (
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="block truncate text-xs" style={{ color: 'var(--text-primary)' }}>
                          {item.description}
                        </span>
                        {item.expense_date && (
                          <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                            {item.expense_date.split('-').reverse().slice(0, 2).join('/')}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs shrink-0" style={{ color: 'var(--negative)' }}>
                        {fmt(Number(item.amount))}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        disabled={isPending}
                        className="shrink-0 rounded p-0.5 hover:bg-[var(--surface-hover)] disabled:opacity-40"
                        aria-label="Editar"
                      >
                        <PencilIcon className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVariable(item)}
                        disabled={isPending}
                        className="shrink-0 rounded p-0.5 hover:bg-[var(--surface-hover)] disabled:opacity-40"
                        aria-label="Remover"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add form */}
        {showAddForm ? (
          <form
            onSubmit={handleAddSubmit}
            className="flex flex-col gap-2 rounded-lg border p-3"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
          >
            <Input
              placeholder="Descrição"
              value={addDesc}
              onChange={(e) => setAddDesc(e.target.value)}
              disabled={isPending}
              autoFocus
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  R$
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={addAmount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '')
                    setAddAmount(raw ? formatAmountDisplay(raw) : '')
                  }}
                  disabled={isPending}
                  className="pl-9 font-mono"
                />
              </div>
              <Select
                value={addCatId}
                onValueChange={(v) => setAddCatId(v === '__none__' ? '' : (v ?? ''))}
              >
                <SelectTrigger className="flex-1" size="default">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem categoria</SelectItem>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              type="date"
              value={addExpenseDate}
              onChange={(e) => setAddExpenseDate(e.target.value)}
              disabled={isPending}
              style={{ colorScheme: 'dark' }}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowAddForm(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="flex-1"
                disabled={isPending}
                style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}
              >
                {isPending ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface-hover)]"
            style={{ color: 'var(--accent-color)' }}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Adicionar gasto
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Section sub-component ─────────────────────────────────────────────────────

interface SectionProps {
  title: string
  items: BillBreakdownItem[]
  editingItemId?: string | null
  editForm?: React.ReactNode
  onEdit?: (item: BillBreakdownItem) => void
  onDelete?: (item: BillBreakdownItem) => void
}

function Section({ title, items, editingItemId, editForm, onEdit, onDelete }: SectionProps) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {title}
        <span className="ml-1.5 font-normal" style={{ color: 'var(--text-muted)' }}>
          ({items.length})
        </span>
      </p>
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: 'var(--border)' }}
      >
        {items.map((item, idx) => {
          const isEditing = editingItemId === item.id
          return (
            <div key={item.id}>
              {idx > 0 && <Separator style={{ backgroundColor: 'var(--border)' }} />}
              {isEditing && editForm ? editForm : (
                <div
                  className="flex items-center gap-2 px-3 py-2"
                  style={{ backgroundColor: 'var(--surface)' }}
                >
                  <span className="flex-1 min-w-0 truncate text-xs" style={{ color: 'var(--text-primary)' }}>
                    {item.description}
                    {item.item_type === 'installment' && item.current_inst != null && item.total_inst != null && (
                      <span className="ml-1.5" style={{ color: 'var(--text-muted)' }}>
                        {item.current_inst}/{item.total_inst}
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>
                    {fmt(Number(item.amount))}
                  </span>
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="shrink-0 rounded p-0.5 hover:bg-[var(--surface-hover)]"
                      aria-label="Editar"
                    >
                      <PencilIcon className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="shrink-0 rounded p-0.5 hover:bg-[var(--surface-hover)]"
                      aria-label="Remover"
                    >
                      <Trash2Icon className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
