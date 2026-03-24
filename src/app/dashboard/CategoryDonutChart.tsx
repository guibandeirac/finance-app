'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ChevronDownIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/app/actions/transactions'
import type { Category } from '@/app/actions/categories'

interface CardSpendingItem {
  category_id: string | null
  amount: number
  description: string
  item_type: string
  expense_date: string | null
}

interface CategoryDonutChartProps {
  transactions: Transaction[]
  categories: Category[]
  cardSpending?: CardSpendingItem[]
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatValue(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

interface TooltipPayloadItem {
  name: string
  value: number
  payload: { color: string }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0]
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-md"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: item.payload.color }}
        />
        <span className="font-medium">{item.name}</span>
      </div>
      <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
        {formatMoney(item.value)}
      </p>
    </div>
  )
}

const FALLBACK_COLOR = '#64748B'

interface CategoryBreakdown {
  expenses: Transaction[]
  refunds: Transaction[]
  cardItems: CardSpendingItem[]
}

export function CategoryDonutChart({ transactions, categories, cardSpending = [] }: CategoryDonutChartProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const catMap = new Map(categories.map((c) => [c.id, c]))

  // Group by category with offset logic + build per-category breakdown for the dropdown.
  // saida/diario adds to the total; entrada with the same category cancels it out.
  const totals = new Map<string, number>()
  const breakdowns = new Map<string, CategoryBreakdown>()

  for (const tx of transactions.filter((tx) => !tx.is_card_bill)) {
    const key = tx.category_id ?? '__uncategorized__'
    if (!breakdowns.has(key)) breakdowns.set(key, { expenses: [], refunds: [], cardItems: [] })
    const bd = breakdowns.get(key)!

    if (tx.type === 'saida' || tx.type === 'diario') {
      totals.set(key, (totals.get(key) ?? 0) + Number(tx.amount))
      bd.expenses.push(tx)
    } else if (tx.type === 'entrada') {
      totals.set(key, (totals.get(key) ?? 0) - Number(tx.amount))
      bd.refunds.push(tx)
    }
  }
  for (const item of cardSpending) {
    const key = item.category_id ?? '__uncategorized__'
    totals.set(key, (totals.get(key) ?? 0) + item.amount)
    if (!breakdowns.has(key)) breakdowns.set(key, { expenses: [], refunds: [], cardItems: [] })
    breakdowns.get(key)!.cardItems.push(item)
  }

  // Only show categories with positive net spending
  const sorted = Array.from(totals.entries())
    .filter(([, amount]) => amount > 0)
    .sort(([, a], [, b]) => b - a)

  if (sorted.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="space-y-2 w-full">
          <div
            className="h-4 rounded animate-pulse mx-auto"
            style={{ backgroundColor: 'var(--surface-hover)', width: '60%' }}
          />
          <div
            className="h-32 rounded-full animate-pulse mx-auto"
            style={{ backgroundColor: 'var(--surface-hover)', width: '8rem' }}
          />
        </div>
      </div>
    )
  }

  const slices = sorted.map(([catId, amount]) => {
    const cat = catMap.get(catId)
    return {
      name: cat?.name ?? 'Sem categoria',
      value: amount,
      color: cat?.color ?? FALLBACK_COLOR,
    }
  })

  const total = slices.reduce((sum, s) => sum + s.value, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {slices.map((slice, index) => (
                <Cell key={`cell-${index}`} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with expandable breakdown per category */}
      <div className="flex flex-col">
        {sorted.map(([catId, amount]) => {
          const cat = catMap.get(catId)
          const color = cat?.color ?? FALLBACK_COLOR
          const name = cat?.name ?? 'Sem categoria'
          const pct = total > 0 ? ((amount / total) * 100).toFixed(1) : '0'
          const bd = breakdowns.get(catId) ?? { expenses: [], refunds: [], cardItems: [] }
          const hasDetails = bd.expenses.length > 0 || bd.refunds.length > 0 || bd.cardItems.length > 0
          const isOpen = expandedKey === catId

          return (
            <div key={catId}>
              {/* Category row */}
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between gap-2 py-1.5 text-left transition-opacity',
                  hasDetails ? 'cursor-pointer hover:opacity-70' : 'cursor-default'
                )}
                onClick={() => hasDetails && setExpandedKey(isOpen ? null : catId)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {pct}%
                  </span>
                  <span
                    className="font-mono text-xs font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {formatMoney(amount)}
                  </span>
                  {hasDetails && (
                    <ChevronDownIcon
                      className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')}
                      style={{ color: 'var(--text-muted)' }}
                    />
                  )}
                </div>
              </button>

              {/* Expandable breakdown */}
              {isOpen && (
                <div
                  className="mb-1.5 ml-4 flex flex-col gap-0.5 rounded-lg px-3 py-2"
                  style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
                >
                  {/* Individual card items */}
                  {bd.cardItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                        {item.expense_date
                          ? `${item.expense_date.split('-').reverse().slice(0, 2).join('/')} · ${item.description}`
                          : item.description}
                      </span>
                      <span className="flex-shrink-0 font-mono text-xs" style={{ color: 'var(--negative)' }}>
                        −R$ {formatValue(item.amount)}
                      </span>
                    </div>
                  ))}

                  {/* saida / diario transactions */}
                  {bd.expenses.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                        {format(parseISO(tx.date + 'T12:00:00'), 'dd/MM', { locale: ptBR })}
                        {tx.description ? ` · ${tx.description}` : tx.category?.name ? ` · ${tx.category.name}` : ''}
                      </span>
                      <span
                        className="flex-shrink-0 font-mono text-xs"
                        style={{ color: tx.type === 'diario' ? 'var(--daily)' : 'var(--negative)' }}
                      >
                        −R$ {formatValue(Number(tx.amount))}
                      </span>
                    </div>
                  ))}

                  {/* Separator before refunds if there are both */}
                  {bd.refunds.length > 0 && (bd.expenses.length > 0 || bd.cardItems.length > 0) && (
                    <div
                      className="my-1 border-t"
                      style={{ borderColor: 'var(--border)' }}
                    />
                  )}

                  {/* entrada transactions (offsets) */}
                  {bd.refunds.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                        {format(parseISO(tx.date + 'T12:00:00'), 'dd/MM', { locale: ptBR })}
                        {tx.description ? ` · ${tx.description}` : tx.category?.name ? ` · ${tx.category.name}` : ''}
                      </span>
                      <span className="flex-shrink-0 font-mono text-xs" style={{ color: 'var(--positive)' }}>
                        +R$ {formatValue(Number(tx.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
