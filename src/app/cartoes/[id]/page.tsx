import { notFound } from 'next/navigation'
import { getCards, getCardItems, getCardMonthlyTotal, getCardVariableExpenses } from '@/app/actions/cards'
import { getCategories } from '@/app/actions/categories'
import { CardDetailClient } from './CardDetailClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CardDetailPage({ params }: PageProps) {
  const { id } = await params

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [cardsResult, itemsResult, categoriesResult, totalResult, variableResult] = await Promise.all([
    getCards(),
    getCardItems(id),
    getCategories(),
    getCardMonthlyTotal(id, year, month),
    getCardVariableExpenses(id, year, month),
  ])

  if (cardsResult.error) {
    return (
      <div className="p-6">
        <p className="text-sm" style={{ color: 'var(--negative)' }}>
          Erro: {cardsResult.error}
        </p>
      </div>
    )
  }

  const card = (cardsResult.data ?? []).find((c) => c.id === id)
  if (!card) notFound()

  return (
    <CardDetailClient
      card={card}
      items={itemsResult.data ?? []}
      categories={categoriesResult.data ?? []}
      monthlyTotal={totalResult.data ?? 0}
      variableExpenses={variableResult.data ?? []}
    />
  )
}
