import type { Metadata } from 'next'
import { getCategories } from '@/app/actions/categories'
import { CategoriasClient } from './CategoriasClient'

export const metadata: Metadata = {
  title: 'Categorias',
}

export default async function CategoriasPage() {
  const { data: categories, error } = await getCategories()

  if (error) {
    return (
      <div className="p-6">
        <h1
          className="text-2xl font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Categorias
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--negative)' }}>
          Erro ao carregar categorias: {error}
        </p>
      </div>
    )
  }

  return <CategoriasClient categories={categories ?? []} />
}
