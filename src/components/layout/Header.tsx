'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

function getInitials(user: User | null): string {
  if (!user) return '?'
  const name: string =
    user.user_metadata?.full_name || user.user_metadata?.name || user.email || ''
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name[0].toUpperCase()
}

function getDisplayName(user: User | null): string {
  if (!user) return ''
  return user.user_metadata?.full_name || user.user_metadata?.name || user.email || ''
}

export function Header() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Erro ao sair. Tente novamente.')
      return
    }
    router.push('/login')
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header
      className="flex items-center justify-between px-6 shrink-0"
      style={{
        height: '56px',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* User info */}
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white shrink-0"
          style={{ backgroundColor: 'var(--accent-color)' }}
          aria-label={getDisplayName(user)}
        >
          {getInitials(user)}
        </div>

        {/* Name / email */}
        <span
          className="hidden text-sm font-medium sm:block truncate max-w-[180px]"
          style={{ color: 'var(--text-primary)' }}
        >
          {getDisplayName(user)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Dark / light toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Alternar tema"
          title="Alternar tema"
        >
          {mounted && theme === 'dark' ? (
            <Sun className="size-4" style={{ color: 'var(--text-secondary)' }} />
          ) : (
            <Moon className="size-4" style={{ color: 'var(--text-secondary)' }} />
          )}
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Sair"
          title="Sair"
        >
          <LogOut className="size-4" style={{ color: 'var(--text-secondary)' }} />
        </Button>
      </div>
    </header>
  )
}
