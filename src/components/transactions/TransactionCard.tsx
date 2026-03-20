'use client'

import { useState, useTransition } from 'react'
import { MoreVerticalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import { deleteTransaction, type Transaction } from '@/app/actions/transactions'
import type { Category } from '@/app/actions/categories'
import type { CreditCard } from '@/app/actions/cards'
import { cn } from '@/lib/utils'

const TYPE_COLORS: Record<string, string> = {
  entrada: 'var(--positive)',
  saida: 'var(--negative)',
  diario: 'var(--daily)',
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

interface TransactionCardProps {
  transaction: Transaction
  categories: Category[]
  cards?: CreditCard[]
  onMutate?: () => void
}

export function TransactionCard({ transaction, categories, cards, onMutate }: TransactionCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const category = transaction.category
  const dotColor = category?.color ?? '#94A3B8'
  const displayName = transaction.description || category?.name || 'Sem descrição'
  const amountColor = TYPE_COLORS[transaction.type] ?? 'var(--text-primary)'
  const isCardBill = transaction.is_card_bill
  const isCardExpense = !isCardBill && !!transaction.credit_card_id

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTransaction(transaction.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Transação excluída.')
        setDeleteOpen(false)
        onMutate?.()
      }
    })
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border px-4 transition-colors',
          isCardBill ? 'cursor-default' : 'cursor-pointer hover:bg-[var(--surface-hover)]',
          'bg-[var(--surface)] border-[var(--border)]'
        )}
        style={{ minHeight: 56 }}
        onClick={() => !isCardBill && setEditOpen(true)}
      >
        {/* Left: color dot */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${dotColor}22` }}
        >
          <span
            className="h-3 w-3 rounded-full block"
            style={{ backgroundColor: dotColor }}
          />
        </div>

        {/* Middle: name + category */}
        <div className="min-w-0 flex-1 py-3">
          <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {displayName}
          </p>
          {category && (
            <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--text-muted)' }}>
              {category.name}
            </p>
          )}
        </div>

        {/* Right: amount + badges + menu */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex flex-col items-end gap-1">
            <span className="font-mono text-sm font-semibold" style={{ color: amountColor }}>
              {transaction.type === 'saida' ? '−' : '+'}R$ {formatAmount(transaction.amount)}
            </span>
            <div className="flex gap-1">
              {transaction.recurring_id && (
                <Badge
                  className="text-[10px] px-1 py-0 border-0"
                  style={{ backgroundColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Recorrente
                </Badge>
              )}
              {isCardBill && (
                <Badge
                  className="text-[10px] px-1 py-0 border-0"
                  style={{ backgroundColor: 'var(--card-bill-bg)', color: 'var(--card-bill)' }}
                >
                  Fatura
                </Badge>
              )}
              {isCardExpense && (
                <Badge
                  className="text-[10px] px-1 py-0 border-0"
                  style={{ backgroundColor: 'var(--accent-bg, #DBEAFE)', color: 'var(--accent-color)' }}
                >
                  Cartão
                </Badge>
              )}
            </div>
          </div>

          {/* Dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Opções" />
              }
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <MoreVerticalIcon className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {!isCardBill && (
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); setEditOpen(true) }}
                  style={{ color: 'var(--text-primary)' }}
                >
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); setDeleteOpen(true) }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2Icon className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Edit Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent
          side="bottom"
          className="h-[90dvh] rounded-t-2xl p-0 sm:h-full sm:max-w-md sm:rounded-none"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <TransactionForm
            transaction={transaction}
            categories={categories}
            cards={cards}
            onSuccess={() => {
              setEditOpen(false)
              onMutate?.()
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Delete confirm dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent style={{ backgroundColor: 'var(--surface)' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--text-primary)' }}>Excluir transação</DialogTitle>
            <DialogDescription style={{ color: 'var(--text-secondary)' }}>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
