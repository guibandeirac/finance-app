'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutList,
  BarChart3,
  CreditCard,
  Repeat,
  Tag,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Saldo Diário', icon: LayoutList },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/cartoes', label: 'Cartões', icon: CreditCard },
  { href: '/recorrentes', label: 'Recorrentes', icon: Repeat },
  { href: '/categorias', label: 'Categorias', icon: Tag },
  { href: '/config', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="hidden lg:flex flex-col h-screen w-60 shrink-0 border-r"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Fluxo Caixa
        </span>
      </div>

      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'text-white'
                  : 'hover:text-[var(--text-primary)]'
              )}
              style={
                active
                  ? { backgroundColor: 'var(--accent-color)', color: 'white' }
                  : { color: 'var(--text-secondary)' }
              }
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
