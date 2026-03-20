'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { MonthlySummaryData } from './page'

interface MonthlyBarChartProps {
  currentMonthLabel: string
  prevMonthLabel: string
  currentSummary: MonthlySummaryData
  prevSummary: MonthlySummaryData
}

function formatShort(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}K`
  return `${sign}${abs.toFixed(0)}`
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
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-md"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
      }}
    >
      <p className="mb-2 font-semibold">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
          </div>
          <span className="font-mono font-medium">{formatMoney(item.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function MonthlyBarChart({
  currentMonthLabel,
  prevMonthLabel,
  currentSummary,
  prevSummary,
}: MonthlyBarChartProps) {
  const data = [
    {
      month: prevMonthLabel,
      Entradas: prevSummary.entries_total,
      Saídas: prevSummary.exits_total,
      Diário: prevSummary.daily_total,
    },
    {
      month: currentMonthLabel,
      Entradas: currentSummary.entries_total,
      Saídas: currentSummary.exits_total,
      Diário: currentSummary.daily_total,
    },
  ]

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeOpacity={0.6}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatShort}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: 'var(--text-secondary)' }}
          />
          <Bar dataKey="Entradas" fill="var(--positive)" radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Bar dataKey="Saídas" fill="var(--negative)" radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Bar dataKey="Diário" fill="var(--daily)" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
