'use client'

import { PencilIcon, Trash2Icon, CircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Category, CategoryType } from '@/app/actions/categories'

const TYPE_LABELS: Record<CategoryType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  diario: 'Diário',
  all: 'Todos',
}

const TYPE_STYLES: Record<CategoryType, string> = {
  entrada: 'bg-[var(--positive-bg)] text-[var(--positive)] border-transparent',
  saida: 'bg-[var(--negative-bg)] text-[var(--negative)] border-transparent',
  diario: 'bg-[var(--daily-bg)] text-[var(--daily)] border-transparent',
  all: 'bg-muted text-muted-foreground border-transparent',
}

interface CategoryCardProps {
  category: Category
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const typeLabel = TYPE_LABELS[category.type] ?? category.type
  const typeStyle = TYPE_STYLES[category.type] ?? TYPE_STYLES.all
  const dotColor = category.color ?? '#94A3B8'

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border p-4 transition-colors',
        'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-hover)]'
      )}
    >
      {/* Color dot */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${dotColor}22` }}
      >
        <CircleIcon
          className="size-4 fill-current"
          style={{ color: dotColor }}
        />
      </div>

      {/* Name + icon */}
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-sm font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          {category.name}
        </p>
        {category.icon && (
          <p
            className="mt-0.5 truncate text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            {category.icon}
          </p>
        )}
      </div>

      {/* Type badge */}
      <Badge className={cn('shrink-0 text-xs', typeStyle)}>
        {typeLabel}
      </Badge>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(category)}
          aria-label="Editar categoria"
        >
          <PencilIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(category)}
          aria-label="Excluir categoria"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  )
}
