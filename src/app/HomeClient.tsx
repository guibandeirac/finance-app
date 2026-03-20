'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, addMonths, subMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import { DailyBalanceRow } from '@/components/balance/DailyBalanceRow'
import { TagOverlay } from '@/components/balance/DraggableTag'
import { AddTransactionButton } from '@/components/transactions/AddTransactionButton'
import { updateTransaction, type Transaction } from '@/app/actions/transactions'
import type { Category } from '@/app/actions/categories'
import type { CreditCard } from '@/app/actions/cards'

interface DailyBalance {
  date: string
  running_balance: number
  day_total: number
}

interface MonthlySummary {
  total_entrada: number
  total_saida: number
  total_diario: number
  net_balance: number
}

interface HomeClientProps {
  year: number
  month: number
  dailyBalances: DailyBalance[]
  summary: MonthlySummary | null
  transactions: Transaction[]
  categories: Category[]
  cards: CreditCard[]
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function HomeClient({
  year,
  month,
  dailyBalances,
  summary,
  transactions,
  categories,
  cards,
}: HomeClientProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const currentDate = new Date(year, month - 1, 1)

  const [addForDate, setAddForDate] = useState<string | null>(null)
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [activeTx, setActiveTx] = useState<Transaction | null>(null)

  // Require 8px movement before drag starts — prevents accidental drags on tap/click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey
      if (!isMod) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); navigate('prev') }
      else if (e.key === 'ArrowRight') { e.preventDefault(); navigate('next') }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  function navigate(direction: 'prev' | 'next') {
    const newDate = direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1)
    router.push(`/?mes=${format(newDate, 'yyyy-MM')}`)
  }

  function handleAddForDate(date: string) {
    setAddForDate(date)
    setAddSheetOpen(true)
  }

  function handleDragStart(event: DragStartEvent) {
    const tx = transactions.find((t) => t.id === event.active.id)
    setActiveTx(tx ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTx(null)

    if (!over) return
    const newDate = over.id as string
    const tx = transactions.find((t) => t.id === active.id)
    if (!tx || tx.date === newDate) return

    // Validate target date is within the same month
    const [oy, om] = newDate.split('-').map(Number)
    if (oy !== year || om !== month) return

    startTransition(async () => {
      const result = await updateTransaction(tx.id, { date: newDate })
      if (result.error) {
        toast.error(`Erro ao mover transação: ${result.error}`)
      } else {
        toast.success(`Movido para dia ${parseISO(newDate + 'T12:00:00').getDate()}`)
        router.refresh()
      }
    })
  }

  // Group transactions by date
  const txByDate = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = []
    acc[tx.date].push(tx)
    return acc
  }, {})

  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: ptBR })
  const capitalizedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  const netBalance = summary?.net_balance ?? 0
  const isNetPositive = netBalance >= 0

  return (
    <div className="flex flex-col">
      {/* Month selector */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b"
        style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <button
          onClick={() => navigate('prev')}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
          aria-label="Mês anterior"
        >
          <ChevronLeftIcon className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {capitalizedLabel}
        </span>
        <button
          onClick={() => navigate('next')}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
          aria-label="Próximo mês"
        >
          <ChevronRightIcon className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-4 pb-3 lg:grid-cols-4">
        {[
          { label: 'Entradas', value: summary?.total_entrada ?? 0, color: 'var(--positive)',  bg: 'var(--positive-bg)' },
          { label: 'Saídas',   value: summary?.total_saida   ?? 0, color: 'var(--negative)',  bg: 'var(--negative-bg)' },
          { label: 'Diário',   value: summary?.total_diario  ?? 0, color: 'var(--daily)',     bg: 'var(--daily-bg)'    },
          {
            label: 'Saldo', value: netBalance,
            color: isNetPositive ? 'var(--positive)' : 'var(--negative)',
            bg:    isNetPositive ? 'var(--positive-bg)' : 'var(--negative-bg)',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="flex flex-col gap-1 rounded-xl p-3"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {card.label}
            </span>
            <span className="font-mono text-base font-semibold" style={{ color: card.color }}>
              R$ {formatMoney(Math.abs(card.value))}
            </span>
          </div>
        ))}
      </div>

      {/* Daily balance list wrapped in DndContext */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-2 px-4 pb-24 lg:pb-6">
          {dailyBalances.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <p className="text-sm">Nenhum dado para este mês.</p>
            </div>
          ) : (
            dailyBalances.map((day) => (
              <DailyBalanceRow
                key={day.date}
                dayData={day}
                transactions={txByDate[day.date] ?? []}
                categories={categories}
                cards={cards}
                onAddTransaction={handleAddForDate}
                onMutate={() => router.refresh()}
              />
            ))
          )}
        </div>

        {/* Floating snapshot of the tag being dragged */}
        <DragOverlay dropAnimation={null}>
          {activeTx ? <TagOverlay transaction={activeTx} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Add transaction button (FAB on mobile, button on desktop) */}
      <AddTransactionButton
        categories={categories}
        onSuccess={() => router.refresh()}
      />

      {/* Sheet for adding transaction on a specific date */}
      {addForDate && addSheetOpen && (
        <AddTransactionButton
          key={addForDate}
          categories={categories}
          onSuccess={() => {
            setAddSheetOpen(false)
            setAddForDate(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
