'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { RecurringDialog } from './RecurringDialog'
import { deleteRecurring, toggleRecurring, type RecurringTransaction } from '@/app/actions/recurring'
import type { Category } from '@/app/actions/categories'

interface RecurringCardProps {
  recurring: RecurringTransaction
  categories: Category[]
}

const TYPE_COLORS: Record<string, string> = {
  entrada: 'var(--positive)',
  saida: 'var(--negative)',
  diario: 'var(--daily)',
}

const TYPE_BG_COLORS: Record<string, string> = {
  entrada: 'var(--positive-bg)',
  saida: 'var(--negative-bg)',
  diario: 'var(--daily-bg)',
}

export function RecurringCard({ recurring, categories }: RecurringCardProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const dotColor = TYPE_COLORS[recurring.type] ?? '#94A3B8'
  const dotBg = TYPE_BG_COLORS[recurring.type] ?? '#F1F5F9'

  // Initial letter for the circle
  const letter = recurring.description.charAt(0).toUpperCase()

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await toggleRecurring(recurring.id, checked)
      if (result.error) {
        toast.error(result.error)
      } else {
        router.refresh()
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteRecurring(recurring.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Recorrência excluída.')
        router.refresh()
      }
    })
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl border p-4 transition-colors"
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
        opacity: recurring.is_active ? 1 : 0.6,
      }}
    >
      {/* Colored circle with letter */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold text-sm"
        style={{ backgroundColor: dotBg, color: dotColor }}
        aria-hidden="true"
      >
        {letter}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {recurring.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className="font-mono text-xs font-medium"
            style={{ color: recurring.is_active ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            {Number(recurring.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            ~dia {recurring.estimated_day}
          </span>
        </div>
      </div>

      {/* Toggle */}
      <Switch
        checked={recurring.is_active}
        onCheckedChange={handleToggle}
        aria-label={`${recurring.is_active ? 'Pausar' : 'Ativar'} ${recurring.description}`}
      />

      {/* Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Opções">
              <MoreHorizontalIcon className="size-4" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <RecurringDialog
            recurring={recurring}
            categories={categories}
            trigger={
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="cursor-pointer"
              >
                <PencilIcon className="mr-2 size-3.5" />
                Editar
              </DropdownMenuItem>
            }
            onSuccess={() => router.refresh()}
          />
          <DropdownMenuItem
            onClick={() => setConfirmOpen(true)}
            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2Icon className="mr-2 size-3.5" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Excluir recorrência"
        description={`Excluir "${recurring.description}"?`}
        onConfirm={handleDelete}
      />
    </div>
  )
}
