import { z } from 'zod'

/**
 * Base company schema for form validation
 */
export const companyFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Company name is required')
    .max(255, 'Company name must be less than 255 characters'),

  website: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),

  industry: z
    .string()
    .max(255, 'Industry must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  location: z
    .string()
    .max(255, 'Location must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),

  linkedin_url: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),

  github_url: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),

  overview: z
    .string()
    .max(10000, 'Overview must be less than 10000 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
})

/**
 * Schema for creating a new company (insert)
 */
export const createCompanySchema = companyFormSchema.extend({
  user_id: z.string().uuid('Invalid user ID').optional(),
})

/**
 * Schema for updating an existing company
 */
export const updateCompanySchema = companyFormSchema.partial()

/**
 * Type exports inferred from schemas
 */
export type CompanyFormData = z.infer<typeof companyFormSchema>
export type CreateCompanyData = z.infer<typeof createCompanySchema>
export type UpdateCompanyData = z.infer<typeof updateCompanySchema>
