import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  uploadApplicationDocumentAction,
  deleteApplicationDocumentAction,
  getDocumentUrlAction,
  getDocumentsByApplicationAction,
} from '../actions/documents'
import { createClient } from '@/lib/supabase/server'
import * as docApi from '@/lib/api/documents'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Mock document API
vi.mock('@/lib/api/documents', () => ({
  uploadDocumentToStorage: vi.fn(),
  createDocumentRecord: vi.fn(),
  getSignedUrl: vi.fn(),
  deleteDocument: vi.fn(),
  getDocumentsByApplication: vi.fn(),
}))

describe('Documents Server Actions', () => {
  const mockUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  const mockApplicationId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
  const mockDocId = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'
  const mockStoragePath = `${mockUserId}/${mockApplicationId}/uuid-1/resume.pdf`

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
      storage: {
        from: vi.fn().mockReturnValue({
          remove: vi.fn().mockResolvedValue({ error: null }),
        }),
      },
    }
    ;(createClient as any).mockResolvedValue(mockSupabase)
  })

  describe('uploadApplicationDocumentAction', () => {
    const createMockFormData = (options?: {
      filename?: string
      size?: number
      type?: string
      appId?: string
      docType?: string
    }) => {
      const {
        filename = 'resume.pdf',
        size = 1024 * 1024,
        type = 'application/pdf',
        appId = mockApplicationId,
        docType = 'resume',
      } = options || {}

      const file = new File(['content'], filename, { type })
      Object.defineProperty(file, 'size', { value: size })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('applicationId', appId)
      formData.append('documentType', docType)
      return formData
    }

    it('rejects unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const formData = createMockFormData()
      await expect(uploadApplicationDocumentAction(formData)).rejects.toThrow('Unauthorized')
    })

    it('rejects missing fields', async () => {
      const formData = new FormData()
      await expect(uploadApplicationDocumentAction(formData)).rejects.toThrow(
        'Missing required fields'
      )
    })

    it('rejects invalid document type', async () => {
      const formData = createMockFormData({ docType: 'invalid_type' })
      await expect(uploadApplicationDocumentAction(formData)).rejects.toThrow()
    })

    it('rejects oversized files exceeding 5MB', async () => {
      const formData = createMockFormData({ size: 6 * 1024 * 1024 })
      await expect(uploadApplicationDocumentAction(formData)).rejects.toThrow(
        'File must be 5 MB or smaller.'
      )
    })

    it('rejects unsupported MIME types', async () => {
      const formData = createMockFormData({ type: 'image/png' })
      await expect(uploadApplicationDocumentAction(formData)).rejects.toThrow(
        'Unsupported file type. Please upload PDF, DOC, or DOCX.'
      )
    })

    it('rejects unsupported file extensions', async () => {
      const formData = createMockFormData({ filename: 'resume.exe', type: 'application/pdf' })
      await expect(uploadApplicationDocumentAction(formData)).rejects.toThrow(
        'Unsupported file extension. Please upload PDF, DOC, or DOCX.'
      )
    })

    it('verifies application ownership before uploading', async () => {
      // Application does not belong to user
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      })

      const formData = createMockFormData()
      await expect(uploadApplicationDocumentAction(formData)).rejects.toThrow(
        'Unauthorized or application not found'
      )
      expect(docApi.uploadDocumentToStorage).not.toHaveBeenCalled()
    })

    it('uploads file and creates record on valid request', async () => {
      // Application belongs to user
      mockQueryBuilder.single.mockResolvedValue({
        data: { id: mockApplicationId },
        error: null,
      })
      ;(docApi.uploadDocumentToStorage as any).mockResolvedValue(mockStoragePath)
      ;(docApi.createDocumentRecord as any).mockResolvedValue({ id: mockDocId })

      const formData = createMockFormData()
      await uploadApplicationDocumentAction(formData)

      expect(docApi.uploadDocumentToStorage).toHaveBeenCalled()
      expect(docApi.createDocumentRecord).toHaveBeenCalledWith(
        mockSupabase,
        expect.objectContaining({
          application_id: mockApplicationId,
          document_type: 'resume',
          storage_path: mockStoragePath,
        }),
        mockUserId
      )
    })

    it('rolls back storage object if database insert fails', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: { id: mockApplicationId },
        error: null,
      })
      ;(docApi.uploadDocumentToStorage as any).mockResolvedValue(mockStoragePath)
      ;(docApi.createDocumentRecord as any).mockRejectedValue(new Error('DB failure'))

      const formData = createMockFormData()
      await expect(uploadApplicationDocumentAction(formData)).rejects.toThrow(
        'Failed to save document metadata. Please try again.'
      )

      // Verify rollback called
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('jobhunt_documents')
      expect(mockSupabase.storage.from().remove).toHaveBeenCalledWith([mockStoragePath])
    })
  })

  describe('deleteApplicationDocumentAction', () => {
    it('rejects unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(deleteApplicationDocumentAction(mockDocId, mockStoragePath)).rejects.toThrow(
        'Unauthorized'
      )
    })

    it('rejects if document belongs to another user', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: {
          user_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
          application_id: mockApplicationId,
        },
        error: null,
      })

      await expect(deleteApplicationDocumentAction(mockDocId, mockStoragePath)).rejects.toThrow(
        'Unauthorized or document not found'
      )

      expect(docApi.deleteDocument).not.toHaveBeenCalled()
    })

    it('deletes document when authorized', async () => {
      // 1. Doc check: user matches
      mockQueryBuilder.single
        .mockResolvedValueOnce({
          data: { user_id: mockUserId, application_id: mockApplicationId },
          error: null,
        })
        // 2. Application check: user matches
        .mockResolvedValueOnce({
          data: { id: mockApplicationId },
          error: null,
        })

      await deleteApplicationDocumentAction(mockDocId, mockStoragePath)
      expect(docApi.deleteDocument).toHaveBeenCalledWith(mockSupabase, mockDocId, mockStoragePath)
    })
  })

  describe('getDocumentUrlAction', () => {
    it('rejects if document belongs to another user', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: {
          user_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
          storage_path: mockStoragePath,
          application_id: mockApplicationId,
        },
        error: null,
      })

      await expect(getDocumentUrlAction(mockDocId)).rejects.toThrow(
        'Unauthorized to view this document'
      )
      expect(docApi.getSignedUrl).not.toHaveBeenCalled()
    })

    it('returns signed URL for owned document', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({
          data: {
            user_id: mockUserId,
            storage_path: mockStoragePath,
            application_id: mockApplicationId,
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: mockApplicationId },
          error: null,
        })
      ;(docApi.getSignedUrl as any).mockResolvedValue('https://signed-url.example.com')

      const result = await getDocumentUrlAction(mockDocId)
      expect(result).toBe('https://signed-url.example.com')
      expect(docApi.getSignedUrl).toHaveBeenCalledWith(mockSupabase, mockStoragePath)
    })
  })

  describe('getDocumentsByApplicationAction', () => {
    it('verifies application ownership and returns documents', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: { id: mockApplicationId },
        error: null,
      })
      const mockList = [{ id: 'doc-1', name: 'resume.pdf' }]
      ;(docApi.getDocumentsByApplication as any).mockResolvedValue(mockList)

      const result = await getDocumentsByApplicationAction(mockApplicationId)
      expect(result).toEqual(mockList)
      expect(docApi.getDocumentsByApplication).toHaveBeenCalledWith(mockSupabase, mockApplicationId)
    })

    it('rejects if application does not belong to user', async () => {
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      })

      await expect(getDocumentsByApplicationAction(mockApplicationId)).rejects.toThrow(
        'Unauthorized or application not found'
      )
      expect(docApi.getDocumentsByApplication).not.toHaveBeenCalled()
    })
  })
})
