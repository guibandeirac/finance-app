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
import { cn } from '@/lib/utils'
import {
  createRecurring,
  updateRecurring,
  type RecurringTransaction,
  type RecurringData,
  type RecurringType,
} from '@/app/actions/recurring'
import type { Category } from '@/app/actions/categories'

interface RecurringDialogProps {
  recurring?: RecurringTransaction
  categories: Category[]
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  onClose?: () => void
}

const TYPE_OPTIONS: { value: RecurringType; label: string; color: string }[] = [
  { value: 'entrada', label: 'Entrada', color: 'var(--positive)' },
  { value: 'saida', label: 'Saída', color: 'var(--negative)' },
  { value: 'diario', label: 'Diário', color: 'var(--daily)' },
]

export function RecurringDialog({
  recurring,
  categories,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  onSuccess,
  onClose,
}: RecurringDialogProps) {
  const isEditing = !!recurring
  const isControlled = openProp !== undefined

  const [openState, setOpenState] = useState(false)
  const open = isControlled ? openProp! : openState
  const [isPending, startTransition] = useTransition()

  const [description, setDescription] = useState(recurring?.description ?? '')
  const [amount, setAmount] = useState(recurring ? String(recurring.amount) : '')
  const [type, setType] = useState<RecurringType>(recurring?.type ?? 'saida')
  const [categoryId, setCategoryId] = useState<string>(recurring?.category_id ?? '')
  const [estimatedDay, setEstimatedDay] = useState(
    recurring?.estimated_day ? String(recurring.estimated_day) : ''
  )
  const [startDate, setStartDate] = useState(
    recurring?.start_date ?? new Date().toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(recurring?.end_date ?? '')

  function handleOpenChange(next: boolean) {
    if (!isControlled) setOpenState(next)
    onOpenChangeProp?.(next)
    if (next) {
      setDescription(recurring?.description ?? '')
      setAmount(recurring ? String(recurring.amount) : '')
      setType(recurring?.type ?? 'saida')
      setCategoryId(recurring?.category_id ?? '')
      setEstimatedDay(recurring?.estimated_day ? String(recurring.estimated_day) : '')
      setStartDate(recurring?.start_date ?? new Date().toISOString().split('T')[0])
      setEndDate(recurring?.end_date ?? '')
    } else {
      onClose?.()
    }
  }

  // Filter categories by selected type (or show all for 'all' type)
  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === 'all'
  )

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

    const day = parseInt(estimatedDay, 10)
    if (isNaN(day) || day < 1 || day > 31) {
      toast.error('Dia estimado deve ser entre 1 e 31.')
      return
    }

    if (!startDate) {
      toast.error('A data de início é obrigatória.')
      return
    }

    const payload: RecurringData = {
      description: description.trim(),
      amount: parsedAmount,
      type,
      category_id: categoryId || null,
      estimated_day: day,
      start_date: startDate,
      end_date: endDate || null,
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateRecurring(recurring.id, payload)
        : await createRecurring(payload)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditing ? 'Recorrência atualizada!' : 'Recorrência criada!')
        handleOpenChange(false)
        onSuccess?.()
      }
    })
  }

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
            {isEditing ? 'Editar Recorrência' : 'Nova Recorrência'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="rec-description"
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Descrição
            </label>
            <Input
              id="rec-description"
              placeholder="Ex: Spotify"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          {/* Valor */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="rec-amount"
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Valor (R$)
            </label>
            <Input
              id="rec-amount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          {/* Tipo — 3-button toggle */}
          <div className="flex flex-col gap-1.5">
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Tipo
            </span>
            <div className="flex gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setType(opt.value)
                    setCategoryId('')
                  }}
                  className={cn(
                    'flex-1 rounded-lg border py-2 text-xs font-medium transition-all',
                    type === opt.value
                      ? 'border-transparent text-white'
                      : 'border-[var(--border)] bg-transparent hover:bg-[var(--surface-hover)]'
                  )}
                  style={
                    type === opt.value
                      ? { backgroundColor: opt.color, color: '#fff' }
                      : { color: 'var(--text-secondary)' }
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="rec-category-trigger"
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
              <SelectTrigger id="rec-category-trigger" className="w-full" size="default">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sem categoria</SelectItem>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dia estimado */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="rec-day"
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Dia estimado
            </label>
            <Input
              id="rec-day"
              type="number"
              min={1}
              max={31}
              placeholder="Ex: 5"
              value={estimatedDay}
              onChange={(e) => setEstimatedDay(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          {/* Data início + Data fim */}
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label
                htmlFor="rec-start"
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Data início
              </label>
              <Input
                id="rec-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <label
                htmlFor="rec-end"
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Data fim{' '}
                <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>
              </label>
              <Input
                id="rec-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isPending}
              />
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
