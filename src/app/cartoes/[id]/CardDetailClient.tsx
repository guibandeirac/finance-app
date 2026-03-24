'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeftIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  PlusIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CardItemDialog } from '@/components/cards/CardItemDialog'
import {
  deleteCardItem,
  toggleCardItem,
  createVariableCardItem,
  deleteVariableCardItem,
  type CreditCard,
  type CardItemType,
  type VariableExpense,
} from '@/app/actions/cards'
import type { Category } from '@/app/actions/categories'

interface CardDetailClientProps {
  card: CreditCard
  items: CardItemType[]
  categories: Category[]
  monthlyTotal: number
  variableExpenses: VariableExpense[]
  year: number
  month: number
}

function formatAmountDisplay(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return (parseInt(digits, 10) / 100).toFixed(2).replace('.', ',')
}

function parseAmount(display: string): number {
  return parseFloat(display.replace(/\./g, '').replace(',', '.')) || 0
}

export function CardDetailClient({
  card,
  items,
  categories,
  monthlyTotal,
  variableExpenses,
  year,
  month,
}: CardDetailClientProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [confirmItem, setConfirmItem] = useState<CardItemType | null>(null)

  const fixedItems = items.filter((item) => item.item_type === 'fixed')
  const installmentItems = items.filter((item) => item.item_type === 'installment')

  function handleToggle(item: CardItemType, checked: boolean) {
    startTransition(async () => {
      const result = await toggleCardItem(item.id, checked)
      if (result.error) {
        toast.error(result.error)
      } else {
        router.refresh()
      }
    })
  }

  function handleDeleteRequest(item: CardItemType) {
    setConfirmItem(item)
  }

  function handleDeleteConfirm() {
    if (!confirmItem) return
    const item = confirmItem
    startTransition(async () => {
      const result = await deleteCardItem(item.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Item excluído.')
        router.refresh()
      }
    })
  }

  function getCategoryById(id: string | null) {
    if (!id) return null
    return categories.find((c) => c.id === id) ?? null
  }

  /** Compute current/total installment numbers for a given viewed month */
  function computeInstallment(item: CardItemType) {
    if (!item.start_month || !item.end_month) return null
    const [sy, sm] = item.start_month.split('-').map(Number)
    const [ey, em] = item.end_month.split('-').map(Number)
    const current = (year - sy) * 12 + (month - sm) + 1
    const total = (ey - sy) * 12 + (em - sm) + 1
    return { current, total }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2"
        onClick={() => router.push('/cartoes')}
        style={{ color: 'var(--text-secondary)' }}
      >
        <ArrowLeftIcon className="mr-1 size-4" />
        Cartões
      </Button>

      {/* Card header */}
      <div
        className="mb-6 rounded-xl border p-5"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="h-4 w-4 rounded-full shrink-0"
            style={{ backgroundColor: card.color }}
            aria-hidden="true"
          />
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {card.name}
          </h1>
        </div>
        <p
          className="font-mono text-3xl font-bold mb-1"
          style={{ color: 'var(--card-bill)' }}
        >
          {monthlyTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Fatura do mês &bull; Vence dia{' '}
          <span style={{ color: 'var(--text-secondary)' }}>{card.due_day}</span>
          {card.closing_day && (
            <>
              {' '}&bull; Fecha dia{' '}
              <span style={{ color: 'var(--text-secondary)' }}>{card.closing_day}</span>
            </>
          )}
        </p>
      </div>

      {/* Fixed items section */}
      <Section
        title="Fixos"
        emptyMessage="Nenhum item fixo."
        items={fixedItems}
        categories={categories}
        cardId={card.id}
        itemType="fixed"
        onToggle={handleToggle}
        onDelete={handleDeleteRequest}
        getCategoryById={getCategoryById}
        computeInstallment={computeInstallment}
        onSuccess={() => router.refresh()}
      />

      <div className="my-6" />

      {/* Installment items section */}
      <Section
        title="Parcelas"
        emptyMessage="Nenhuma parcela."
        items={installmentItems}
        categories={categories}
        cardId={card.id}
        itemType="installment"
        onToggle={handleToggle}
        onDelete={handleDeleteRequest}
        getCategoryById={getCategoryById}
        computeInstallment={computeInstallment}
        onSuccess={() => router.refresh()}
      />

      <div className="my-6" />

      {/* Variable expenses section */}
      <VariableSection
        cardId={card.id}
        categories={categories}
        expenses={variableExpenses}
        year={year}
        month={month}
        onMutate={() => router.refresh()}
      />

      <ConfirmDialog
        open={confirmItem !== null}
        onOpenChange={(open) => { if (!open) setConfirmItem(null) }}
        title="Excluir item"
        description={confirmItem ? `Excluir "${confirmItem.description}"?` : undefined}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

// ─── Section sub-component ────────────────────────────────────────────────────

interface SectionProps {
  title: string
  emptyMessage: string
  items: CardItemType[]
  categories: Category[]
  cardId: string
  itemType: 'fixed' | 'installment'
  onToggle: (item: CardItemType, checked: boolean) => void
  onDelete: (item: CardItemType) => void
  getCategoryById: (id: string | null) => Category | null
  computeInstallment: (item: CardItemType) => { current: number; total: number } | null
  onSuccess: () => void
}

function Section({
  title,
  emptyMessage,
  items,
  categories,
  cardId,
  itemType,
  onToggle,
  onDelete,
  getCategoryById,
  computeInstallment,
  onSuccess,
}: SectionProps) {
  const addLabel = itemType === 'fixed' ? 'Adicionar fixo' : 'Adicionar parcela'
  const [editItem, setEditItem] = useState<CardItemType | null>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
          <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
            ({items.length})
          </span>
        </h2>

        <CardItemDialog
          cardId={cardId}
          itemType={itemType}
          categories={categories}
          trigger={
            <Button
              variant="outline"
              size="sm"
              style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <PlusIcon className="size-3.5 mr-1" />
              {addLabel}
            </Button>
          }
          onSuccess={onSuccess}
        />
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            {emptyMessage}
          </p>
        ) : (
          items.map((item, idx) => {
            const category = getCategoryById(item.category_id)
            const inst = computeInstallment(item)
            return (
              <div key={item.id}>
                {idx > 0 && <Separator style={{ backgroundColor: 'var(--border)' }} />}
                <div
                  className="flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{ backgroundColor: item.is_active ? 'var(--surface)' : 'var(--surface-hover)' }}
                >
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={(checked) => onToggle(item, checked)}
                    aria-label={`${item.is_active ? 'Desativar' : 'Ativar'} ${item.description}`}
                  />

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: item.is_active ? 'var(--text-primary)' : 'var(--text-muted)' }}
                    >
                      {item.description}
                      {item.item_type === 'installment' && inst && (
                        <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                          parcela {inst.current}/{inst.total}
                        </span>
                      )}
                    </p>
                    {category && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: category.color ?? '#94A3B8' }}
                          aria-hidden="true"
                        />
                        <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {category.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <span
                    className="font-mono text-sm font-medium shrink-0"
                    style={{ color: item.is_active ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" aria-label="Opções do item">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditItem(item)}
                        className="cursor-pointer"
                      >
                        <PencilIcon className="mr-2 size-3.5" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(item)}
                        className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash2Icon className="mr-2 size-3.5" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Edit dialog — controlled externally, opened from dropdown */}
      <CardItemDialog
        key={editItem?.id ?? 'none'}
        cardId={cardId}
        item={editItem ?? undefined}
        itemType={(editItem?.item_type as 'fixed' | 'installment') ?? itemType}
        categories={categories}
        open={editItem !== null}
        onOpenChange={(open) => { if (!open) setEditItem(null) }}
        onSuccess={() => { setEditItem(null); onSuccess() }}
      />
    </div>
  )
}

// ─── Variable expenses section ─────────────────────────────────────────────────

interface VariableSectionProps {
  cardId: string
  categories: Category[]
  expenses: VariableExpense[]
  year: number
  month: number
  onMutate: () => void
}

function VariableSection({ cardId, categories, expenses, year, month, onMutate }: VariableSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [desc, setDesc] = useState('')
  const [amountDisplay, setAmountDisplay] = useState('')
  const [catId, setCatId] = useState<string>('')
  const [expenseDate, setExpenseDate] = useState<string>('')

  const expenseCategories = categories.filter((c) => c.type === 'saida' || c.type === 'all')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!desc.trim()) { toast.error('Descrição obrigatória.'); return }
    const amount = parseAmount(amountDisplay)
    if (!amount || amount <= 0) { toast.error('Valor inválido.'); return }

    const referenceMonth = `${year}-${String(month).padStart(2, '0')}-01`

    startTransition(async () => {
      const result = await createVariableCardItem({
        card_id: cardId,
        description: desc.trim(),
        amount,
        category_id: catId || null,
        reference_month: referenceMonth,
        expense_date: expenseDate || null,
      })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Gasto adicionado!')
        setDesc('')
        setAmountDisplay('')
        setCatId('')
        setExpenseDate('')
        setShowForm(false)
        onMutate()
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteVariableCardItem(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Gasto removido.')
        onMutate()
      }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          Variáveis
          <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
            ({expenses.length})
          </span>
        </h2>
      </div>

      {expenses.length > 0 && (
        <div className="rounded-xl border overflow-hidden mb-3" style={{ borderColor: 'var(--border)' }}>
          {expenses.map((expense, idx) => {
            const cat = expense.category as { name: string; color: string | null } | null
            return (
              <div key={expense.id}>
                {idx > 0 && <Separator style={{ backgroundColor: 'var(--border)' }} />}
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ backgroundColor: 'var(--surface)' }}
                >
                  <div
                    className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: cat?.color ? `${cat.color}22` : 'var(--border)' }}
                  >
                    <span
                      className="h-3 w-3 rounded-full block"
                      style={{ backgroundColor: cat?.color ?? '#94A3B8' }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {expense.description ?? 'Sem descrição'}
                    </p>
                    <div className="flex items-center gap-2">
                      {cat && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {cat.name}
                        </span>
                      )}
                      {expense.expense_date && (
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                          {expense.expense_date.split('-').reverse().slice(0, 2).join('/')}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="font-mono text-sm font-medium shrink-0" style={{ color: 'var(--negative)' }}>
                    {Number(expense.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDelete(expense.id)}
                    disabled={isPending}
                    className="rounded p-1 hover:bg-[var(--surface-hover)] disabled:opacity-40"
                    aria-label="Remover gasto"
                  >
                    <Trash2Icon className="size-4" style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-xl border p-4"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
        >
          <Input
            placeholder="Descrição"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            disabled={isPending}
            autoFocus
          />
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                style={{ color: 'var(--text-secondary)' }}
              >
                R$
              </span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={amountDisplay}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  setAmountDisplay(raw ? formatAmountDisplay(raw) : '')
                }}
                disabled={isPending}
                className="pl-9 font-mono"
              />
            </div>
            <Select
              value={catId}
              onValueChange={(v) => setCatId(v === '__none__' ? '' : (v ?? ''))}
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
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            disabled={isPending}
            placeholder="Data do gasto (opcional)"
            style={{ colorScheme: 'dark' }}
          />
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowForm(false)}
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
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--surface-hover)]"
          style={{ color: 'var(--accent-color)' }}
        >
          <PlusIcon className="size-4" />
          Adicionar gasto variável
        </button>
      )}
    </div>
  )
}
