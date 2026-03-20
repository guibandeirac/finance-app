'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { DailyBalanceData } from './page'

interface BalanceChartProps {
  dailyBalances: DailyBalanceData[]
  year: number
  month: number
}

function formatShort(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}R$${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}R$${(abs / 1_000).toFixed(1)}K`
  return `${sign}R$${abs.toFixed(0)}`
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

interface TooltipPayloadItem {
  value: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  year: number
  month: number
}

function CustomTooltip({ active, payload, label, year, month }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const day = String(label).padStart(2, '0')
  const monthStr = String(month).padStart(2, '0')
  const dateStr = `${String(day).padStart(2, '0')}/${monthStr}/${year}`
  const balance = payload[0].value

  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-md"
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        color: 'var(--text-primary)',
      }}
    >
      <p className="font-medium">{dateStr}</p>
      <p style={{ color: balance >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
        {formatMoney(balance)}
      </p>
    </div>
  )
}

export function BalanceChart({ dailyBalances, year, month }: BalanceChartProps) {
  if (dailyBalances.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="space-y-2 w-full">
          <div
            className="h-4 rounded animate-pulse"
            style={{ backgroundColor: 'var(--surface-hover)' }}
          />
          <div
            className="h-4 rounded animate-pulse w-3/4"
            style={{ backgroundColor: 'var(--surface-hover)' }}
          />
          <div
            className="h-4 rounded animate-pulse w-1/2"
            style={{ backgroundColor: 'var(--surface-hover)' }}
          />
        </div>
      </div>
    )
  }

  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth() + 1
  const todayDay = today.getDate()
  const isCurrentMonth = year === todayYear && month === todayMonth

  // Split data into past (solid) and future (dashed)
  const solidData: Array<{ day: number; balance: number }> = []
  const dashedData: Array<{ day: number; balance: number; solidBalance?: number }> = []

  dailyBalances.forEach((row) => {
    const dayNum = Number(new Date(row.day).getUTCDate())
    const balance = Number(row.balance)
    const isFuture = isCurrentMonth && dayNum > todayDay

    if (isFuture) {
      // Include the last solid point as the start of the dashed line
      if (dashedData.length === 0 && solidData.length > 0) {
        const lastSolid = solidData[solidData.length - 1]
        dashedData.push({ day: lastSolid.day, balance: lastSolid.balance })
      }
      dashedData.push({ day: dayNum, balance })
    } else {
      solidData.push({ day: dayNum, balance })
    }
  })

  // Merge into one dataset with two series
  const allDays = new Set([
    ...solidData.map((d) => d.day),
    ...dashedData.map((d) => d.day),
  ])

  const chartData = Array.from(allDays)
    .sort((a, b) => a - b)
    .map((day) => {
      const solid = solidData.find((d) => d.day === day)
      const dashed = dashedData.find((d) => d.day === day)
      return {
        day,
        solidBalance: solid?.balance ?? undefined,
        dashedBalance: dashed?.balance ?? undefined,
      }
    })

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatShort}
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip
            content={
              <CustomTooltip year={year} month={month} />
            }
          />
          <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
          {/* Solid line for past days */}
          <Line
            type="monotone"
            dataKey="solidBalance"
            stroke="var(--accent-color)"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            name="Saldo"
          />
          {/* Dashed line for future days */}
          <Line
            type="monotone"
            dataKey="dashedBalance"
            stroke="var(--accent-color)"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            connectNulls={false}
            name="Projeção"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
