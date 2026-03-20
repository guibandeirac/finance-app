'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Preencha e-mail e senha.')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      toast.error(error.message === 'Invalid login credentials'
        ? 'E-mail ou senha inválidos.'
        : error.message)
      return
    }
    router.push('/')
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      toast.error('Informe seu e-mail para enviar o link mágico.')
      return
    }
    setMagicLinkLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setMagicLinkLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Link mágico enviado! Verifique seu e-mail.')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-8 shadow-sm"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        {/* Logo / title */}
        <div className="mb-8 text-center">
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Fluxo Caixa
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Faça login na sua conta
          </p>
        </div>

        {/* Tab selector */}
        <div
          className="mb-6 flex rounded-lg p-1 gap-1"
          style={{ backgroundColor: 'var(--surface-hover)' }}
        >
          <button
            type="button"
            onClick={() => setMode('password')}
            className={cn(
              'flex-1 rounded-md py-1.5 text-sm font-medium transition-all',
              mode === 'password'
                ? 'bg-white shadow-sm dark:bg-slate-700'
                : 'hover:opacity-70'
            )}
            style={{ color: mode === 'password' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            Senha
          </button>
          <button
            type="button"
            onClick={() => setMode('magic')}
            className={cn(
              'flex-1 rounded-md py-1.5 text-sm font-medium transition-all',
              mode === 'magic'
                ? 'bg-white shadow-sm dark:bg-slate-700'
                : 'hover:opacity-70'
            )}
            style={{ color: mode === 'magic' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            Link mágico
          </button>
        </div>

        {mode === 'password' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 text-sm font-medium"
              style={{ backgroundColor: 'var(--accent-color)' }}
              disabled={loading}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email-magic"
                className="block text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                E-mail
              </label>
              <Input
                id="email-magic"
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 text-sm font-medium"
              style={{ backgroundColor: 'var(--accent-color)' }}
              disabled={magicLinkLoading}
            >
              {magicLinkLoading ? 'Enviando…' : 'Entrar com link mágico'}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Não tem conta?{' '}
          <a
            href="/signup"
            className="font-medium hover:underline"
            style={{ color: 'var(--accent-color)' }}
          >
            Criar conta
          </a>
        </p>
      </div>
    </div>
  )
}
