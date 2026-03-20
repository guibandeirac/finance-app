import type { Metadata } from 'next'
import { getCards, getCardMonthlyTotal, getCardItems } from '@/app/actions/cards'
import { CartoesClient } from './CartoesClient'

export const metadata: Metadata = {
  title: 'Cartões',
}

export default async function CartoesPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const { data: cards, error } = await getCards()

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Cartões
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--negative)' }}>
          Erro ao carregar cartões: {error}
        </p>
      </div>
    )
  }

  const cardList = cards ?? []

  // Fetch monthly totals and active item counts in parallel
  const [totalsResults, itemsResults] = await Promise.all([
    Promise.all(cardList.map((card) => getCardMonthlyTotal(card.id, year, month))),
    Promise.all(cardList.map((card) => getCardItems(card.id))),
  ])

  const monthlyTotals: Record<string, number> = {}
  const activeItemsCounts: Record<string, number> = {}

  cardList.forEach((card, i) => {
    monthlyTotals[card.id] = totalsResults[i].data ?? 0
    const items = itemsResults[i].data ?? []
    activeItemsCounts[card.id] = items.filter((item) => item.is_active).length
  })

  return (
    <CartoesClient
      cards={cardList}
      monthlyTotals={monthlyTotals}
      activeItemsCounts={activeItemsCounts}
    />
  )
}
