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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createCardItem, updateCardItem, type CardItemType, type CardItemData } from '@/app/actions/cards'
import type { Category } from '@/app/actions/categories'

interface CardItemDialogProps {
  cardId: string
  item?: CardItemType
  itemType: 'fixed' | 'installment'
  categories: Category[]
  trigger: React.ReactNode
  onSuccess?: () => void
  onClose?: () => void
}

export function CardItemDialog({
  cardId,
  item,
  itemType,
  categories,
  trigger,
  onSuccess,
  onClose,
}: CardItemDialogProps) {
  const isEditing = !!item

  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [description, setDescription] = useState(item?.description ?? '')
  const [amount, setAmount] = useState(item ? String(item.amount) : '')
  const [categoryId, setCategoryId] = useState<string>(item?.category_id ?? '')
  const [totalInstallments, setTotalInstallments] = useState(
    item?.total_installments ? String(item.total_installments) : ''
  )
  const [currentInstallment, setCurrentInstallment] = useState(
    item?.current_installment ? String(item.current_installment) : '1'
  )

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setDescription(item?.description ?? '')
      setAmount(item ? String(item.amount) : '')
      setCategoryId(item?.category_id ?? '')
      setTotalInstallments(item?.total_installments ? String(item.total_installments) : '')
      setCurrentInstallment(item?.current_installment ? String(item.current_installment) : '1')
    } else {
      onClose?.()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!description.trim()) {
      toast.error('A descrição é obrigatória.')
      return
    }

    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('O valor deve ser maior que zero.')
      return
    }

    if (itemType === 'installment') {
      const total = parseInt(totalInstallments, 10)
      const current = parseInt(currentInstallment, 10)
      if (isNaN(total) || total < 1) {
        toast.error('Total de parcelas inválido.')
        return
      }
      if (isNaN(current) || current < 1 || current > total) {
        toast.error('Parcela atual inválida.')
        return
      }
    }

    const payload: CardItemData = {
      card_id: cardId,
      item_type: itemType,
      description: description.trim(),
      amount: parsedAmount,
      category_id: categoryId || null,
      ...(itemType === 'installment' && {
        total_installments: parseInt(totalInstallments, 10),
        current_installment: parseInt(currentInstallment, 10),
      }),
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateCardItem(item.id, payload)
        : await createCardItem(payload)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditing ? 'Item atualizado!' : 'Item adicionado!')
        setOpen(false)
        onSuccess?.()
      }
    })
  }

  const title = isEditing
    ? `Editar ${itemType === 'fixed' ? 'fixo' : 'parcela'}`
    : itemType === 'fixed'
    ? 'Adicionar fixo'
    : 'Adicionar parcela'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Trigger
        data-slot="dialog-trigger"
        render={trigger as React.ReactElement}
      />

      <DialogContent className="sm:max-w-sm" style={{ backgroundColor: 'var(--surface)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>
            {title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="item-description"
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Descrição
            </label>
            <Input
              id="item-description"
              placeholder="Ex: Netflix"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          {/* Valor */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="item-amount"
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              {itemType === 'installment' ? 'Valor da parcela (R$)' : 'Valor (R$)'}
            </label>
            <Input
              id="item-amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          {/* Campos de parcela */}
          {itemType === 'installment' && (
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <label
                  htmlFor="item-total"
                  className="text-xs font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Total de parcelas
                </label>
                <Input
                  id="item-total"
                  type="number"
                  min={1}
                  placeholder="12"
                  value={totalInstallments}
                  onChange={(e) => setTotalInstallments(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <label
                  htmlFor="item-current"
                  className="text-xs font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Parcela atual
                </label>
                <Input
                  id="item-current"
                  type="number"
                  min={1}
                  placeholder="1"
                  value={currentInstallment}
                  onChange={(e) => setCurrentInstallment(e.target.value)}
                  disabled={isPending}
                  required
                />
              </div>
            </div>
          )}

          {/* Categoria */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="item-category-trigger"
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Categoria{' '}
              <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>
            </label>
            <Select
              value={categoryId}
              onValueChange={(v) => setCategoryId((v ?? '') === '__none__' ? '' : (v ?? ''))}
            >
              <SelectTrigger id="item-category-trigger" className="w-full" size="default">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sem categoria</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="-mx-4 -mb-4 mt-2">
            <Button
              type="submit"
              disabled={isPending}
              style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}
            >
              {isPending
                ? isEditing ? 'Salvando...' : 'Adicionando...'
                : isEditing ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
