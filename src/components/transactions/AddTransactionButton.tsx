'use client'

import { useState } from 'react'
import { PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import type { Category } from '@/app/actions/categories'
import type { CreditCard } from '@/app/actions/cards'

interface AddTransactionButtonProps {
  categories: Category[]
  cards?: CreditCard[]
  onSuccess?: () => void
}

export function AddTransactionButton({ categories, cards, onSuccess }: AddTransactionButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile FAB */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Nova transação"
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 lg:hidden"
        style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      {/* Desktop button */}
      <Button
        onClick={() => setOpen(true)}
        className="hidden lg:flex"
        style={{ backgroundColor: 'var(--accent-color)', color: '#fff' }}
      >
        <PlusIcon className="mr-2 h-4 w-4" />
        Nova transação
      </Button>

      {/* Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="h-[90dvh] rounded-t-2xl p-0 sm:h-full sm:max-w-md sm:rounded-none"
          style={{ backgroundColor: 'var(--surface)' }}
        >
          <TransactionForm
            categories={categories}
            cards={cards}
            onSuccess={() => {
              setOpen(false)
              onSuccess?.()
            }}
          />
        </SheetContent>
      </Sheet>
    </>
  )
}
