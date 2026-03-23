'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'

// ─── Internal helper ──────────────────────────────────────────────────────────

async function recalcBills(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  card_id: string,
  user_id: string
) {
  await supabase.rpc('recalculate_card_bills', {
    p_card_id: card_id,
    p_user_id: user_id,
  })
}

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
  item_type: 'fixed' | 'installment' | 'variable'
  description: string
  category_id: string | null
  amount: number
  // installment fields
  start_month: string | null   // YYYY-MM-DD (first of month)
  end_month: string | null     // YYYY-MM-DD (first of month)
  // variable fields
  reference_month: string | null  // YYYY-MM-DD (first of month)
  // legacy (kept for fixed items)
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
  amount: number
  description: string | null
  category_id: string | null
  category?: { name: string; color: string | null } | null
}

export interface BillBreakdownItem {
  id: string
  description: string
  amount: number
  category_id: string | null
  item_type: 'fixed' | 'installment' | 'variable'
  current_inst: number | null
  total_inst: number | null
  reference_month: string | null
  is_active: boolean
}

export interface BillBreakdown {
  fixed: BillBreakdownItem[]
  installments: BillBreakdownItem[]
  variable: BillBreakdownItem[]
  totals: {
    fixed: number
    installments: number
    variable: number
    total: number
  }
}

export interface CardItemData {
  card_id: string
  item_type: 'fixed' | 'installment' | 'variable'
  description: string
  amount: number
  category_id?: string | null
  // installment
  start_month?: string | null
  end_month?: string | null
  // variable
  reference_month?: string | null
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
    .in('item_type', ['fixed', 'installment'])
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

  const { data, error } = await supabase
    .from('credit_card_items')
    .insert({
      user_id: user.id,
      card_id: itemData.card_id,
      item_type: itemData.item_type,
      description: itemData.description,
      amount: itemData.amount,
      category_id: itemData.category_id ?? null,
      start_month: itemData.start_month ?? null,
      end_month: itemData.end_month ?? null,
      reference_month: itemData.reference_month ?? null,
      is_active: true,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  await recalcBills(supabase, itemData.card_id, user.id)
  revalidatePath('/')
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
      ...(itemData.start_month !== undefined && { start_month: itemData.start_month }),
      ...(itemData.end_month !== undefined && { end_month: itemData.end_month }),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  if (data?.card_id) await recalcBills(supabase, data.card_id, user.id)
  revalidatePath('/')
  revalidatePath('/cartoes')
  return { data, error: null }
}

export async function deleteCardItem(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  // Fetch card_id before deleting
  const { data: item } = await supabase
    .from('credit_card_items')
    .select('card_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('credit_card_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  if (item?.card_id) await recalcBills(supabase, item.card_id, user.id)
  revalidatePath('/')
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

  const { data, error } = await supabase
    .from('credit_card_items')
    .update({ is_active })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('card_id')
    .single()

  if (error) return { error: error.message }

  if (data?.card_id) await recalcBills(supabase, data.card_id, user.id)
  revalidatePath('/')
  revalidatePath('/cartoes')
  return { error: null }
}

// ─── Variable Card Items ───────────────────────────────────────────────────────

export async function createVariableCardItem(data: {
  card_id: string
  description: string
  amount: number
  category_id?: string | null
  reference_month: string   // YYYY-MM-DD
}): Promise<{ data: CardItemType | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data: item, error } = await supabase
    .from('credit_card_items')
    .insert({
      user_id: user.id,
      card_id: data.card_id,
      item_type: 'variable',
      description: data.description,
      amount: data.amount,
      category_id: data.category_id ?? null,
      reference_month: data.reference_month,
      is_active: true,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Recalculate all existing bills for this card (authoritative DB calculation)
  await recalcBills(supabase, data.card_id, user.id)
  revalidatePath('/')
  revalidatePath('/cartoes')
  return { data: item, error: null }
}

export async function deleteVariableCardItem(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { data: item } = await supabase
    .from('credit_card_items')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!item) return { error: 'Item não encontrado' }

  const { error } = await supabase
    .from('credit_card_items')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Recalculate all existing bills for this card (authoritative DB calculation)
  await recalcBills(supabase, item.card_id, user.id)
  revalidatePath('/')
  revalidatePath('/cartoes')
  return { error: null }
}

// ─── Bill Breakdown ────────────────────────────────────────────────────────────

export async function getCardBillBreakdown(
  card_id: string,
  year: number,
  month: number
): Promise<{ data: BillBreakdown | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data, error } = await supabase.rpc('get_card_bill_breakdown', {
    p_card_id: card_id,
    p_year: year,
    p_month: month,
  })

  if (error) return { data: null, error: error.message }

  const rows = (data ?? []) as BillBreakdownItem[]
  const fixed = rows.filter((r) => r.item_type === 'fixed')
  const installments = rows.filter((r) => r.item_type === 'installment')
  const variable = rows.filter((r) => r.item_type === 'variable')

  const sumFixed = fixed.reduce((s, r) => s + Number(r.amount), 0)
  const sumInstallments = installments.reduce((s, r) => s + Number(r.amount), 0)
  const sumVariable = variable.reduce((s, r) => s + Number(r.amount), 0)

  return {
    data: {
      fixed,
      installments,
      variable,
      totals: {
        fixed: sumFixed,
        installments: sumInstallments,
        variable: sumVariable,
        total: sumFixed + sumInstallments + sumVariable,
      },
    },
    error: null,
  }
}

// ─── Monthly total & variable expenses ────────────────────────────────────────

export async function getCardMonthlyTotal(
  card_id: string,
  year: number,
  month: number
): Promise<{ data: number | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const billMonth = `${year}-${String(month).padStart(2, '0')}-01`

  const [fixedRes, installRes, varRes] = await Promise.all([
    supabase
      .from('credit_card_items')
      .select('amount')
      .eq('card_id', card_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('item_type', 'fixed')
      .or(`start_month.is.null,start_month.lte.${billMonth}`),
    supabase
      .from('credit_card_items')
      .select('amount')
      .eq('card_id', card_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('item_type', 'installment')
      .lte('start_month', billMonth)
      .gte('end_month', billMonth),
    supabase
      .from('credit_card_items')
      .select('amount')
      .eq('card_id', card_id)
      .eq('user_id', user.id)
      .eq('item_type', 'variable')
      .eq('reference_month', billMonth),
  ])

  if (fixedRes.error) return { data: null, error: fixedRes.error.message }
  if (installRes.error) return { data: null, error: installRes.error.message }
  if (varRes.error) return { data: null, error: varRes.error.message }

  const total =
    (fixedRes.data ?? []).reduce((s, i) => s + Number(i.amount), 0) +
    (installRes.data ?? []).reduce((s, i) => s + Number(i.amount), 0) +
    (varRes.data ?? []).reduce((s, i) => s + Number(i.amount), 0)

  return { data: total, error: null }
}

export async function getCardCategorySpending(
  year: number,
  month: number
): Promise<{ data: { category_id: string | null; amount: number }[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const billMonth = `${year}-${String(month).padStart(2, '0')}-01`

  const [fixedRes, fixedOverridesRes, installRes, varRes] = await Promise.all([
    supabase
      .from('credit_card_items')
      .select('id, category_id, amount')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('item_type', 'fixed')
      .or(`start_month.is.null,start_month.lte.${billMonth}`),
    supabase
      .from('credit_card_item_overrides')
      .select('item_id, is_deleted, override_amount, override_category_id')
      .eq('user_id', user.id)
      .eq('reference_month', billMonth),
    supabase
      .from('credit_card_items')
      .select('category_id, amount')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('item_type', 'installment')
      .lte('start_month', billMonth)
      .gte('end_month', billMonth),
    supabase
      .from('credit_card_items')
      .select('category_id, amount')
      .eq('user_id', user.id)
      .eq('item_type', 'variable')
      .eq('reference_month', billMonth),
  ])

  if (fixedRes.error) return { data: null, error: fixedRes.error.message }
  if (fixedOverridesRes.error) return { data: null, error: fixedOverridesRes.error.message }
  if (installRes.error) return { data: null, error: installRes.error.message }
  if (varRes.error) return { data: null, error: varRes.error.message }

  const overrideMap = new Map(
    (fixedOverridesRes.data ?? []).map((o) => [o.item_id, o])
  )

  const fixedItems = (fixedRes.data ?? [])
    .filter((i) => {
      const o = overrideMap.get(i.id)
      return !o?.is_deleted
    })
    .map((i) => {
      const o = overrideMap.get(i.id)
      return {
        category_id: (o?.override_category_id ?? i.category_id) as string | null,
        amount: Number(o?.override_amount ?? i.amount),
      }
    })

  const items = [
    ...fixedItems,
    ...(installRes.data ?? []).map((i) => ({ category_id: i.category_id as string | null, amount: Number(i.amount) })),
    ...(varRes.data ?? []).map((i) => ({ category_id: i.category_id as string | null, amount: Number(i.amount) })),
  ]

  return { data: items, error: null }
}

// ── Month-specific card item overrides ─────────────────────────────────────────

export async function upsertCardItemOverride(
  itemId: string,
  referenceMonth: string, // YYYY-MM-DD
  data: { amount?: number; category_id?: string | null; is_deleted?: boolean }
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  const { error } = await supabase
    .from('credit_card_item_overrides')
    .upsert({
      item_id: itemId,
      user_id: user.id,
      reference_month: referenceMonth,
      is_deleted: data.is_deleted ?? false,
      ...(data.amount !== undefined && { override_amount: data.amount }),
      ...(data.category_id !== undefined && { override_category_id: data.category_id }),
    }, { onConflict: 'item_id,reference_month' })

  if (error) return { error: error.message }

  // Fetch card_id to recalculate bill
  const { data: item } = await supabase
    .from('credit_card_items')
    .select('card_id')
    .eq('id', itemId)
    .single()

  if (item?.card_id) {
    await supabase.rpc('recalculate_card_bills', {
      p_card_id: item.card_id,
      p_user_id: user.id,
    })
  }

  revalidatePath('/')
  return { error: null }
}

export async function getCardVariableExpenses(
  card_id: string,
  year: number,
  month: number
): Promise<{ data: VariableExpense[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const referenceMonth = `${year}-${String(month).padStart(2, '0')}-01`

  const { data, error } = await supabase
    .from('credit_card_items')
    .select('id, amount, description, category_id, category:categories(name, color)')
    .eq('card_id', card_id)
    .eq('user_id', user.id)
    .eq('item_type', 'variable')
    .eq('reference_month', referenceMonth)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }

  const mapped: VariableExpense[] = (data ?? []).map((row: {
    id: string
    amount: number
    description: string | null
    category_id: string | null
    category: { name: string; color: string | null }[] | null
  }) => ({
    id: row.id,
    amount: row.amount,
    description: row.description,
    category_id: row.category_id,
    category: Array.isArray(row.category) ? row.category[0] ?? null : row.category,
  }))

  return { data: mapped, error: null }
}
