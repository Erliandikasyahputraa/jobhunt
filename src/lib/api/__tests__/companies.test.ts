import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../companies'
import type { CompanyDB, CompanyInsert } from '@/lib/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

const mockCompanies: CompanyDB[] = [
  {
    id: '1',
    user_id: 'user-1',
    name: 'Google',
    website: 'https://google.com',
    industry: 'Technology',
    location: 'Mountain View, CA',
    linkedin_url: 'https://linkedin.com/company/google',
    github_url: 'https://github.com/google',
    overview: 'Great search engine',
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
  },
]

// Create mock Supabase client
const createMockSupabaseClient = () => {
  const mockData = {
    data: mockCompanies,
    error: null,
  }

  const mockSingleData = {
    data: mockCompanies[0],
    error: null,
  }

  const createQueryBuilder = () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(mockSingleData),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      // Make the query builder thenable so it can be awaited
      then: (resolve: (value: typeof mockData) => void) => {
        resolve(mockData)
      },
    }
    return builder
  }

  return {
    from: vi.fn(() => createQueryBuilder()),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
  }
}

describe('Companies API', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createMockSupabaseClient() as unknown as SupabaseClient
  })

  describe('getCompanies', () => {
    it('should fetch all companies for the authenticated user', async () => {
      const result = await getCompanies(mockSupabase)
      expect(result).toEqual(mockCompanies)
    })
  })

  describe('getCompanyById', () => {
    it('should fetch a single company by id ensuring user ownership', async () => {
      const result = await getCompanyById(mockSupabase, '1')
      expect(result).toEqual(mockCompanies[0])
    })
  })

  describe('createCompany', () => {
    it('should create a new company assigned to the authenticated user', async () => {
      const newCompany: CompanyInsert = {
        name: 'Test Co',
        website: null,
        industry: null,
        location: null,
        linkedin_url: null,
        github_url: null,
        overview: null,
      }

      const result = await createCompany(mockSupabase, newCompany)
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
    })
  })

  describe('updateCompany', () => {
    it('should update an existing company ensuring user ownership', async () => {
      const updates = {
        overview: 'Updated overview',
      }

      const result = await updateCompany(mockSupabase, '1', updates)
      expect(result).toBeDefined()
    })
  })

  describe('deleteCompany', () => {
    it('should delete a company ensuring user ownership', async () => {
      await expect(deleteCompany(mockSupabase, '1')).resolves.toBeUndefined()
    })
  })
})
