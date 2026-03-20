'use client'

import { useState } from 'react'
import { format, parseISO, isToday, isFuture } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PlusIcon } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { TransactionCard } from '@/components/transactions/TransactionCard'
import { DraggableTag } from './DraggableTag'
import type { Transaction } from '@/app/actions/transactions'
import type { Category } from '@/app/actions/categories'
import type { CreditCard } from '@/app/actions/cards'

interface DailyBalance {
  date: string
  running_balance: number
  day_total: number
}

interface DailyBalanceRowProps {
  dayData: DailyBalance
  transactions: Transaction[]
  categories: Category[]
  cards?: CreditCard[]
  onAddTransaction?: (date: string) => void
  onMutate?: () => void
}

function formatBalance(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function DailyBalanceRow({
  dayData,
  transactions,
  categories,
  cards,
  onAddTransaction,
  onMutate,
}: DailyBalanceRowProps) {
  const [expanded, setExpanded] = useState(false)

  const { isOver, setNodeRef } = useDroppable({ id: dayData.date })

  const dateObj = parseISO(dayData.date + 'T12:00:00')
  const isCurrentDay = isToday(dateObj)
  const isFutureDay = isFuture(dateObj) && !isCurrentDay
  const dayNum = format(dateObj, 'd')
  const dayName = format(dateObj, 'EEE', { locale: ptBR })
  const isNegativeBalance = dayData.running_balance < 0

  const MAX_VISIBLE_TAGS = 3
  const visibleTransactions = transactions.slice(0, MAX_VISIBLE_TAGS)
  const hiddenCount = Math.max(0, transactions.length - MAX_VISIBLE_TAGS)

  return (
    <div
      ref={setNodeRef}
      className={cn('rounded-xl border transition-all', isCurrentDay ? 'border-l-2' : 'border')}
      style={{
        borderLeftColor: isCurrentDay ? 'var(--accent-color)' : undefined,
        backgroundColor: isNegativeBalance
          ? 'color-mix(in srgb, var(--negative-bg) 30%, var(--surface))'
          : 'var(--surface)',
        opacity: isFutureDay ? 0.65 : 1,
        // Drop highlight: blue outline when a drag is hovering this row
        outline: isOver ? '2px solid var(--accent-color)' : '2px solid transparent',
        outlineOffset: '1px',
      }}
    >
      {/* Row header — clickable to expand */}
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Day number + name */}
        <div className="flex w-10 shrink-0 flex-col items-center">
          <span
            className="text-lg font-bold leading-none"
            style={{ color: isCurrentDay ? 'var(--accent-color)' : 'var(--text-primary)' }}
          >
            {dayNum}
          </span>
          <span
            className="mt-0.5 text-[10px] uppercase tracking-wide"
            style={{ color: 'var(--text-muted)' }}
          >
            {dayName}
          </span>
        </div>

        {/* Transaction tags — each one is draggable */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {transactions.length === 0 ? (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Sem movimentações
            </span>
          ) : (
            <>
              {visibleTransactions.map((tx) => (
                <DraggableTag key={tx.id} transaction={tx} />
              ))}
              {hiddenCount > 0 && (
                <span
                  className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  +{hiddenCount} mais
                </span>
              )}
            </>
          )}
        </div>

        {/* Running balance */}
        <div className="shrink-0 text-right">
          <span
            className="font-mono text-sm font-semibold"
            style={{ color: isNegativeBalance ? 'var(--negative)' : 'var(--text-primary)' }}
          >
            R$ {formatBalance(dayData.running_balance)}
          </span>
        </div>
      </button>

      {/* Expanded: transaction list + add button */}
      {expanded && (
        <div
          className="border-t px-4 pb-3 pt-2 flex flex-col gap-2"
          style={{ borderColor: 'var(--border)' }}
        >
          {transactions.length === 0 ? (
            <p className="py-2 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Nenhuma transação neste dia.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {transactions.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  categories={categories}
                  cards={cards}
                  onMutate={onMutate}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => onAddTransaction?.(dayData.date)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--surface-hover)] self-start"
            style={{ color: 'var(--accent-color)' }}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Adicionar
          </button>
        </div>
      )}
    </div>
  )
}
