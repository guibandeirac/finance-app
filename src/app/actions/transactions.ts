'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Category } from '@/app/actions/categories'

export type TransactionType = 'entrada' | 'saida' | 'diario'

export interface Transaction {
  id: string
  user_id: string
  date: string
  amount: number
  type: TransactionType
  category_id: string | null
  description: string | null
  recurring_id: string | null
  credit_card_id: string | null
  is_card_bill: boolean
  created_at: string
  updated_at: string
  category?: Category | null
}

export interface TransactionData {
  date: string
  amount: number
  type: TransactionType
  category_id?: string | null
  description?: string | null
  credit_card_id?: string | null
}

export async function getTransactionsByMonth(
  year: number,
  month: number
): Promise<{ data: Transaction[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0)
  const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDateStr)
    .order('date', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data as Transaction[], error: null }
}

export async function getTransactionsByDay(
  date: string
): Promise<{ data: Transaction[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('user_id', user.id)
    .eq('date', date)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data as Transaction[], error: null }
}

export async function createTransaction(
  transactionData: TransactionData
): Promise<{ data: Transaction | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      date: transactionData.date,
      amount: transactionData.amount,
      type: transactionData.type,
      category_id: transactionData.category_id ?? null,
      description: transactionData.description ?? null,
      credit_card_id: transactionData.credit_card_id ?? null,
      is_card_bill: false,
    })
    .select('*, category:categories(*)')
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/')
  return { data: data as Transaction, error: null }
}

export async function updateTransaction(
  id: string,
  transactionData: Partial<TransactionData>
): Promise<{ data: Transaction | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data, error } = await supabase
    .from('transactions')
    .update({
      ...(transactionData.date !== undefined && { date: transactionData.date }),
      ...(transactionData.amount !== undefined && { amount: transactionData.amount }),
      ...(transactionData.type !== undefined && { type: transactionData.type }),
      ...(transactionData.category_id !== undefined && { category_id: transactionData.category_id }),
      ...(transactionData.description !== undefined && { description: transactionData.description }),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, category:categories(*)')
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/')
  return { data: data as Transaction, error: null }
}

export async function deleteTransaction(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  return { error: null }
}
