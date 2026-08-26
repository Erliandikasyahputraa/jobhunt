import type { SupabaseClient } from '@supabase/supabase-js'
import type { CompanyDB, CompanyInsert, CompanyUpdate } from '@/lib/types/database.types'

async function verifyAuthenticationContext(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Authentication error:', authError)
    }
    throw new Error(`Authentication failed: ${authError.message}. Please check your login session.`)
  }

  if (!user) {
    throw new Error('No authenticated user found. Please log in and try again.')
  }

  return user.id
}

export async function getCompanies(supabase: SupabaseClient): Promise<CompanyDB[]> {
  try {
    await verifyAuthenticationContext(supabase)

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Database query error:', error)
      }
      throw new Error(`Failed to fetch companies: ${error.message}`)
    }

    return data || []
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('getCompanies error:', error)
    }
    throw error
  }
}

export async function getCompanyById(supabase: SupabaseClient, id: string): Promise<CompanyDB> {
  try {
    const userId = await verifyAuthenticationContext(supabase)

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch company:', error)
      }
      throw new Error(`Failed to fetch company: ${error.message}`)
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('getCompanyById error:', error)
    }
    throw error
  }
}

export async function createCompany(
  supabase: SupabaseClient,
  company: CompanyInsert
): Promise<CompanyDB> {
  try {
    const userId = await verifyAuthenticationContext(supabase)

    const companyWithUser = { ...company, user_id: userId }

    const { data, error } = await supabase
      .from('companies')
      .insert(companyWithUser)
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to create company:', error)
      }
      throw new Error(`Failed to create company: ${error.message}`)
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('createCompany error:', error)
    }
    throw error
  }
}

export async function updateCompany(
  supabase: SupabaseClient,
  id: string,
  updates: CompanyUpdate
): Promise<CompanyDB> {
  try {
    const userId = await verifyAuthenticationContext(supabase)

    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update company:', error)
      }
      throw new Error(`Failed to update company: ${error.message}`)
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('updateCompany error:', error)
    }
    throw error
  }
}

export async function deleteCompany(supabase: SupabaseClient, id: string): Promise<void> {
  try {
    const userId = await verifyAuthenticationContext(supabase)

    const { error } = await supabase.from('companies').delete().eq('id', id).eq('user_id', userId)

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete company:', error)
      }
      throw new Error(`Failed to delete company: ${error.message}`)
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('deleteCompany error:', error)
    }
    throw error
  }
}
