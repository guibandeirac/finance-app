'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AddCardDialog } from './AddCardDialog'
import { deleteCard, type CreditCard } from '@/app/actions/cards'

interface CardCardProps {
  card: CreditCard
  monthlyTotal: number
  activeItemsCount: number
}

export function CardCard({ card, monthlyTotal, activeItemsCount }: CardCardProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirmOpen(true)
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCard(card.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Cartão excluído.')
        router.refresh()
      }
    })
  }

  return (
    <div
      className="relative flex flex-col gap-3 rounded-xl border p-4 cursor-pointer transition-colors"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
      onClick={() => router.push(`/cartoes/${card.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/cartoes/${card.id}`)}
    >
      {/* Header: dot + name + dropdown */}
      <div className="flex items-center gap-2.5">
        <div
          className="h-4 w-4 rounded-full shrink-0"
          style={{ backgroundColor: card.color }}
          aria-hidden="true"
        />
        <span
          className="flex-1 truncate font-medium text-sm"
          style={{ color: 'var(--text-primary)' }}
        >
          {card.name}
        </span>

        {/* Dropdown — stop propagation so card click doesn't fire */}
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="Opções do cartão">
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setEditOpen(true)}
                className="cursor-pointer"
              >
                <PencilIcon className="mr-2 size-3.5" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteClick}
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2Icon className="mr-2 size-3.5" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AddCardDialog
        card={card}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => { setEditOpen(false); router.refresh() }}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Excluir cartão"
        description={`Tem certeza que deseja excluir o cartão "${card.name}"? Todos os itens serão removidos.`}
        onConfirm={handleDelete}
      />

      {/* Vencimento */}
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Vencimento:{' '}
        <span style={{ color: 'var(--text-secondary)' }}>Dia {card.due_day}</span>
      </p>

      {/* Fatura do mês */}
      <div>
        <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>
          Fatura do mês
        </p>
        <p
          className="font-mono text-xl font-semibold"
          style={{ color: 'var(--card-bill)' }}
        >
          {monthlyTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      </div>

      {/* Active items count */}
      <Badge
        className="w-fit text-xs"
        style={{
          backgroundColor: 'var(--card-bill-bg)',
          color: 'var(--card-bill)',
          border: 'none',
        }}
      >
        {activeItemsCount} {activeItemsCount === 1 ? 'item ativo' : 'itens ativos'}
      </Badge>
    </div>
  )
}
