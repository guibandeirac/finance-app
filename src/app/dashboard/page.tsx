import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Dashboard',
}
import { getCategories } from '@/app/actions/categories'
import { getTransactionsByMonth } from '@/app/actions/transactions'
import { getCardCategorySpending } from '@/app/actions/cards'
import { DashboardClient } from './DashboardClient'
import { subMonths } from 'date-fns'

interface DashboardPageProps {
  searchParams: Promise<{ mes?: string }>
}

export interface MonthlySummaryData {
  entries_total: number
  exits_total: number
  daily_total: number
  balance_end: number
}

export interface DailyBalanceData {
  day: string
  entries_total: number
  exits_total: number
  daily_total: number
  balance: number
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parse ?mes=YYYY-MM or default to current month
  const now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth() + 1

  if (params.mes) {
    const [y, m] = params.mes.split('-').map(Number)
    if (y && m && m >= 1 && m <= 12) {
      year = y
      month = m
    }
  }

  // Previous month
  const prevDate = subMonths(new Date(year, month - 1, 1), 1)
  const prevYear = prevDate.getFullYear()
  const prevMonth = prevDate.getMonth() + 1

  // Fetch all data in parallel
  const [
    dailyBalanceResult,
    summaryResult,
    prevSummaryResult,
    categoriesResult,
    transactionsResult,
    cardSpendingResult,
  ] = await Promise.all([
    supabase.rpc('get_daily_balance', {
      p_user_id: user.id,
      p_year: year,
      p_month: month,
    }),
    supabase.rpc('get_monthly_summary', {
      p_user_id: user.id,
      p_year: year,
      p_month: month,
    }),
    supabase.rpc('get_monthly_summary', {
      p_user_id: user.id,
      p_year: prevYear,
      p_month: prevMonth,
    }),
    getCategories(),
    getTransactionsByMonth(year, month),
    getCardCategorySpending(year, month),
  ])

  const dailyBalances: DailyBalanceData[] = ((dailyBalanceResult.data ?? []) as DailyBalanceData[]).map((row) => ({
    day: row.day,
    entries_total: Number(row.entries_total ?? 0),
    exits_total: Number(row.exits_total ?? 0),
    daily_total: Number(row.daily_total ?? 0),
    balance: Number(row.balance ?? 0),
  }))

  const summaryRaw = summaryResult.data as MonthlySummaryData | null
  const summary: MonthlySummaryData = summaryRaw
    ? {
        entries_total: Number(summaryRaw.entries_total ?? 0),
        exits_total: Number(summaryRaw.exits_total ?? 0),
        daily_total: Number(summaryRaw.daily_total ?? 0),
        balance_end: Number(summaryRaw.balance_end ?? 0),
      }
    : { entries_total: 0, exits_total: 0, daily_total: 0, balance_end: 0 }

  const prevSummaryRaw = prevSummaryResult.data as MonthlySummaryData | null
  const prevSummary: MonthlySummaryData = prevSummaryRaw
    ? {
        entries_total: Number(prevSummaryRaw.entries_total ?? 0),
        exits_total: Number(prevSummaryRaw.exits_total ?? 0),
        daily_total: Number(prevSummaryRaw.daily_total ?? 0),
        balance_end: Number(prevSummaryRaw.balance_end ?? 0),
      }
    : { entries_total: 0, exits_total: 0, daily_total: 0, balance_end: 0 }

  const categories = categoriesResult.data ?? []
  const transactions = transactionsResult.data ?? []
  const cardSpending = cardSpendingResult.data ?? []

  return (
    <DashboardClient
      year={year}
      month={month}
      prevYear={prevYear}
      prevMonth={prevMonth}
      dailyBalances={dailyBalances}
      summary={summary}
      prevSummary={prevSummary}
      transactions={transactions}
      categories={categories}
      cardSpending={cardSpending}
    />
  )
}
