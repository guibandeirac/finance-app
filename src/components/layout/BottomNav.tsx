'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutList, BarChart3, CreditCard, Repeat, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Saldo', icon: LayoutList },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/cartoes', label: 'Cartões', icon: CreditCard },
  { href: '/recorrentes', label: 'Recorrentes', icon: Repeat },
  { href: '/config', label: 'Config', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors',
            )}
            style={{ color: active ? 'var(--accent-color)' : 'var(--text-secondary)' }}
          >
            <Icon size={24} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
