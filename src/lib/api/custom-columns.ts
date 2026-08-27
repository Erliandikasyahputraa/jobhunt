import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CustomColumnDB,
  CustomColumnInsert,
  CustomColumnUpdate,
} from '@/lib/types/database.types'

async function verifyAuthenticationContext(
  supabase: SupabaseClient,
  userId?: string
): Promise<string> {
  if (userId) {
    return userId
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Authentication failed or no user found.')
  }

  return user.id
}

export async function getCustomColumns(
  supabase: SupabaseClient,
  userId?: string
): Promise<CustomColumnDB[]> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    const { data, error } = await supabase
      .from('custom_columns')
      .select('*')
      .eq('user_id', authenticatedUserId)
      .order('order', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch custom columns: ${error.message}`)
    }

    return data || []
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('getCustomColumns error:', error)
    }
    throw error
  }
}

export async function createCustomColumn(
  supabase: SupabaseClient,
  column: CustomColumnInsert,
  userId?: string
): Promise<CustomColumnDB> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    const columnWithUser = { ...column, user_id: authenticatedUserId }

    const { data, error } = await supabase
      .from('custom_columns')
      .insert(columnWithUser)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create custom column: ${error.message}`)
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('createCustomColumn error:', error)
    }
    throw error
  }
}

export async function updateCustomColumn(
  supabase: SupabaseClient,
  id: string,
  updates: CustomColumnUpdate,
  userId?: string
): Promise<CustomColumnDB> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    const { data, error } = await supabase
      .from('custom_columns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', authenticatedUserId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update custom column: ${error.message}`)
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('updateCustomColumn error:', error)
    }
    throw error
  }
}

export async function deleteCustomColumn(
  supabase: SupabaseClient,
  id: string,
  userId?: string
): Promise<void> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    const { error } = await supabase
      .from('custom_columns')
      .delete()
      .eq('id', id)
      .eq('user_id', authenticatedUserId)

    if (error) {
      throw new Error(`Failed to delete custom column: ${error.message}`)
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('deleteCustomColumn error:', error)
    }
    throw error
  }
}

export async function reorderCustomColumns(
  supabase: SupabaseClient,
  updates: Array<{ id: string; order: number }>,
  userId?: string
): Promise<void> {
  try {
    const authenticatedUserId = await verifyAuthenticationContext(supabase, userId)

    const updatePromises = updates.map(({ id, order }) =>
      supabase
        .from('custom_columns')
        .update({ order, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', authenticatedUserId)
    )

    const results = await Promise.all(updatePromises)
    const errors = results.filter(result => result.error)

    if (errors.length > 0) {
      throw new Error('Failed to reorder custom columns')
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('reorderCustomColumns error:', error)
    }
    throw error
  }
}
