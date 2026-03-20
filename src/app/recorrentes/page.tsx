import type { Metadata } from 'next'
import { getRecurring } from '@/app/actions/recurring'
import { getCategories } from '@/app/actions/categories'
import { RecorrentesClient } from './RecorrentesClient'

export const metadata: Metadata = {
  title: 'Recorrentes',
}

export default async function RecorrentesPage() {
  const [recurringResult, categoriesResult] = await Promise.all([
    getRecurring(),
    getCategories(),
  ])

  if (recurringResult.error) {
    return (
      <div className="p-6">
        <h1
          className="text-2xl font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Recorrentes
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--negative)' }}>
          Erro ao carregar recorrências: {recurringResult.error}
        </p>
      </div>
    )
  }

  return (
    <RecorrentesClient
      recurrings={recurringResult.data ?? []}
      categories={categoriesResult.data ?? []}
    />
  )
}
