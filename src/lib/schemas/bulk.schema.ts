import { z } from 'zod'
import { applicationStatusSchema } from './application.schema'

export const MAX_BULK_BATCH_SIZE = 100

/**
 * Validates a list of application IDs for bulk operations.
 * Enforces non-empty array, UUID format, and max batch size of 100.
 */
export const bulkApplicationIdsSchema = z
  .array(z.string().uuid('Invalid application ID'))
  .min(1, 'At least one application must be selected')
  .max(
    MAX_BULK_BATCH_SIZE,
    `Cannot process more than ${MAX_BULK_BATCH_SIZE} applications at a time`
  )

/**
 * Validates bulk status update payload.
 */
export const bulkStatusUpdateSchema = z.object({
  ids: bulkApplicationIdsSchema,
  status: applicationStatusSchema,
})

/**
 * Validates bulk custom column update payload.
 * Normalizes 'none' to null.
 */
export const bulkCustomColumnUpdateSchema = z.object({
  ids: bulkApplicationIdsSchema,
  customColumnId: z
    .string()
    .uuid('Invalid custom column ID')
    .nullable()
    .or(z.literal('none').transform(() => null)),
})

export type BulkStatusUpdateData = z.infer<typeof bulkStatusUpdateSchema>
export type BulkCustomColumnUpdateData = z.infer<typeof bulkCustomColumnUpdateSchema>
