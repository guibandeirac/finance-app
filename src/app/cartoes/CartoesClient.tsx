'use client'

import { useRouter } from 'next/navigation'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardCard } from '@/components/cards/CardCard'
import { AddCardDialog } from '@/components/cards/AddCardDialog'
import type { CreditCard } from '@/app/actions/cards'

interface CartoesClientProps {
  cards: CreditCard[]
  monthlyTotals: Record<string, number>
  activeItemsCounts: Record<string, number>
}

export function CartoesClient({ cards, monthlyTotals, activeItemsCounts }: CartoesClientProps) {
  const router = useRouter()

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Cartões
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {cards.length === 0
              ? 'Nenhum cartão cadastrado'
              : `${cards.length} cartão${cards.length > 1 ? 'ões' : ''}`}
          </p>
        </div>

        <AddCardDialog
          trigger={
            <Button style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
              <PlusIcon />
              Novo Cartão
            </Button>
          }
          onSuccess={() => router.refresh()}
        />
      </div>

      {/* Empty state */}
      {cards.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 gap-4"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Nenhum cartão cadastrado
          </p>
          <AddCardDialog
            trigger={
              <Button style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}>
                <PlusIcon />
                Adicionar cartão
              </Button>
            }
            onSuccess={() => router.refresh()}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <CardCard
              key={card.id}
              card={card}
              monthlyTotal={monthlyTotals[card.id] ?? 0}
              activeItemsCount={activeItemsCounts[card.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
