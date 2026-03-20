'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type CategoryType = 'entrada' | 'saida' | 'diario' | 'all'

export interface Category {
  id: string
  user_id: string
  name: string
  type: CategoryType
  icon: string | null
  color: string | null
  is_default: boolean
  created_at: string
}

export interface CategoryData {
  name: string
  type: CategoryType
  icon?: string
  color?: string
}

export async function getCategories(): Promise<{ data: Category[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createCategory(
  formData: CategoryData
): Promise<{ data: Category | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name: formData.name,
      type: formData.type,
      icon: formData.icon || null,
      color: formData.color || null,
      is_default: false,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/categorias')
  return { data, error: null }
}

export async function updateCategory(
  id: string,
  formData: CategoryData
): Promise<{ data: Category | null; error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Usuário não autenticado' }

  const { data, error } = await supabase
    .from('categories')
    .update({
      name: formData.name,
      type: formData.type,
      icon: formData.icon || null,
      color: formData.color || null,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidatePath('/categorias')
  return { data, error: null }
}

export async function deleteCategory(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Usuário não autenticado' }

  // Check if any transactions reference this category
  const { count, error: checkError } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)
    .eq('user_id', user.id)

  if (checkError) return { error: checkError.message }

  if (count && count > 0) {
    return {
      error: `Esta categoria está sendo usada em ${count} transação${count > 1 ? 'ões' : ''} e não pode ser excluída.`,
    }
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/categorias')
  return { error: null }
}
