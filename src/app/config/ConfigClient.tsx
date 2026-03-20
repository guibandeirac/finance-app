'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

export function ConfigClient() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
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

  const themeOptions = [
    { label: 'Claro', value: 'light' },
    { label: 'Escuro', value: 'dark' },
    { label: 'Sistema', value: 'system' },
  ]

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-semibold mb-8" style={{ color: 'var(--text-primary)' }}>
        Configurações
      </h1>

      {/* Aparência */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
          Aparência
        </h2>
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Tema
          </p>
          <div className="flex gap-2">
            {mounted &&
              themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    theme === opt.value
                      ? 'border-transparent text-white'
                      : 'hover:bg-[var(--surface-hover)]'
                  )}
                  style={
                    theme === opt.value
                      ? { backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)' }
                      : { borderColor: 'var(--border)', color: 'var(--text-secondary)' }
                  }
                >
                  {opt.label}
                </button>
              ))}
          </div>
        </div>
      </section>

      {/* Conta */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
          Conta
        </h2>
        <div
          className="rounded-xl border p-4 flex items-center justify-between gap-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
            {user?.email ?? '—'}
          </p>
          <Button variant="outline" size="sm" onClick={handleLogout} style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            Sair
          </Button>
        </div>
      </section>

      {/* Dados */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
          Dados
        </h2>
        <div
          className="rounded-xl border p-4 flex items-center justify-between gap-4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Categorias
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/categorias')}
            style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
          >
            Gerenciar
          </Button>
        </div>
      </section>
    </div>
  )
}
