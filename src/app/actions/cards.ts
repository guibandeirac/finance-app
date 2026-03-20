'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreditCard {
  id: string
  user_id: string
  name: string
  due_day: number
  closing_day: number | null
  color: string
  icon: string | null
  is_active: boolean
  created_at: string
}

export interface CardItemType {
  id: string
  card_id: string
  user_id: string
  item_type: 'fixed' | 'installment'
  description: string
  category_id: string | null
  amount: number
  total_installments: number | null
  current_installment: number | null
  start_date: string
  end_date: string | null
  is_active: boolean
  created_at: string
}

export interface CardData {
  name: string
  due_day: number
  closing_day?: number | null
  color: string
}

export interface VariableExpense {
  id: string
  date: string
  amount: number
  description: string | null
  category_id: string | null
  category?: { name: string; color: string | null } | null
}

export interface CardItemData {
  card_id: string
  item_type: 'fixed' | 'installment'
  description: string
  amount: number
  category_id?: string | null
  total_installments?: number | null
  current_installment?: number | null
  start_date?: string
}

// ─── Cards ────────────────────────────────────────────────────────────────────

export async function getCards(): Promise<{ data: CreditCard[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createCard(
  cardData: CardData
): Promise<{ data: CreditCard | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data, error } = await supabase
    .from('credit_cards')
    .insert({
      user_id: user.id,
      name: cardData.name,
      due_day: cardData.due_day,
      closing_day: cardData.closing_day ?? null,
      color: cardData.color,
      is_active: true,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/cartoes')
  return { data, error: null }
}

export async function updateCard(
  id: string,
  cardData: Partial<CardData>
): Promise<{ data: CreditCard | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data, error } = await supabase
    .from('credit_cards')
    .update({
      ...(cardData.name !== undefined && { name: cardData.name }),
      ...(cardData.due_day !== undefined && { due_day: cardData.due_day }),
      ...(cardData.closing_day !== undefined && { closing_day: cardData.closing_day }),
      ...(cardData.color !== undefined && { color: cardData.color }),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/cartoes')
  return { data, error: null }
}

export async function deleteCard(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase
    .from('credit_cards')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/cartoes')
  return { error: null }
}

// ─── Card Items ────────────────────────────────────────────────────────────────

export async function getCardItems(
  card_id: string
): Promise<{ data: CardItemType[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data, error } = await supabase
    .from('credit_card_items')
    .select('*')
    .eq('card_id', card_id)
    .eq('user_id', user.id)
    .order('item_type', { ascending: true })
    .order('description', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createCardItem(
  itemData: CardItemData
): Promise<{ data: CardItemType | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('credit_card_items')
    .insert({
      user_id: user.id,
      card_id: itemData.card_id,
      item_type: itemData.item_type,
      description: itemData.description,
      amount: itemData.amount,
      category_id: itemData.category_id ?? null,
      total_installments: itemData.total_installments ?? null,
      current_installment: itemData.current_installment ?? null,
      start_date: itemData.start_date ?? today,
      is_active: true,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/cartoes')
  return { data, error: null }
}

export async function updateCardItem(
  id: string,
  itemData: Partial<CardItemData>
): Promise<{ data: CardItemType | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data, error } = await supabase
    .from('credit_card_items')
    .update({
      ...(itemData.description !== undefined && { description: itemData.description }),
      ...(itemData.amount !== undefined && { amount: itemData.amount }),
      ...(itemData.category_id !== undefined && { category_id: itemData.category_id }),
      ...(itemData.total_installments !== undefined && { total_installments: itemData.total_installments }),
      ...(itemData.current_installment !== undefined && { current_installment: itemData.current_installment }),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/cartoes')
  return { data, error: null }
}

export async function deleteCardItem(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase
    .from('credit_card_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/cartoes')
  return { error: null }
}

export async function toggleCardItem(
  id: string,
  is_active: boolean
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase
    .from('credit_card_items')
    .update({ is_active })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/cartoes')
  return { error: null }
}

export async function getCardMonthlyTotal(
  card_id: string,
  year: number,
  month: number
): Promise<{ data: number | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0)
  const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

  // Sum fixed items + installments
  const { data: items, error: itemsError } = await supabase
    .from('credit_card_items')
    .select('amount')
    .eq('card_id', card_id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .lte('start_date', endDateStr)
    .or(`end_date.is.null,end_date.gte.${startDate}`)

  if (itemsError) return { data: null, error: itemsError.message }

  // Fetch card to get closing_day for billing cycle
  const { data: card } = await supabase
    .from('credit_cards')
    .select('closing_day')
    .eq('id', card_id)
    .single()

  // Compute billing cycle for variable expenses
  let cycleStart: string
  let cycleEnd: string

  if (card?.closing_day) {
    const cd = card.closing_day
    cycleEnd = `${year}-${String(month).padStart(2, '0')}-${String(cd).padStart(2, '0')}`
    if (month === 1) {
      cycleStart = `${year - 1}-12-${String(cd + 1).padStart(2, '0')}`
    } else {
      cycleStart = `${year}-${String(month - 1).padStart(2, '0')}-${String(cd + 1).padStart(2, '0')}`
    }
  } else {
    if (month === 1) {
      cycleStart = `${year - 1}-12-01`
      cycleEnd = `${year - 1}-12-31`
    } else {
      cycleStart = `${year}-${String(month - 1).padStart(2, '0')}-01`
      const prevEnd = new Date(year, month - 1, 0)
      cycleEnd = `${year}-${String(month - 1).padStart(2, '0')}-${String(prevEnd.getDate()).padStart(2, '0')}`
    }
  }

  const { data: varExpenses } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', user.id)
    .eq('credit_card_id', card_id)
    .eq('is_card_bill', false)
    .gte('date', cycleStart)
    .lte('date', cycleEnd)

  const itemsTotal = (items ?? []).reduce((sum, item) => sum + Number(item.amount), 0)
  const varTotal = (varExpenses ?? []).reduce((sum, tx) => sum + Number(tx.amount), 0)
  return { data: itemsTotal + varTotal, error: null }
}

export async function getCardVariableExpenses(
  card_id: string,
  year: number,
  month: number
): Promise<{ data: VariableExpense[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  // Fetch card to get closing_day
  const { data: card } = await supabase
    .from('credit_cards')
    .select('closing_day')
    .eq('id', card_id)
    .single()

  let cycleStart: string
  let cycleEnd: string

  if (card?.closing_day) {
    const cd = card.closing_day
    cycleEnd = `${year}-${String(month).padStart(2, '0')}-${String(cd).padStart(2, '0')}`
    if (month === 1) {
      cycleStart = `${year - 1}-12-${String(cd + 1).padStart(2, '0')}`
    } else {
      cycleStart = `${year}-${String(month - 1).padStart(2, '0')}-${String(cd + 1).padStart(2, '0')}`
    }
  } else {
    if (month === 1) {
      cycleStart = `${year - 1}-12-01`
      cycleEnd = `${year - 1}-12-31`
    } else {
      cycleStart = `${year}-${String(month - 1).padStart(2, '0')}-01`
      const prevEnd = new Date(year, month - 1, 0)
      cycleEnd = `${year}-${String(month - 1).padStart(2, '0')}-${String(prevEnd.getDate()).padStart(2, '0')}`
    }
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('id, date, amount, description, category_id, category:categories(name, color)')
    .eq('user_id', user.id)
    .eq('credit_card_id', card_id)
    .eq('is_card_bill', false)
    .gte('date', cycleStart)
    .lte('date', cycleEnd)
    .order('date', { ascending: true })

  if (error) return { data: null, error: error.message }
  // Supabase returns joined relations as arrays; map to flat shape
  const mapped: VariableExpense[] = (data ?? []).map((row: {
    id: string
    date: string
    amount: number
    description: string | null
    category_id: string | null
    category: { name: string; color: string | null }[] | null
  }) => ({
    id: row.id,
    date: row.date,
    amount: row.amount,
    description: row.description,
    category_id: row.category_id,
    category: Array.isArray(row.category) ? row.category[0] ?? null : row.category,
  }))
  return { data: mapped, error: null }
}
