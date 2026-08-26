import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateApplicationAction } from '../actions'
import { createClient } from '@/lib/supabase/server'
import * as appApi from '@/lib/api/applications'
import type { ApplicationFormData } from '@/lib/schemas/application.schema'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock applications API
vi.mock('@/lib/api/applications', () => ({
  updateApplication: vi.fn(),
}))

describe('updateApplicationAction (Phase 3.1 Custom Column Consistency)', () => {
  const mockUserId = 'user-123'
  const mockApplicationId = 'app-456'

  let mockSupabase: any
  let mockQueryBuilder: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    }

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
      from: vi.fn().mockReturnValue(mockQueryBuilder),
    }
    ;(createClient as any).mockResolvedValue(mockSupabase)
    ;(appApi.updateApplication as any).mockResolvedValue({} as any)
  })

  const validFormData: ApplicationFormData = {
    company_name: 'Test Co',
    job_title: 'Engineer',
    status: 'interviewing',
    date_applied: '2025-01-01',
    job_url: '',
    location: '',
    salary_range: '',
    notes: '',
  }

  it('1. Form status change clears custom_column_id', async () => {
    // Database returns 'applied'
    mockQueryBuilder.single.mockResolvedValue({
      data: { status: 'applied' },
      error: null,
    })

    // Form submits 'interviewing'
    await updateApplicationAction(mockApplicationId, validFormData)

    // We should expect updateApplication to be called with custom_column_id: null
    expect(appApi.updateApplication).toHaveBeenCalledWith(
      mockSupabase,
      mockApplicationId,
      expect.objectContaining({
        status: 'interviewing',
        custom_column_id: null,
      })
    )
  })

  it('2. Form update without status change does not unnecessarily alter custom_column_id', async () => {
    // Database returns 'interviewing' (same as form)
    mockQueryBuilder.single.mockResolvedValue({
      data: { status: 'interviewing' },
      error: null,
    })

    // Form submits 'interviewing'
    await updateApplicationAction(mockApplicationId, validFormData)

    // custom_column_id should NOT be set to null, it should be undefined in the updates object
    expect(appApi.updateApplication).toHaveBeenCalledWith(
      mockSupabase,
      mockApplicationId,
      expect.not.objectContaining({
        custom_column_id: null,
      })
    )
  })

  it('should throw error if user is unauthorized', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    await expect(updateApplicationAction(mockApplicationId, validFormData)).rejects.toThrow(
      'Unauthorized'
    )
  })

  it('should throw error if existing application cannot be fetched', async () => {
    mockQueryBuilder.single.mockResolvedValue({
      data: null,
      error: new Error('Not found'),
    })

    await expect(updateApplicationAction(mockApplicationId, validFormData)).rejects.toThrow(
      'Failed to fetch existing application'
    )
  })
})
