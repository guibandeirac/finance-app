'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import {
  createTransaction,
  updateTransaction,
  type Transaction,
  type TransactionType,
} from '@/app/actions/transactions'
import type { Category } from '@/app/actions/categories'
interface TransactionFormProps {
  transaction?: Transaction
  categories: Category[]
  onSuccess?: () => void
  defaultDate?: string  // YYYY-MM-DD, used when creating a new transaction
}

function formatAmountDisplay(value: string): string {
  // Remove non-digit characters
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const number = parseInt(digits, 10) / 100
  return number.toFixed(2).replace('.', ',')
}

function parseAmount(display: string): number {
  return parseFloat(display.replace(/\./g, '').replace(',', '.')) || 0
}

export function TransactionForm({ transaction, categories, onSuccess, defaultDate: defaultDateProp }: TransactionFormProps) {
  const isEditing = !!transaction
  const [isPending, startTransition] = useTransition()

  const defaultDate = transaction?.date
    ? new Date(transaction.date + 'T12:00:00')
    : (defaultDateProp ? new Date(defaultDateProp + 'T12:00:00') : new Date())

  const [date, setDate] = useState<Date>(defaultDate)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [amountDisplay, setAmountDisplay] = useState<string>(
    transaction ? (transaction.amount).toFixed(2).replace('.', ',') : ''
  )
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'saida')
  const [categoryId, setCategoryId] = useState<string | null>(transaction?.category_id ?? null)
  const [description, setDescription] = useState<string>(transaction?.description ?? '')

  const filteredCategories = categories.filter(
    (cat) => cat.type === type || cat.type === 'all'
  )

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '')
    setAmountDisplay(raw ? formatAmountDisplay(raw) : '')
  }

  function handleTypeChange(newType: TransactionType) {
    setType(newType)
    const currentCat = categories.find((c) => c.id === categoryId)
    if (currentCat && currentCat.type !== newType && currentCat.type !== 'all') {
      setCategoryId('')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const amount = parseAmount(amountDisplay)
    if (!amount || amount <= 0) {
      toast.error('Informe um valor válido.')
      return
    }

    const dateStr = format(date, 'yyyy-MM-dd')

    startTransition(async () => {
      const payload = {
        date: dateStr,
        amount,
        type,
        category_id: categoryId ?? null,
        description: description.trim() || null,
        credit_card_id: null,
      }

      const result = isEditing
        ? await updateTransaction(transaction.id, payload)
        : await createTransaction(payload)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditing ? 'Transação atualizada!' : 'Transação criada!')
        onSuccess?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <SheetHeader className="px-4 pt-4 pb-2">
        <SheetTitle style={{ color: 'var(--text-primary)' }}>
          {isEditing ? 'Editar Transação' : 'Nova Transação'}
        </SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-auto px-4 flex flex-col gap-4 py-2">
        {/* Date picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Data
          </label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                />
              }
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              {date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="start"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (d) {
                    setDate(d)
                    setCalendarOpen(false)
                  }
                }}
                locale={ptBR}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Amount */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Valor
          </label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium pointer-events-none"
              style={{ color: 'var(--text-secondary)' }}
            >
              R$
            </span>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0,00"
              value={amountDisplay}
              onChange={handleAmountChange}
              disabled={isPending}
              className="pl-9 font-mono"
            />
          </div>
        </div>

        {/* Type toggle */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Tipo
          </span>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--background)' }}>
            {([
              { value: 'entrada', label: 'Entrada', active: 'var(--positive)', activeBg: 'var(--positive-bg)' },
              { value: 'saida', label: 'Saída', active: 'var(--negative)', activeBg: 'var(--negative-bg)' },
              { value: 'diario', label: 'Diário', active: 'var(--daily)', activeBg: 'var(--daily-bg)' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTypeChange(opt.value)}
                disabled={isPending}
                className={cn(
                  'rounded-md py-1.5 text-sm font-medium transition-all',
                  type === opt.value ? 'shadow-sm' : 'hover:opacity-70'
                )}
                style={
                  type === opt.value
                    ? { backgroundColor: opt.activeBg, color: opt.active }
                    : { color: 'var(--text-muted)' }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Categoria <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>
          </label>
          <Select
            value={categoryId ?? ''}
            onValueChange={(v) => setCategoryId(v || null)}
          >
            <SelectTrigger className="w-full" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent style={{ backgroundColor: 'var(--surface)' }}>
              {filteredCategories.length === 0 ? (
                <SelectItem value="_none" disabled>
                  Nenhuma categoria disponível
                </SelectItem>
              ) : (
                filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      {cat.color && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                      {cat.name}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Descrição <span style={{ color: 'var(--text-muted)' }}>(opcional)</span>
          </label>
          <Input
            type="text"
            placeholder="Ex: Supermercado, conta de luz..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
          />
        </div>

      </div>

      <SheetFooter className="px-4 pb-4 pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="w-full"
          style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}
        >
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </SheetFooter>
    </form>
  )
}
