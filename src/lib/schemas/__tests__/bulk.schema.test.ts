import { describe, it, expect } from 'vitest'
import {
  bulkApplicationIdsSchema,
  bulkStatusUpdateSchema,
  bulkCustomColumnUpdateSchema,
  MAX_BULK_BATCH_SIZE,
} from '../bulk.schema'

describe('Bulk Schema Validation', () => {
  const validUuid1 = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  const validUuid2 = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
  const validColUuid = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33'

  describe('bulkApplicationIdsSchema', () => {
    it('accepts valid UUID array', () => {
      const result = bulkApplicationIdsSchema.safeParse([validUuid1, validUuid2])
      expect(result.success).toBe(true)
    })

    it('rejects empty array', () => {
      const result = bulkApplicationIdsSchema.safeParse([])
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one application must be selected')
      }
    })

    it('rejects invalid UUID strings', () => {
      const result = bulkApplicationIdsSchema.safeParse(['not-a-uuid', validUuid1])
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid application ID')
      }
    })

    it('rejects batches exceeding MAX_BULK_BATCH_SIZE (100)', () => {
      const excessiveList = Array.from({ length: MAX_BULK_BATCH_SIZE + 1 }, () => validUuid1)
      const result = bulkApplicationIdsSchema.safeParse(excessiveList)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Cannot process more than 100 applications'
        )
      }
    })

    it('accepts exactly 100 items', () => {
      const maxList = Array.from({ length: MAX_BULK_BATCH_SIZE }, () => validUuid1)
      const result = bulkApplicationIdsSchema.safeParse(maxList)
      expect(result.success).toBe(true)
    })
  })

  describe('bulkStatusUpdateSchema', () => {
    it('accepts valid status and IDs', () => {
      const result = bulkStatusUpdateSchema.safeParse({
        ids: [validUuid1],
        status: 'interviewing',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid status enum', () => {
      const result = bulkStatusUpdateSchema.safeParse({
        ids: [validUuid1],
        status: 'non_existent_status',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('bulkCustomColumnUpdateSchema', () => {
    it('accepts valid custom column UUID', () => {
      const result = bulkCustomColumnUpdateSchema.safeParse({
        ids: [validUuid1],
        customColumnId: validColUuid,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.customColumnId).toBe(validColUuid)
      }
    })

    it('accepts null custom column', () => {
      const result = bulkCustomColumnUpdateSchema.safeParse({
        ids: [validUuid1],
        customColumnId: null,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.customColumnId).toBeNull()
      }
    })

    it('normalizes "none" to null', () => {
      const result = bulkCustomColumnUpdateSchema.safeParse({
        ids: [validUuid1],
        customColumnId: 'none',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.customColumnId).toBeNull()
      }
    })

    it('rejects non-uuid customColumnId string (except "none")', () => {
      const result = bulkCustomColumnUpdateSchema.safeParse({
        ids: [validUuid1],
        customColumnId: 'invalid-col-id',
      })
      expect(result.success).toBe(false)
    })
  })
})
