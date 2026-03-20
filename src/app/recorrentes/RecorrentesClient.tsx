'use client'

import { useRouter } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecurringCard } from '@/components/recurring/RecurringCard'
import { RecurringDialog } from '@/components/recurring/RecurringDialog'
import type { RecurringTransaction } from '@/app/actions/recurring'
import type { Category } from '@/app/actions/categories'

interface RecorrentesClientProps {
  recurrings: RecurringTransaction[]
  categories: Category[]
}

export function RecorrentesClient({ recurrings, categories }: RecorrentesClientProps) {
  const router = useRouter()

  const active = recurrings.filter((r) => r.is_active)
  const paused = recurrings.filter((r) => !r.is_active)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Recorrentes
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {recurrings.length === 0
              ? 'Nenhuma recorrência cadastrada'
              : `${recurrings.length} recorrência${recurrings.length > 1 ? 's' : ''}`}
          </p>
        </div>

        <RecurringDialog
          categories={categories}
          trigger={
            <Button style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
              <PlusIcon />
              Nova Recorrência
            </Button>
          }
          onSuccess={() => router.refresh()}
        />
      </div>

      {/* Empty state */}
      {recurrings.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <p className="text-sm">Nenhuma recorrência ainda.</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Clique em &quot;Nova Recorrência&quot; para começar.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Ativas */}
          <section>
            <h2
              className="mb-3 text-sm font-semibold uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              Ativas {active.length > 0 && `(${active.length})`}
            </h2>
            {active.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Nenhuma recorrência ativa
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {active.map((r) => (
                  <RecurringCard key={r.id} recurring={r} categories={categories} />
                ))}
              </div>
            )}
          </section>

          {/* Pausadas */}
          <section>
            <h2
              className="mb-3 text-sm font-semibold uppercase tracking-wide"
              style={{ color: 'var(--text-muted)' }}
            >
              Pausadas {paused.length > 0 && `(${paused.length})`}
            </h2>
            {paused.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Nenhuma recorrência pausada
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {paused.map((r) => (
                  <RecurringCard key={r.id} recurring={r} categories={categories} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
