import { z } from 'zod'

export const documentTypeSchema = z.enum(['resume', 'cover_letter', 'attachment'])

export const documentInsertSchema = z.object({
  application_id: z.string().uuid(),
  name: z.string().min(1, 'Document name is required'),
  document_type: documentTypeSchema,
  storage_path: z.string().min(1, 'Storage path is required'),
  mime_type: z.string().min(1, 'MIME type is required'),
  size_bytes: z.number().int().positive('Size must be a positive integer'),
})

export const documentUpdateSchema = z.object({
  name: z.string().min(1, 'Document name is required').optional(),
  document_type: documentTypeSchema.optional(),
  // storage_path, mime_type, and size_bytes are generally not updated directly
  // without re-uploading, so we omit them from the update schema for now.
})
