'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Transaction } from '@/app/actions/transactions'

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  entrada: { color: 'var(--positive)', bg: 'var(--positive-bg)' },
  saida:   { color: 'var(--negative)', bg: 'var(--negative-bg)' },
  diario:  { color: 'var(--daily)',    bg: 'var(--daily-bg)'    },
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

interface DraggableTagProps {
  transaction: Transaction
}

export function DraggableTag({ transaction }: DraggableTagProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: transaction.id,
    data: { transaction },
  })

  const colors = TYPE_COLORS[transaction.type] ?? TYPE_COLORS.saida
  const prefix = transaction.type === 'entrada' ? '+' : '−'

  return (
    <span
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-mono font-medium select-none"
      style={{
        backgroundColor: colors.bg,
        color: colors.color,
        opacity: isDragging ? 0.3 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        transform: CSS.Translate.toString(transform),
      }}
      title={transaction.description ?? undefined}
    >
      {prefix}{formatAmount(transaction.amount)}
    </span>
  )
}

/** Snapshot rendered inside DragOverlay while dragging */
export function TagOverlay({ transaction }: { transaction: Transaction }) {
  const colors = TYPE_COLORS[transaction.type] ?? TYPE_COLORS.saida
  const prefix = transaction.type === 'entrada' ? '+' : '−'

  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-mono font-medium shadow-lg"
      style={{
        backgroundColor: colors.color,
        color: '#fff',
        cursor: 'grabbing',
        rotate: '2deg',
      }}
    >
      {prefix}{formatAmount(transaction.amount)}
      {transaction.description ? (
        <span className="ml-1 max-w-[120px] truncate opacity-90 not-italic font-sans text-[10px]">
          {transaction.description}
        </span>
      ) : null}
    </span>
  )
}
