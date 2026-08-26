import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  bulkDeleteApplications,
  bulkUpdateApplicationStatus,
  bulkUpdateApplicationCustomColumn,
} from '../applications'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('Applications Bulk API', () => {
  const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  const mockAppId1 = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
  const mockAppId2 = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
  const mockColId = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44'

  let mockSupabase: any
  let queryBuilders: Record<string, any>
  let storageRemoveMock: any

  beforeEach(() => {
    vi.clearAllMocks()

    storageRemoveMock = vi.fn().mockResolvedValue({ error: null })

    queryBuilders = {
      applications: {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      },
      application_documents: {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [
            { storage_path: `${mockUserId}/${mockAppId1}/doc1/resume.pdf` },
            { storage_path: `${mockUserId}/${mockAppId2}/doc2/cover.pdf` },
          ],
          error: null,
        }),
      },
      custom_columns: {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockColId, user_id: mockUserId },
          error: null,
        }),
      },
    }

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        return (
          queryBuilders[table] || {
            select: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        )
      }),
      storage: {
        from: vi.fn(() => ({
          remove: storageRemoveMock,
        })),
      },
    }
  })

  describe('bulkDeleteApplications', () => {
    it('throws when user is unauthenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        bulkDeleteApplications(mockSupabase as unknown as SupabaseClient, [mockAppId1])
      ).rejects.toThrow('No authenticated user found')
    })

    it('throws when application IDs array is empty', async () => {
      await expect(
        bulkDeleteApplications(mockSupabase as unknown as SupabaseClient, [])
      ).rejects.toThrow('At least one application must be selected')
    })

    it('throws when application IDs contain invalid UUIDs', async () => {
      await expect(
        bulkDeleteApplications(mockSupabase as unknown as SupabaseClient, ['not-a-uuid'])
      ).rejects.toThrow('Invalid application ID')
    })

    it('throws when batch size exceeds 100', async () => {
      const excessive = Array.from({ length: 101 }, () => mockAppId1)
      await expect(
        bulkDeleteApplications(mockSupabase as unknown as SupabaseClient, excessive)
      ).rejects.toThrow('Cannot process more than 100 applications')
    })

    it('fetches document storage paths scoped to authenticated user and deletes storage objects before DB deletion', async () => {
      await bulkDeleteApplications(mockSupabase as unknown as SupabaseClient, [
        mockAppId1,
        mockAppId2,
      ])

      // 1. Check document query
      expect(mockSupabase.from).toHaveBeenCalledWith('application_documents')
      expect(queryBuilders.application_documents.select).toHaveBeenCalledWith('storage_path')
      expect(queryBuilders.application_documents.in).toHaveBeenCalledWith('application_id', [
        mockAppId1,
        mockAppId2,
      ])
      expect(queryBuilders.application_documents.eq).toHaveBeenCalledWith('user_id', mockUserId)

      // 2. Check storage removal
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('jobhunt_documents')
      expect(storageRemoveMock).toHaveBeenCalledWith([
        `${mockUserId}/${mockAppId1}/doc1/resume.pdf`,
        `${mockUserId}/${mockAppId2}/doc2/cover.pdf`,
      ])

      // 3. Check DB deletion
      expect(mockSupabase.from).toHaveBeenCalledWith('applications')
      expect(queryBuilders.applications.delete).toHaveBeenCalled()
      expect(queryBuilders.applications.in).toHaveBeenCalledWith('id', [mockAppId1, mockAppId2])
      expect(queryBuilders.applications.eq).toHaveBeenCalledWith('user_id', mockUserId)
    })

    it('prevents DB deletion if storage object cleanup fails', async () => {
      storageRemoveMock.mockResolvedValue({
        error: new Error('Storage network error'),
      })

      await expect(
        bulkDeleteApplications(mockSupabase as unknown as SupabaseClient, [mockAppId1])
      ).rejects.toThrow('Failed to delete document files: Storage network error')

      // Database delete should NOT have been called
      expect(queryBuilders.applications.delete).not.toHaveBeenCalled()
    })

    it('handles applications with no attached documents gracefully', async () => {
      queryBuilders.application_documents.eq.mockResolvedValue({
        data: [],
        error: null,
      })

      await bulkDeleteApplications(mockSupabase as unknown as SupabaseClient, [mockAppId1])

      expect(storageRemoveMock).not.toHaveBeenCalled()
      expect(queryBuilders.applications.delete).toHaveBeenCalled()
    })
  })

  describe('bulkUpdateApplicationStatus', () => {
    it('throws for invalid status enum', async () => {
      await expect(
        bulkUpdateApplicationStatus(
          mockSupabase as unknown as SupabaseClient,
          [mockAppId1],
          'invalid_status' as any
        )
      ).rejects.toThrow()
    })

    it('updates status and resets custom_column_id to null (Phase 3.1 Invariant)', async () => {
      await bulkUpdateApplicationStatus(
        mockSupabase as unknown as SupabaseClient,
        [mockAppId1, mockAppId2],
        'interviewing'
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('applications')
      expect(queryBuilders.applications.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'interviewing',
          custom_column_id: null,
          updated_at: expect.any(String),
        })
      )
      expect(queryBuilders.applications.in).toHaveBeenCalledWith('id', [mockAppId1, mockAppId2])
      expect(queryBuilders.applications.eq).toHaveBeenCalledWith('user_id', mockUserId)
    })

    it('throws if database query errors', async () => {
      queryBuilders.applications.eq.mockReturnValue({
        error: new Error('DB connection failed'),
      })

      await expect(
        bulkUpdateApplicationStatus(
          mockSupabase as unknown as SupabaseClient,
          [mockAppId1],
          'rejected'
        )
      ).rejects.toThrow('Failed to update application status: DB connection failed')
    })
  })

  describe('bulkUpdateApplicationCustomColumn', () => {
    it('validates custom column ownership when column ID is provided', async () => {
      await bulkUpdateApplicationCustomColumn(
        mockSupabase as unknown as SupabaseClient,
        [mockAppId1],
        mockColId
      )

      expect(mockSupabase.from).toHaveBeenCalledWith('custom_columns')
      expect(queryBuilders.custom_columns.select).toHaveBeenCalledWith('id')
      expect(queryBuilders.custom_columns.eq).toHaveBeenCalledWith('id', mockColId)
      expect(queryBuilders.custom_columns.eq).toHaveBeenCalledWith('user_id', mockUserId)

      expect(queryBuilders.applications.update).toHaveBeenCalledWith(
        expect.objectContaining({
          custom_column_id: mockColId,
          updated_at: expect.any(String),
        })
      )
      expect(queryBuilders.applications.in).toHaveBeenCalledWith('id', [mockAppId1])
      expect(queryBuilders.applications.eq).toHaveBeenCalledWith('user_id', mockUserId)
    })

    it('throws if custom column belongs to another user or does not exist', async () => {
      queryBuilders.custom_columns.single.mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      })

      await expect(
        bulkUpdateApplicationCustomColumn(
          mockSupabase as unknown as SupabaseClient,
          [mockAppId1],
          mockColId
        )
      ).rejects.toThrow('Unauthorized or custom column not found')

      expect(queryBuilders.applications.update).not.toHaveBeenCalled()
    })

    it('allows setting custom_column_id to null without querying custom_columns table', async () => {
      await bulkUpdateApplicationCustomColumn(
        mockSupabase as unknown as SupabaseClient,
        [mockAppId1],
        null
      )

      expect(mockSupabase.from).not.toHaveBeenCalledWith('custom_columns')
      expect(queryBuilders.applications.update).toHaveBeenCalledWith(
        expect.objectContaining({
          custom_column_id: null,
          updated_at: expect.any(String),
        })
      )
    })
  })
})
