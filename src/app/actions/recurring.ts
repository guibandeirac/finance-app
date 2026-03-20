'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecurringType = 'entrada' | 'saida' | 'diario'

export interface RecurringTransaction {
  id: string
  user_id: string
  description: string
  amount: number
  type: RecurringType
  category_id: string | null
  estimated_day: number
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
}

export interface RecurringData {
  amount: number
  type: RecurringType
  category_id?: string | null
  description: string
  estimated_day: number
  start_date: string
  end_date?: string | null
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function getRecurring(): Promise<{ data: RecurringTransaction[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('description', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createRecurring(
  recurringData: RecurringData
): Promise<{ data: RecurringTransaction | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert({
      user_id: user.id,
      description: recurringData.description,
      amount: recurringData.amount,
      type: recurringData.type,
      category_id: recurringData.category_id ?? null,
      estimated_day: recurringData.estimated_day,
      start_date: recurringData.start_date,
      end_date: recurringData.end_date ?? null,
      is_active: true,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/recorrentes')
  return { data, error: null }
}

export async function updateRecurring(
  id: string,
  recurringData: Partial<RecurringData>
): Promise<{ data: RecurringTransaction | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data, error } = await supabase
    .from('recurring_transactions')
    .update({
      ...(recurringData.description !== undefined && { description: recurringData.description }),
      ...(recurringData.amount !== undefined && { amount: recurringData.amount }),
      ...(recurringData.type !== undefined && { type: recurringData.type }),
      ...(recurringData.category_id !== undefined && { category_id: recurringData.category_id }),
      ...(recurringData.estimated_day !== undefined && { estimated_day: recurringData.estimated_day }),
      ...(recurringData.start_date !== undefined && { start_date: recurringData.start_date }),
      ...(recurringData.end_date !== undefined && { end_date: recurringData.end_date }),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/recorrentes')
  return { data, error: null }
}

export async function deleteRecurring(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/recorrentes')
  return { error: null }
}

export async function toggleRecurring(
  id: string,
  is_active: boolean
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase
    .from('recurring_transactions')
    .update({ is_active })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/recorrentes')
  return { error: null }
}
