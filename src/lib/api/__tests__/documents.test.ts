import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getDocumentsByApplication,
  uploadDocumentToStorage,
  createDocumentRecord,
  getSignedUrl,
  deleteDocument,
} from '../documents'
import type { ApplicationDocumentDB, ApplicationDocumentInsert } from '@/lib/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

const mockDocs: ApplicationDocumentDB[] = [
  {
    id: 'doc-1',
    user_id: 'user-1',
    application_id: '11111111-2222-3333-4444-555555555555',
    name: 'resume.pdf',
    document_type: 'resume',
    storage_path: 'user-1/11111111-2222-3333-4444-555555555555/uuid-1/resume.pdf',
    mime_type: 'application/pdf',
    size_bytes: 1024 * 500,
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
  },
]

describe('Documents API Layer', () => {
  let mockSupabase: any
  let mockQueryBuilder: any
  let mockStorage: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue({ data: mockDocs[0], error: null }),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      then: (resolve: (value: { data: any; error: any }) => void) => {
        resolve({ data: mockDocs, error: null })
      },
    }

    mockStorage = {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: 'https://storage.supabase.co/signed/doc-1' },
          error: null,
        }),
        remove: vi.fn().mockResolvedValue({ error: null }),
      }),
    }

    mockSupabase = {
      from: vi.fn().mockReturnValue(mockQueryBuilder),
      storage: mockStorage,
    }
  })

  describe('getDocumentsByApplication', () => {
    it('fetches documents for an application ordered newest first', async () => {
      const result = await getDocumentsByApplication(
        mockSupabase as unknown as SupabaseClient,
        '11111111-2222-3333-4444-555555555555'
      )
      expect(result).toEqual(mockDocs)
      expect(mockSupabase.from).toHaveBeenCalledWith('application_documents')
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith(
        'application_id',
        '11111111-2222-3333-4444-555555555555'
      )
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('throws error when database fetch fails', async () => {
      mockQueryBuilder.then = (resolve: any) => {
        resolve({ data: null, error: { message: 'Database error' } })
      }
      await expect(
        getDocumentsByApplication(
          mockSupabase as unknown as SupabaseClient,
          '11111111-2222-3333-4444-555555555555'
        )
      ).rejects.toThrow('Failed to fetch documents: Database error')
    })
  })

  describe('uploadDocumentToStorage', () => {
    it('uploads file using secure user_id/application_id/document_uuid/filename path structure', async () => {
      const mockFile = new File(['dummy content'], 'my_resume.pdf', { type: 'application/pdf' })
      const path = await uploadDocumentToStorage(
        mockSupabase as unknown as SupabaseClient,
        'user-1',
        'app-1',
        mockFile,
        'uuid-123',
        'my_resume.pdf'
      )

      expect(path).toBe('user-1/app-1/uuid-123/my_resume.pdf')
      expect(mockStorage.from).toHaveBeenCalledWith('jobhunt_documents')
      expect(mockStorage.from().upload).toHaveBeenCalledWith(
        'user-1/app-1/uuid-123/my_resume.pdf',
        mockFile,
        { cacheControl: '3600', upsert: false }
      )
    })

    it('sanitizes filename to prevent path traversal', async () => {
      const mockFile = new File(['dummy content'], '../../../dangerous.pdf', {
        type: 'application/pdf',
      })
      const path = await uploadDocumentToStorage(
        mockSupabase as unknown as SupabaseClient,
        'user-1',
        'app-1',
        mockFile,
        'uuid-123',
        '../../../dangerous.pdf'
      )

      expect(path).toBe('user-1/app-1/uuid-123/dangerous.pdf')
    })

    it('throws when storage upload returns an error', async () => {
      mockStorage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: { message: 'Bucket full' } }),
      })
      const mockFile = new File(['content'], 'file.pdf', { type: 'application/pdf' })

      await expect(
        uploadDocumentToStorage(
          mockSupabase as unknown as SupabaseClient,
          'user-1',
          'app-1',
          mockFile,
          'uuid-123',
          'file.pdf'
        )
      ).rejects.toThrow('Storage upload failed: Bucket full')
    })
  })

  describe('createDocumentRecord', () => {
    it('creates database record and returns created row', async () => {
      const payload: ApplicationDocumentInsert = {
        application_id: '11111111-2222-3333-4444-555555555555',
        name: 'resume.pdf',
        document_type: 'resume',
        storage_path: 'user-1/11111111-2222-3333-4444-555555555555/uuid-1/resume.pdf',
        mime_type: 'application/pdf',
        size_bytes: 1024,
      }

      const result = await createDocumentRecord(mockSupabase as unknown as SupabaseClient, payload)
      expect(result).toEqual(mockDocs[0])
      expect(mockSupabase.from).toHaveBeenCalledWith('application_documents')
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(payload)
    })

    it('throws error when database insert fails', async () => {
      mockQueryBuilder.single.mockReturnValue({
        data: null,
        error: { message: 'Insert constraint violated' },
      })
      const payload: ApplicationDocumentInsert = {
        application_id: '11111111-2222-3333-4444-555555555555',
        name: 'resume.pdf',
        document_type: 'resume',
        storage_path: 'user-1/11111111-2222-3333-4444-555555555555/uuid-1/resume.pdf',
        mime_type: 'application/pdf',
        size_bytes: 1024,
      }

      await expect(
        createDocumentRecord(mockSupabase as unknown as SupabaseClient, payload)
      ).rejects.toThrow('Database insert failed: Insert constraint violated')
    })
  })

  describe('getSignedUrl', () => {
    it('generates a 60s temporary signed URL for a storage path', async () => {
      const url = await getSignedUrl(
        mockSupabase as unknown as SupabaseClient,
        'user-1/11111111-2222-3333-4444-555555555555/uuid-1/resume.pdf'
      )
      expect(url).toBe('https://storage.supabase.co/signed/doc-1')
      expect(mockStorage.from).toHaveBeenCalledWith('jobhunt_documents')
      expect(mockStorage.from().createSignedUrl).toHaveBeenCalledWith(
        'user-1/11111111-2222-3333-4444-555555555555/uuid-1/resume.pdf',
        60
      )
    })

    it('throws error if signed URL generation fails', async () => {
      mockStorage.from.mockReturnValue({
        createSignedUrl: vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'Object not found' } }),
      })

      await expect(
        getSignedUrl(
          mockSupabase as unknown as SupabaseClient,
          'user-1/11111111-2222-3333-4444-555555555555/uuid-1/missing.pdf'
        )
      ).rejects.toThrow('Failed to generate signed URL: Object not found')
    })
  })

  describe('deleteDocument', () => {
    it('deletes from storage first, then deletes metadata row', async () => {
      mockQueryBuilder.then = (resolve: any) => {
        resolve({ data: null, error: null })
      }

      await deleteDocument(
        mockSupabase as unknown as SupabaseClient,
        'doc-1',
        'user-1/11111111-2222-3333-4444-555555555555/uuid-1/resume.pdf'
      )

      expect(mockStorage.from).toHaveBeenCalledWith('jobhunt_documents')
      expect(mockStorage.from().remove).toHaveBeenCalledWith([
        'user-1/11111111-2222-3333-4444-555555555555/uuid-1/resume.pdf',
      ])
      expect(mockSupabase.from).toHaveBeenCalledWith('application_documents')
      expect(mockQueryBuilder.delete).toHaveBeenCalled()
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'doc-1')
    })

    it('throws error if storage deletion fails without deleting db record', async () => {
      mockStorage.from.mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: { message: 'Storage error' } }),
      })

      await expect(
        deleteDocument(
          mockSupabase as unknown as SupabaseClient,
          'doc-1',
          'user-1/11111111-2222-3333-4444-555555555555/uuid-1/resume.pdf'
        )
      ).rejects.toThrow('Failed to delete storage object: Storage error')

      // Database delete should NOT have been called
      expect(mockQueryBuilder.delete).not.toHaveBeenCalled()
    })
  })
})
