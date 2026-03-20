'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Transaction } from '@/app/actions/transactions'
import type { Category } from '@/app/actions/categories'

interface CategoryDonutChartProps {
  transactions: Transaction[]
  categories: Category[]
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
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

export function CategoryDonutChart({ transactions, categories }: CategoryDonutChartProps) {
  // Filter only saida and diario transactions
  const spendingTxs = transactions.filter(
    (tx) => tx.type === 'saida' || tx.type === 'diario'
  )

  if (spendingTxs.length === 0) {
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

  // Build category map
  const catMap = new Map(categories.map((c) => [c.id, c]))

  // Group by category
  const totals = new Map<string, number>()
  for (const tx of spendingTxs) {
    const key = tx.category_id ?? '__uncategorized__'
    totals.set(key, (totals.get(key) ?? 0) + Number(tx.amount))
  }

  // Sort by amount descending
  const sorted = Array.from(totals.entries()).sort(([, a], [, b]) => b - a)

  // Top 5 + Outros
  const top5 = sorted.slice(0, 5)
  const rest = sorted.slice(5)
  const othersTotal = rest.reduce((sum, [, v]) => sum + v, 0)

  const slices = top5.map(([catId, amount]) => {
    const cat = catMap.get(catId)
    return {
      name: cat?.name ?? 'Sem categoria',
      value: amount,
      color: cat?.color ?? FALLBACK_COLOR,
    }
  })

  if (othersTotal > 0) {
    slices.push({
      name: 'Outros',
      value: othersTotal,
      color: FALLBACK_COLOR,
    })
  }

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

      {/* Custom legend */}
      <div className="flex flex-col gap-1.5">
        {slices.map((slice) => {
          const pct = total > 0 ? ((slice.value / total) * 100).toFixed(1) : '0'
          return (
            <div key={slice.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                <span
                  className="truncate text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {slice.name}
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
                  {formatMoney(slice.value)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
