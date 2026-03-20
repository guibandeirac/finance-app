'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { createCard, updateCard, type CreditCard, type CardData } from '@/app/actions/cards'

const PRESET_COLORS = [
  '#2563EB', // azul
  '#7C3AED', // violeta
  '#EC4899', // rosa
  '#EF4444', // vermelho
  '#F97316', // laranja
  '#F59E0B', // âmbar
  '#22C55E', // verde
  '#14B8A6', // teal
]

interface AddCardDialogProps {
  card?: CreditCard
  trigger: React.ReactNode
  onSuccess?: () => void
  onClose?: () => void
}

export function AddCardDialog({ card, trigger, onSuccess, onClose }: AddCardDialogProps) {
  const isEditing = !!card

  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(card?.name ?? '')
  const [dueDay, setDueDay] = useState(String(card?.due_day ?? ''))
  const [closingDay, setClosingDay] = useState(card?.closing_day ? String(card.closing_day) : '')
  const [color, setColor] = useState(card?.color ?? PRESET_COLORS[0])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setName(card?.name ?? '')
      setDueDay(String(card?.due_day ?? ''))
      setClosingDay(card?.closing_day ? String(card.closing_day) : '')
      setColor(card?.color ?? PRESET_COLORS[0])
    } else {
      onClose?.()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('O nome do cartão é obrigatório.')
      return
    }

    const day = parseInt(dueDay, 10)
    if (isNaN(day) || day < 1 || day > 31) {
      toast.error('Dia de vencimento deve ser entre 1 e 31.')
      return
    }

    const closing = closingDay.trim() ? parseInt(closingDay, 10) : null
    if (closing !== null && (isNaN(closing) || closing < 1 || closing > 31)) {
      toast.error('Dia de fechamento deve ser entre 1 e 31.')
      return
    }

    const payload: CardData = {
      name: name.trim(),
      due_day: day,
      closing_day: closing,
      color,
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateCard(card.id, payload)
        : await createCard(payload)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditing ? 'Cartão atualizado!' : 'Cartão criado!')
        setOpen(false)
        onSuccess?.()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger
        data-slot="dialog-trigger"
        render={trigger as React.ReactElement}
      />

      <DialogContent className="sm:max-w-sm" style={{ backgroundColor: 'var(--surface)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>
            {isEditing ? 'Editar Cartão' : 'Novo Cartão'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="card-name"
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Nome
            </label>
            <Input
              id="card-name"
              placeholder="Ex: Nubank"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          {/* Dia de vencimento */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="card-due-day"
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Dia de vencimento
            </label>
            <Input
              id="card-due-day"
              type="number"
              min={1}
              max={31}
              placeholder="Ex: 10"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          {/* Dia de fechamento (optional) */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="card-closing-day"
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Dia de fechamento{' '}
              <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>
            </label>
            <Input
              id="card-closing-day"
              type="number"
              min={1}
              max={31}
              placeholder="Ex: 25"
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Cor */}
          <div className="flex flex-col gap-1.5">
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Cor
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  disabled={isPending}
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                    color === c
                      ? 'border-[var(--text-primary)] scale-110'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="-mx-4 -mb-4 mt-2">
            <Button
              type="submit"
              disabled={isPending}
              style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}
            >
              {isPending
                ? isEditing ? 'Salvando...' : 'Criando...'
                : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
