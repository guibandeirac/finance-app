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
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  onClose?: () => void
}

/** Returns the first day of the current month as YYYY-MM-DD */
function currentMonthDate(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

/** Adds `n` months to a YYYY-MM-DD first-of-month date */
function addMonths(dateStr: string, n: number): string {
  const [y, m] = dateStr.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

/** Converts YYYY-MM-DD → YYYY-MM (for <input type="month"> value) */
function toMonthInput(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return dateStr.slice(0, 7)
}

/** Converts YYYY-MM → YYYY-MM-01 */
function fromMonthInput(monthStr: string): string {
  return monthStr ? `${monthStr}-01` : ''
}

export function CardItemDialog({
  cardId,
  item,
  itemType,
  categories,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  onSuccess,
  onClose,
}: CardItemDialogProps) {
  const isEditing = !!item
  const isControlled = openProp !== undefined

  const [openState, setOpenState] = useState(false)
  const open = isControlled ? openProp! : openState
  const [isPending, startTransition] = useTransition()

  const [description, setDescription] = useState(item?.description ?? '')
  const [amount, setAmount] = useState(item ? String(item.amount) : '')
  const [categoryId, setCategoryId] = useState<string>(item?.category_id ?? '')

  // start_month used for both fixed (optional) and installment (required)
  const defaultStartMonth = item?.start_month
    ? toMonthInput(item.start_month)
    : toMonthInput(currentMonthDate())

  const computedTotalFromItem =
    item?.start_month && item?.end_month
      ? (() => {
          const [sy, sm] = item.start_month.split('-').map(Number)
          const [ey, em] = item.end_month.split('-').map(Number)
          return (ey - sy) * 12 + (em - sm) + 1
        })()
      : 1

  const [startMonth, setStartMonth] = useState(defaultStartMonth)
  const [quantity, setQuantity] = useState(
    item ? String(computedTotalFromItem) : ''
  )

  function handleOpenChange(next: boolean) {
    if (!isControlled) setOpenState(next)
    onOpenChangeProp?.(next)
    if (next) {
      setDescription(item?.description ?? '')
      setAmount(item ? String(item.amount) : '')
      setCategoryId(item?.category_id ?? '')
      setStartMonth(defaultStartMonth)
      setQuantity(item ? String(computedTotalFromItem) : '')
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

    let payload: CardItemData = {
      card_id: cardId,
      item_type: itemType,
      description: description.trim(),
      amount: parsedAmount,
      category_id: categoryId || null,
    }

    if (itemType === 'fixed') {
      // start_month is optional for fixed items (null = start immediately)
      payload = {
        ...payload,
        start_month: startMonth ? fromMonthInput(startMonth) : null,
      }
    }

    if (itemType === 'installment') {
      const qty = parseInt(quantity, 10)
      if (isNaN(qty) || qty < 1) {
        toast.error('Quantidade de parcelas inválida.')
        return
      }
      if (!startMonth) {
        toast.error('Selecione o mês de início.')
        return
      }
      const startMonthDate = fromMonthInput(startMonth)
      const endMonthDate = addMonths(startMonthDate, qty - 1)
      payload = {
        ...payload,
        start_month: startMonthDate,
        end_month: endMonthDate,
      }
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateCardItem(item.id, payload)
        : await createCardItem(payload)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditing ? 'Item atualizado!' : 'Item adicionado!')
        handleOpenChange(false)
        onSuccess?.()
      }
    })
  }

  const title = isEditing
    ? `Editar ${itemType === 'fixed' ? 'fixo' : 'parcela'}`
    : itemType === 'fixed'
    ? 'Adicionar fixo'
    : 'Adicionar parcela'

  // Preview of computed end month
  const previewEndMonth = (() => {
    if (itemType !== 'installment') return null
    const qty = parseInt(quantity, 10)
    if (!startMonth || isNaN(qty) || qty < 1) return null
    const endDate = addMonths(fromMonthInput(startMonth), qty - 1)
    const [y, m] = endDate.split('-')
    return `${m}/${y}`
  })()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogPrimitive.Trigger
          data-slot="dialog-trigger"
          render={trigger as React.ReactElement}
        />
      )}

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
              placeholder={itemType === 'installment' ? 'Ex: Notebook' : 'Ex: Netflix'}
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

          {/* Mês de início — fixos (opcional) */}
          {itemType === 'fixed' && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="item-fixed-start-month"
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Cobrar a partir de{' '}
                <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>
              </label>
              <Input
                id="item-fixed-start-month"
                type="month"
                value={startMonth}
                onChange={(e) => setStartMonth(e.target.value)}
                disabled={isPending}
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
              />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Deixe em branco para incluir em todos os meses.
              </p>
            </div>
          )}

          {/* Campos de parcela */}
          {itemType === 'installment' && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-1.5">
                  <label
                    htmlFor="item-start-month"
                    className="text-xs font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Mês de início
                  </label>
                  <Input
                    id="item-start-month"
                    type="month"
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    disabled={isPending}
                    required
                    style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1.5">
                  <label
                    htmlFor="item-quantity"
                    className="text-xs font-medium"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Nº de parcelas
                  </label>
                  <Input
                    id="item-quantity"
                    type="number"
                    min={1}
                    placeholder="12"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    disabled={isPending}
                    required
                  />
                </div>
              </div>
              {previewEndMonth && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Término: <span style={{ color: 'var(--text-secondary)' }}>{previewEndMonth}</span>
                </p>
              )}
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
