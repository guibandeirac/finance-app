'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CategoryCard } from '@/components/categories/CategoryCard'
import { CategoryDialog } from '@/components/categories/CategoryDialog'
import { deleteCategory, type Category } from '@/app/actions/categories'
import { useRouter } from 'next/navigation'

interface CategoriasClientProps {
  categories: Category[]
}

export function CategoriasClient({ categories }: CategoriasClientProps) {
  const router = useRouter()
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [, startTransition] = useTransition()

  function handleDelete(category: Category) {
    setDeleteTarget(category)
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    const category = deleteTarget
    startTransition(async () => {
      const result = await deleteCategory(category.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Categoria excluída.')
        router.refresh()
      }
    })
  }

  function handleSuccess() {
    setEditTarget(null)
    router.refresh()
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Categorias
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {categories.length === 0
              ? 'Nenhuma categoria cadastrada'
              : `${categories.length} categoria${categories.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Create dialog */}
        <CategoryDialog
          trigger={
            <Button
              style={{
                backgroundColor: 'var(--accent-color)',
                color: '#fff',
              }}
            >
              <PlusIcon />
              Nova Categoria
            </Button>
          }
          onSuccess={() => router.refresh()}
        />
      </div>

      {/* Edit dialog — rendered when an edit target is chosen; auto-opens via ref click */}
      {editTarget && (
        <CategoryDialog
          key={editTarget.id}
          category={editTarget}
          trigger={
            <button
              type="button"
              className="sr-only"
              ref={(el) => {
                if (el) el.click()
              }}
              aria-hidden="true"
            />
          }
          onSuccess={handleSuccess}
          onClose={() => setEditTarget(null)}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Excluir categoria"
        description={deleteTarget ? `Tem certeza que deseja excluir a categoria "${deleteTarget.name}"?` : undefined}
        onConfirm={handleDeleteConfirm}
      />

      {/* Empty state */}
      {categories.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <p className="text-sm">Nenhuma categoria ainda.</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Clique em &quot;Nova Categoria&quot; para começar.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onEdit={setEditTarget}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
