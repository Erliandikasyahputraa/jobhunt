import { describe, it, expect } from 'vitest'
import { documentTypeSchema, documentInsertSchema } from '../document.schema'

describe('Document Schema Validation', () => {
  describe('Document Type Schema', () => {
    it('accepts resume', () => {
      expect(documentTypeSchema.parse('resume')).toBe('resume')
    })

    it('accepts cover_letter', () => {
      expect(documentTypeSchema.parse('cover_letter')).toBe('cover_letter')
    })

    it('accepts attachment', () => {
      expect(documentTypeSchema.parse('attachment')).toBe('attachment')
    })

    it('rejects invalid document_type', () => {
      expect(() => documentTypeSchema.parse('invalid_type')).toThrow()
    })
  })

  describe('Document Insert Schema', () => {
    it('validates required metadata correctly', () => {
      const validData = {
        application_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'My Resume.pdf',
        document_type: 'resume',
        storage_path: 'user-id/123e4567-e89b-12d3-a456-426614174000/uuid-resume.pdf',
        mime_type: 'application/pdf',
        size_bytes: 1048576, // 1MB
      }

      expect(() => documentInsertSchema.parse(validData)).not.toThrow()
    })

    it('rejects missing required fields', () => {
      const invalidData = {
        name: 'My Resume.pdf',
        // missing application_id, document_type, storage_path, mime_type, size_bytes
      }

      expect(() => documentInsertSchema.parse(invalidData)).toThrow()
    })

    it('rejects invalid application_id (not a uuid)', () => {
      const invalidData = {
        application_id: 'invalid-id',
        name: 'My Resume.pdf',
        document_type: 'resume',
        storage_path: 'path',
        mime_type: 'application/pdf',
        size_bytes: 1048576,
      }

      expect(() => documentInsertSchema.parse(invalidData)).toThrow()
    })

    it('rejects negative size_bytes', () => {
      const invalidData = {
        application_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'My Resume.pdf',
        document_type: 'resume',
        storage_path: 'path',
        mime_type: 'application/pdf',
        size_bytes: -100,
      }

      expect(() => documentInsertSchema.parse(invalidData)).toThrow()
    })
  })
})
