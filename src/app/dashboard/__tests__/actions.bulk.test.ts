import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  bulkDeleteApplicationsAction,
  bulkUpdateApplicationStatusAction,
  bulkUpdateApplicationColumnAction,
} from '../actions'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import * as appApi from '@/lib/api/applications'

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
  bulkDeleteApplications: vi.fn(),
  bulkUpdateApplicationStatus: vi.fn(),
  bulkUpdateApplicationCustomColumn: vi.fn(),
  getApplications: vi.fn(),
  createApplication: vi.fn(),
  updateApplication: vi.fn(),
  deleteApplication: vi.fn(),
  reorderApplicationsInColumn: vi.fn(),
  updateApplicationPosition: vi.fn(),
}))

describe('Bulk Server Actions', () => {
  const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  const mockAppIds = [
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  ]
  const mockColId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'

  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
    }
    ;(createClient as any).mockResolvedValue(mockSupabase)
    ;(appApi.bulkDeleteApplications as any).mockResolvedValue(undefined)
    ;(appApi.bulkUpdateApplicationStatus as any).mockResolvedValue(undefined)
    ;(appApi.bulkUpdateApplicationCustomColumn as any).mockResolvedValue(undefined)
  })

  describe('bulkDeleteApplicationsAction', () => {
    it('rejects unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(bulkDeleteApplicationsAction(mockAppIds)).rejects.toThrow('Unauthorized')
      expect(appApi.bulkDeleteApplications).not.toHaveBeenCalled()
    })

    it('successfully calls API and revalidates paths', async () => {
      await bulkDeleteApplicationsAction(mockAppIds)

      expect(appApi.bulkDeleteApplications).toHaveBeenCalledWith(
        mockSupabase,
        mockAppIds,
        mockUserId
      )
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
      expect(revalidatePath).toHaveBeenCalledWith('/applications')
    })

    it('propagates API errors', async () => {
      ;(appApi.bulkDeleteApplications as any).mockRejectedValue(
        new Error('Failed to delete document files')
      )

      await expect(bulkDeleteApplicationsAction(mockAppIds)).rejects.toThrow(
        'Failed to delete document files'
      )
    })
  })

  describe('bulkUpdateApplicationStatusAction', () => {
    it('rejects unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(bulkUpdateApplicationStatusAction(mockAppIds, 'interviewing')).rejects.toThrow(
        'Unauthorized'
      )
      expect(appApi.bulkUpdateApplicationStatus).not.toHaveBeenCalled()
    })

    it('successfully calls API and revalidates paths', async () => {
      await bulkUpdateApplicationStatusAction(mockAppIds, 'offered')

      expect(appApi.bulkUpdateApplicationStatus).toHaveBeenCalledWith(
        mockSupabase,
        mockAppIds,
        'offered',
        mockUserId
      )
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
      expect(revalidatePath).toHaveBeenCalledWith('/applications')
    })

    it('propagates API errors', async () => {
      ;(appApi.bulkUpdateApplicationStatus as any).mockRejectedValue(
        new Error('Database error updating status')
      )

      await expect(bulkUpdateApplicationStatusAction(mockAppIds, 'ghosted')).rejects.toThrow(
        'Database error updating status'
      )
    })
  })

  describe('bulkUpdateApplicationColumnAction', () => {
    it('rejects unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(bulkUpdateApplicationColumnAction(mockAppIds, mockColId)).rejects.toThrow(
        'Unauthorized'
      )
      expect(appApi.bulkUpdateApplicationCustomColumn).not.toHaveBeenCalled()
    })

    it('successfully calls API and revalidates paths', async () => {
      await bulkUpdateApplicationColumnAction(mockAppIds, mockColId)

      expect(appApi.bulkUpdateApplicationCustomColumn).toHaveBeenCalledWith(
        mockSupabase,
        mockAppIds,
        mockColId,
        mockUserId
      )
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
      expect(revalidatePath).toHaveBeenCalledWith('/applications')
    })

    it('propagates API errors', async () => {
      ;(appApi.bulkUpdateApplicationCustomColumn as any).mockRejectedValue(
        new Error('Unauthorized or custom column not found')
      )

      await expect(bulkUpdateApplicationColumnAction(mockAppIds, 'foreign-col-id')).rejects.toThrow(
        'Unauthorized or custom column not found'
      )
    })
  })
})
