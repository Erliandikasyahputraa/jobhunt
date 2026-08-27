'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { applicationFormSchema } from '@/lib/schemas/application.schema'
import type { ApplicationFormData, ApplicationStatus } from '@/lib/schemas/application.schema'
import type {
  Application,
  ApplicationInsert,
  ApplicationUpdate,
  ApplicationStatusHistoryDB,
} from '@/lib/types/database.types'
import {
  createApplication,
  updateApplication,
  deleteApplication,
  getApplications,
  reorderApplicationsInColumn,
  updateApplicationPosition,
  bulkDeleteApplications,
  bulkUpdateApplicationStatus,
  bulkUpdateApplicationCustomColumn,
  getApplicationHistory,
} from '@/lib/api/applications'

/**
 * Get all applications for the authenticated user
 */
export async function getApplicationsAction(): Promise<Application[]> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Authentication error in getApplicationsAction:', authError)
      }
      throw new Error(`Authentication failed: ${authError.message}`)
    }

    if (!user) {
      throw new Error('Unauthorized: No user session found. Please log in again.')
    }

    const applications = await getApplications(supabase)
    return applications
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch applications in action:', error)
    }

    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Failed to fetch applications: ${error.message}`)
    }

    throw new Error('Failed to fetch applications: Unknown error occurred')
  }
}

/**
 * Create a new application
 */
export async function createApplicationAction(formData: ApplicationFormData): Promise<Application> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Validate form data
  const validatedData = applicationFormSchema.parse(formData)

  // Get the max position for the target status to place new card at the end
  const { data: existingApps } = await supabase
    .from('applications')
    .select('position')
    .eq('status', validatedData.status)
    .eq('user_id', user.id)
    .order('position', { ascending: false })
    .limit(1)

  const maxPosition = existingApps?.[0]?.position || 0
  const newPosition = maxPosition + 1

  const applicationData: ApplicationInsert = {
    company_name: validatedData.company_name,
    company_id: null,
    job_title: validatedData.job_title,
    job_url: validatedData.job_url || null,
    location: validatedData.location || null,
    salary_range: validatedData.salary_range || null,
    status: validatedData.status,
    date_applied: validatedData.date_applied,
    notes: validatedData.notes || null,
    position: newPosition,
    custom_column_id: null,
  }

  try {
    const newApplication = await createApplication(supabase, applicationData)
    revalidatePath('/dashboard')
    revalidatePath('/applications')
    return newApplication
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to create application:', error)
    }
    throw new Error('Failed to create application')
  }
}

/**
 * Update an existing application
 */
export async function updateApplicationAction(
  id: string,
  formData: ApplicationFormData
): Promise<Application> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Fetch existing application to check for status change
  const { data: existingApp, error: fetchError } = await supabase
    .from('applications')
    .select('status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existingApp) {
    throw new Error('Failed to fetch existing application')
  }

  // Validate form data
  const validatedData = applicationFormSchema.parse(formData)

  const updates: ApplicationUpdate = {
    company_name: validatedData.company_name,
    job_title: validatedData.job_title,
    job_url: validatedData.job_url || null,
    location: validatedData.location || null,
    salary_range: validatedData.salary_range || null,
    status: validatedData.status,
    date_applied: validatedData.date_applied,
    notes: validatedData.notes || null,
    updated_at: new Date().toISOString(),
  }

  // Phase 3.1: If core status is manually changed via form, clear custom_column_id
  if (existingApp.status !== validatedData.status) {
    updates.custom_column_id = null
  }

  try {
    const updatedApplication = await updateApplication(supabase, id, updates)
    revalidatePath('/dashboard')
    revalidatePath('/applications')
    return updatedApplication
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to update application:', error)
    }
    throw new Error('Failed to update application')
  }
}

/**
 * Delete an application
 */
export async function deleteApplicationAction(id: string): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  try {
    await deleteApplication(supabase, id)
    revalidatePath('/dashboard')
    revalidatePath('/applications')
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to delete application:', error)
    }
    throw new Error('Failed to delete application')
  }
}

/**
 * Update application status (for drag-and-drop)
 */
export async function updateApplicationStatusAction(
  id: string,
  status: ApplicationStatus
): Promise<Application> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const updates: ApplicationUpdate = {
    status,
    updated_at: new Date().toISOString(),
  }

  try {
    const updatedApplication = await updateApplication(supabase, id, updates)
    revalidatePath('/dashboard')
    revalidatePath('/applications')
    return updatedApplication
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to update application status:', error)
    }
    throw new Error('Failed to update application status')
  }
}

/**
 * Reorder applications within a column
 * Updates positions for multiple applications in bulk
 */
export async function reorderApplicationsAction(
  updates: Array<{ id: string; position: number }>
): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  try {
    await reorderApplicationsInColumn(supabase, updates)
    revalidatePath('/dashboard')
    revalidatePath('/applications')
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to reorder applications:', error)
    }
    throw new Error('Failed to reorder applications')
  }
}

/**
 * Update application position and optionally status (for drag-and-drop)
 * Used for both same-column reordering and cross-column moves
 */
export async function updateApplicationPositionAction(
  id: string,
  position: number,
  status?: ApplicationStatus,
  customColumnId?: string | null
): Promise<Application> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  try {
    const updatedApplication = await updateApplicationPosition(
      supabase,
      id,
      position,
      status,
      customColumnId
    )
    revalidatePath('/dashboard')
    revalidatePath('/applications')
    return updatedApplication
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to update application position:', error)
    }
    throw new Error('Failed to update application position')
  }
}

/**
 * Bulk delete applications
 */
export async function bulkDeleteApplicationsAction(ids: string[]): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  try {
    await bulkDeleteApplications(supabase, ids)
    revalidatePath('/dashboard')
    revalidatePath('/applications')
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to bulk delete applications:', error)
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to delete applications')
  }
}

/**
 * Bulk update application core status
 */
export async function bulkUpdateApplicationStatusAction(
  ids: string[],
  status: ApplicationStatus
): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  try {
    await bulkUpdateApplicationStatus(supabase, ids, status)
    revalidatePath('/dashboard')
    revalidatePath('/applications')
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to bulk update application status:', error)
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to update application status')
  }
}

/**
 * Bulk update application custom column
 */
export async function bulkUpdateApplicationColumnAction(
  ids: string[],
  customColumnId: string | null
): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  try {
    await bulkUpdateApplicationCustomColumn(supabase, ids, customColumnId)
    revalidatePath('/dashboard')
    revalidatePath('/applications')
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to bulk update application custom column:', error)
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to update application column')
  }
}

// ============================================================================
// CUSTOM COLUMNS API
// ============================================================================

import {
  getCustomColumns,
  createCustomColumn,
  updateCustomColumn,
  deleteCustomColumn,
  reorderCustomColumns,
} from '@/lib/api/custom-columns'
import type {
  CustomColumnDB,
  CustomColumnInsert,
  CustomColumnUpdate,
} from '@/lib/types/database.types'

export async function getCustomColumnsAction(): Promise<CustomColumnDB[]> {
  try {
    const supabase = await createClient()
    return await getCustomColumns(supabase)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to get custom columns in action:', error)
    }
    throw new Error('Failed to fetch custom columns')
  }
}

export async function createCustomColumnAction(
  column: CustomColumnInsert
): Promise<CustomColumnDB> {
  try {
    const supabase = await createClient()
    const newColumn = await createCustomColumn(supabase, column)
    revalidatePath('/dashboard')
    revalidatePath('/applications')
    return newColumn
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to create custom column in action:', error)
    }
    throw new Error('Failed to create custom column')
  }
}

export async function updateCustomColumnAction(
  id: string,
  updates: CustomColumnUpdate
): Promise<CustomColumnDB> {
  try {
    const supabase = await createClient()
    const updatedColumn = await updateCustomColumn(supabase, id, updates)
    revalidatePath('/dashboard')
    revalidatePath('/applications')
    return updatedColumn
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to update custom column in action:', error)
    }
    throw new Error('Failed to update custom column')
  }
}

export async function deleteCustomColumnAction(id: string): Promise<void> {
  try {
    const supabase = await createClient()
    await deleteCustomColumn(supabase, id)
    revalidatePath('/dashboard')
    revalidatePath('/applications')
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to delete custom column in action:', error)
    }
    throw new Error('Failed to delete custom column')
  }
}

export async function reorderCustomColumnsAction(
  updates: Array<{ id: string; order: number }>
): Promise<void> {
  try {
    const supabase = await createClient()
    await reorderCustomColumns(supabase, updates)
    revalidatePath('/dashboard')
    revalidatePath('/applications')
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to reorder custom columns in action:', error)
    }
    throw new Error('Failed to reorder custom columns')
  }
}

// ============================================================================
// COMPANY ACTIONS
// ============================================================================

import { getCompanies, getCompanyById, createCompany, updateCompany } from '@/lib/api/companies'
import { createCompanySchema, updateCompanySchema } from '@/lib/schemas/company.schema'
import type { CompanyFormData } from '@/lib/schemas/company.schema'
import type { CompanyDB } from '@/lib/types/database.types'

export async function getCompaniesAction(): Promise<CompanyDB[]> {
  try {
    const supabase = await createClient()
    return await getCompanies(supabase)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to get companies in action:', error)
    }
    throw new Error('Failed to fetch companies')
  }
}

export async function getCompanyByIdAction(id: string): Promise<CompanyDB> {
  try {
    const supabase = await createClient()
    return await getCompanyById(supabase, id)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to get company by id in action:', error)
    }
    throw new Error('Failed to fetch company')
  }
}

export async function createCompanyAction(formData: CompanyFormData): Promise<CompanyDB> {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Validate
    const validatedData = createCompanySchema.parse(formData)

    const newCompany = await createCompany(supabase, validatedData as any)
    return newCompany
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to create company in action:', error)
    }
    throw new Error('Failed to create company')
  }
}

export async function updateCompanyAction(
  id: string,
  formData: Partial<CompanyFormData>
): Promise<CompanyDB> {
  try {
    const supabase = await createClient()

    // Validate
    const validatedData = updateCompanySchema.parse(formData)

    const updatedCompany = await updateCompany(supabase, id, validatedData as any)
    revalidatePath('/dashboard')
    revalidatePath('/applications')
    return updatedCompany
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to update company in action:', error)
    }
    throw new Error('Failed to update company')
  }
}

export async function linkCompanyAction(applicationId: string, companyId: string): Promise<void> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Update the application
    await updateApplication(supabase, applicationId, {
      company_id: companyId,
      updated_at: new Date().toISOString(),
    })

    revalidatePath('/dashboard')
    revalidatePath('/applications')
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to link company in action:', error)
    }
    throw new Error('Failed to link company')
  }
}

export async function unlinkCompanyAction(applicationId: string): Promise<void> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Update the application to remove company_id
    await updateApplication(supabase, applicationId, {
      company_id: null,
      updated_at: new Date().toISOString(),
    })

    revalidatePath('/dashboard')
    revalidatePath('/applications')
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to unlink company in action:', error)
    }
    throw new Error('Failed to unlink company')
  }
}

/**
 * Get status and column transition history for a specific application
 */
export async function getApplicationHistoryAction(
  applicationId: string
): Promise<ApplicationStatusHistoryDB[]> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('Unauthorized: No user session found')
    }

    return await getApplicationHistory(supabase, applicationId)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to get application history in action:', error)
    }
    return []
  }
}
