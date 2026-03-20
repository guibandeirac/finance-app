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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'
import {
  createCategory,
  updateCategory,
  type Category,
  type CategoryType,
  type CategoryData,
} from '@/app/actions/categories'

const PRESET_COLORS = [
  '#F97316', // laranja
  '#EF4444', // vermelho
  '#EC4899', // rosa
  '#A855F7', // roxo
  '#6366F1', // índigo
  '#3B82F6', // azul
  '#14B8A6', // teal
  '#22C55E', // verde
  '#84CC16', // lima
  '#F59E0B', // âmbar
  '#64748B', // cinza-azulado
  '#8B5CF6', // violeta
]

const TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saída' },
  { value: 'diario', label: 'Diário' },
  { value: 'all', label: 'Todos' },
]

interface CategoryDialogProps {
  category?: Category
  trigger: React.ReactNode
  onSuccess?: () => void
  onClose?: () => void
}

export function CategoryDialog({
  category,
  trigger,
  onSuccess,
  onClose,
}: CategoryDialogProps) {
  const isEditing = !!category

  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(category?.name ?? '')
  const [type, setType] = useState<CategoryType>(category?.type ?? 'saida')
  const [color, setColor] = useState<string>(category?.color ?? PRESET_COLORS[0])
  const [icon, setIcon] = useState<string>(category?.icon ?? '')

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      // Reset to category values (or defaults) each time it opens
      setName(category?.name ?? '')
      setType(category?.type ?? 'saida')
      setColor(category?.color ?? PRESET_COLORS[0])
      setIcon(category?.icon ?? '')
    } else {
      onClose?.()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('O nome da categoria é obrigatório.')
      return
    }

    const payload: CategoryData = {
      name: name.trim(),
      type,
      color,
      icon: icon.trim() || undefined,
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateCategory(category.id, payload)
        : await createCategory(payload)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(isEditing ? 'Categoria atualizada!' : 'Categoria criada!')
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

      <DialogContent className="sm:max-w-md" style={{ backgroundColor: 'var(--surface)' }}>
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>
            {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cat-name"
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Nome
            </label>
            <Input
              id="cat-name"
              placeholder="Ex: Alimentação"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cat-type-trigger"
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Tipo
            </label>
            <Select value={type} onValueChange={(v) => setType(v as CategoryType)}>
              <SelectTrigger id="cat-type-trigger" className="w-full" size="default">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    'h-7 w-7 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                    color === c
                      ? 'border-[var(--text-primary)] scale-110'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Ícone */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="cat-icon"
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Ícone{' '}
              <span style={{ color: 'var(--text-muted)' }}>
                (nome do ícone Lucide, opcional)
              </span>
            </label>
            <Input
              id="cat-icon"
              placeholder="Ex: ShoppingCart"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              disabled={isPending}
            />
          </div>

          <DialogFooter className="-mx-4 -mb-4 mt-2">
            <Button
              type="submit"
              disabled={isPending}
              style={{
                backgroundColor: 'var(--accent-color)',
                color: '#fff',
              }}
            >
              {isPending
                ? isEditing
                  ? 'Salvando...'
                  : 'Criando...'
                : isEditing
                ? 'Salvar'
                : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
