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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CardItemDialog } from '@/components/cards/CardItemDialog'
import { deleteCardItem, toggleCardItem, type CreditCard, type CardItemType, type VariableExpense } from '@/app/actions/cards'
import type { Category } from '@/app/actions/categories'

interface CardDetailClientProps {
  card: CreditCard
  items: CardItemType[]
  categories: Category[]
  monthlyTotal: number
  variableExpenses: VariableExpense[]
}

export function CardDetailClient({ card, items, categories, monthlyTotal, variableExpenses }: CardDetailClientProps) {
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
        onSuccess={() => router.refresh()}
      />

      {/* Variable expenses this billing cycle */}
      {variableExpenses.length > 0 && (
        <>
          <div className="my-6" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Gastos do mês
                <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                  ({variableExpenses.length})
                </span>
              </h2>
            </div>
            <div
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: 'var(--border)' }}
            >
              {variableExpenses.map((expense, idx) => {
                const cat = expense.category as { name: string; color: string | null } | null
                return (
                  <div key={expense.id}>
                    {idx > 0 && (
                      <Separator style={{ backgroundColor: 'var(--border)' }} />
                    )}
                    <div
                      className="flex items-center gap-3 px-4 py-3"
                      style={{ backgroundColor: 'var(--surface)' }}
                    >
                      {/* Category dot */}
                      <div
                        className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: cat?.color ? `${cat.color}22` : 'var(--border)' }}
                      >
                        <span
                          className="h-3 w-3 rounded-full block"
                          style={{ backgroundColor: cat?.color ?? '#94A3B8' }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {expense.description ?? 'Sem descrição'}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {cat && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {cat.name}
                            </span>
                          )}
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {new Date(expense.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <span
                        className="font-mono text-sm font-medium shrink-0"
                        style={{ color: 'var(--negative)' }}
                      >
                        {Number(expense.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

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
  onSuccess,
}: SectionProps) {
  const addLabel = itemType === 'fixed' ? 'Adicionar fixo' : 'Adicionar parcela'

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
          <span
            className="ml-2 text-xs font-normal"
            style={{ color: 'var(--text-muted)' }}
          >
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

      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: 'var(--border)' }}
      >
        {items.length === 0 ? (
          <p
            className="px-4 py-6 text-sm text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            {emptyMessage}
          </p>
        ) : (
          items.map((item, idx) => {
            const category = getCategoryById(item.category_id)
            return (
              <div key={item.id}>
                {idx > 0 && (
                  <Separator style={{ backgroundColor: 'var(--border)' }} />
                )}
                <div
                  className="flex items-center gap-3 px-4 py-3 transition-colors"
                  style={{ backgroundColor: item.is_active ? 'var(--surface)' : 'var(--surface-hover)' }}
                >
                  {/* Toggle */}
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={(checked) => onToggle(item, checked)}
                    aria-label={`${item.is_active ? 'Desativar' : 'Ativar'} ${item.description}`}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{
                        color: item.is_active ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {item.description}
                      {item.item_type === 'installment' &&
                        item.current_installment != null &&
                        item.total_installments != null && (
                          <span
                            className="ml-1.5 text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            parcela {item.current_installment}/{item.total_installments}
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
                        <span
                          className="text-xs truncate"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {category.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Amount */}
                  <span
                    className="font-mono text-sm font-medium shrink-0"
                    style={{ color: item.is_active ? 'var(--text-primary)' : 'var(--text-muted)' }}
                  >
                    {Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>

                  {/* Actions dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon-sm" aria-label="Opções do item">
                          <MoreHorizontalIcon className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <CardItemDialog
                        cardId={cardId}
                        item={item}
                        itemType={item.item_type}
                        categories={categories}
                        trigger={
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="cursor-pointer"
                          >
                            <PencilIcon className="mr-2 size-3.5" />
                            Editar
                          </DropdownMenuItem>
                        }
                        onSuccess={onSuccess}
                      />
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
    </div>
  )
}
