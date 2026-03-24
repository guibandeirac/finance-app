'use client'

import { useRouter } from 'next/navigation'
import { format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeftIcon, ChevronRightIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react'
import type { Transaction } from '@/app/actions/transactions'
import type { Category } from '@/app/actions/categories'
import type { MonthlySummaryData, DailyBalanceData } from './page'
import { BalanceChart } from './BalanceChart'
import { CategoryDonutChart } from './CategoryDonutChart'
import { MonthlyBarChart } from './MonthlyBarChart'

interface DashboardClientProps {
  year: number
  month: number
  prevYear: number
  prevMonth: number
  dailyBalances: DailyBalanceData[]
  summary: MonthlySummaryData
  prevSummary: MonthlySummaryData
  transactions: Transaction[]
  categories: Category[]
  cardSpending: { category_id: string | null; amount: number; description: string; item_type: string; expense_date: string | null }[]
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function calcVariation(current: number, prev: number): number | null {
  if (prev === 0) return null
  return ((current - prev) / Math.abs(prev)) * 100
}

interface SummaryCardProps {
  label: string
  value: number
  variation: number | null
  /** If true, higher = better. If false, lower = better. */
  higherIsBetter: boolean
  valueColor?: string
  showSign?: boolean
}

function SummaryCard({ label, value, variation, higherIsBetter, valueColor, showSign }: SummaryCardProps) {
  const isPositiveChange = variation !== null
    ? (higherIsBetter ? variation >= 0 : variation <= 0)
    : null

  return (
    <div
      className="flex flex-col gap-2 rounded-xl p-4"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
      <span
        className="font-mono text-base font-semibold leading-tight"
        style={{ color: valueColor ?? 'var(--text-primary)' }}
      >
        {showSign && value < 0 ? '-' : ''}R$ {formatMoney(Math.abs(value))}
      </span>
      {variation !== null && (
        <div className="flex items-center gap-1">
          {isPositiveChange ? (
            <TrendingUpIcon className="h-3 w-3" style={{ color: 'var(--positive)' }} />
          ) : (
            <TrendingDownIcon className="h-3 w-3" style={{ color: 'var(--negative)' }} />
          )}
          <span
            className="text-xs font-medium"
            style={{ color: isPositiveChange ? 'var(--positive)' : 'var(--negative)' }}
          >
            {variation > 0 ? '+' : ''}{variation.toFixed(1)}% vs mês ant.
          </span>
        </div>
      )}
      {variation === null && (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Sem dados anteriores
        </span>
      )}
    </div>
  )
}

export function DashboardClient({
  year,
  month,
  prevYear,
  prevMonth,
  dailyBalances,
  summary,
  prevSummary,
  transactions,
  categories,
  cardSpending,
}: DashboardClientProps) {
  const router = useRouter()
  const currentDate = new Date(year, month - 1, 1)

  function navigate(direction: 'prev' | 'next') {
    const newDate = direction === 'prev'
      ? subMonths(currentDate, 1)
      : addMonths(currentDate, 1)
    const mes = format(newDate, 'yyyy-MM')
    router.push(`/dashboard?mes=${mes}`)
  }

  const monthLabel = format(currentDate, 'MMMM yyyy', { locale: ptBR })
  const capitalizedLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  const prevMonthDate = new Date(prevYear, prevMonth - 1, 1)
  const prevMonthLabel = format(prevMonthDate, 'MMM yyyy', { locale: ptBR })

  const isBalancePositive = summary.balance_end >= 0

  const entradasVar = calcVariation(summary.entries_total, prevSummary.entries_total)
  const saidasVar = calcVariation(summary.exits_total, prevSummary.exits_total)
  const diarioVar = calcVariation(summary.daily_total, prevSummary.daily_total)
  const balanceVar = calcVariation(summary.balance_end, prevSummary.balance_end)

  return (
    <div className="flex flex-col pb-24 lg:pb-6">
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

      <div className="flex flex-col gap-6 px-4 pt-5">
        {/* Summary cards — 2x2 on mobile, 4-col on desktop */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Total Entradas"
            value={summary.entries_total}
            variation={entradasVar}
            higherIsBetter={true}
            valueColor="var(--positive)"
          />
          <SummaryCard
            label="Total Saídas"
            value={summary.exits_total}
            variation={saidasVar}
            higherIsBetter={false}
            valueColor="var(--negative)"
          />
          <SummaryCard
            label="Total Diário"
            value={summary.daily_total}
            variation={diarioVar}
            higherIsBetter={false}
            valueColor="var(--daily)"
          />
          <SummaryCard
            label="Saldo Final"
            value={summary.balance_end}
            variation={balanceVar}
            higherIsBetter={true}
            valueColor={isBalancePositive ? 'var(--positive)' : 'var(--negative)'}
            showSign={true}
          />
        </div>

        {/* Balance line chart */}
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Evolução do Saldo
          </h2>
          <BalanceChart dailyBalances={dailyBalances} year={year} month={month} />
        </div>

        {/* Bottom charts — donut + bar */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Donut chart */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Gastos por Categoria
            </h2>
            <CategoryDonutChart transactions={transactions} categories={categories} cardSpending={cardSpending} />
          </div>

          {/* Bar chart */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Comparativo Mensal
            </h2>
            <MonthlyBarChart
              currentMonthLabel={capitalizedLabel}
              prevMonthLabel={prevMonthLabel.charAt(0).toUpperCase() + prevMonthLabel.slice(1)}
              currentSummary={summary}
              prevSummary={prevSummary}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
