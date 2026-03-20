import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCategories } from '@/app/actions/categories'
import { getTransactionsByMonth } from '@/app/actions/transactions'
import { getCards } from '@/app/actions/cards'
import { HomeClient } from '@/app/HomeClient'

interface HomePageProps {
  searchParams: Promise<{ mes?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
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

  // Generate recurring + card bills for every month from today up to the selected month.
  // This ensures the running balance for future months starts from the correct accumulated value.
  const todayYear = now.getFullYear()
  const todayMonth = now.getMonth() + 1

  const monthsToGenerate: { y: number; m: number }[] = []
  let gy = todayYear, gm = todayMonth
  while (gy < year || (gy === year && gm <= month)) {
    monthsToGenerate.push({ y: gy, m: gm })
    gm++
    if (gm > 12) { gm = 1; gy++ }
  }

  await Promise.allSettled(
    monthsToGenerate.flatMap(({ y: fy, m: fm }) => [
      supabase.rpc('generate_recurring_transactions', { p_user_id: user.id, p_year: fy, p_month: fm }),
      supabase.rpc('generate_card_bills', { p_user_id: user.id, p_year: fy, p_month: fm }),
    ])
  )

  // Fetch daily balance and monthly summary
  const [dailyBalanceResult, summaryResult, categoriesResult, transactionsResult, cardsResult] =
    await Promise.all([
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
      getCategories(),
      getTransactionsByMonth(year, month),
      getCards(),
    ])

  // RPC returns: day, entries_total, exits_total, daily_total, balance
  // Map to the shape HomeClient expects
  const dailyBalances = ((dailyBalanceResult.data ?? []) as Array<{
    day: string
    entries_total: number
    exits_total: number
    daily_total: number
    balance: number
  }>).map((row) => ({
    date: row.day,
    running_balance: Number(row.balance),
    day_total: Number(row.daily_total),
  }))

  // RPC returns jsonb: entries_total, exits_total, daily_total, balance_end
  const summaryRaw = summaryResult.data as {
    entries_total: number
    exits_total: number
    daily_total: number
    balance_end: number
  } | null
  const summary = summaryRaw ? {
    total_entrada: Number(summaryRaw.entries_total ?? 0),
    total_saida: Number(summaryRaw.exits_total ?? 0),
    total_diario: Number(summaryRaw.daily_total ?? 0),
    net_balance: Number(summaryRaw.balance_end ?? 0),
  } : null

  const categories = categoriesResult.data ?? []
  const transactions = transactionsResult.data ?? []
  const cards = cardsResult.data ?? []

  return (
    <HomeClient
      year={year}
      month={month}
      dailyBalances={dailyBalances}
      summary={summary}
      transactions={transactions}
      categories={categories}
      cards={cards}
    />
  )
}
