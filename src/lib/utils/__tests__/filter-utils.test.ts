import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { filterApplications, sortApplications, validateCustomColumnFilters } from '../filter-utils'
import type { Application } from '@/lib/types/database.types'

describe('Filter Utils', () => {
  const mockDate = new Date('2026-08-24T12:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(mockDate)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mockApps: Application[] = [
    {
      id: '1',
      company_name: 'Apple',
      company_id: null,
      job_title: 'Frontend Developer',
      status: 'applied',
      custom_column_id: null,
      date_applied: '2026-08-20T10:00:00Z',
      updated_at: '2026-08-20T10:00:00Z',
      user_id: 'user1',
      job_url: null,
      location: null,
      salary_range: null,
      position: 1,
      created_at: '2026-08-20T10:00:00Z',
      notes: null,
    },
    {
      id: '2',
      company_name: 'Google',
      company_id: null,
      job_title: 'Backend Engineer',
      status: 'interviewing',
      custom_column_id: 'col_urgent',
      date_applied: '2026-08-10T10:00:00Z',
      updated_at: '2026-08-21T10:00:00Z',
      user_id: 'user1',
      job_url: null,
      location: null,
      salary_range: null,
      position: 2,
      created_at: '2026-08-10T10:00:00Z',
      notes: null,
    },
    {
      id: '3',
      company_name: 'Stripe',
      company_id: null,
      job_title: 'Fullstack Engineer',
      status: 'offered',
      custom_column_id: 'col_done',
      date_applied: '2026-07-24T10:00:00Z', // 1 month ago
      updated_at: '2026-08-24T10:00:00Z',
      user_id: 'user1',
      job_url: null,
      location: null,
      salary_range: null,
      position: 3,
      created_at: '2026-07-24T10:00:00Z',
      notes: null,
    },
  ]

  describe('filterApplications', () => {
    it('should return all applications when filters are empty', () => {
      const result = filterApplications(mockApps, {
        searchQuery: '',
        statusFilters: [],
        customColumnFilters: [],
        dateRange: 'all',
      })
      expect(result).toHaveLength(3)
    })

    it('should filter by search query (company or title)', () => {
      const resultCompany = filterApplications(mockApps, {
        searchQuery: 'app',
        statusFilters: [],
        customColumnFilters: [],
        dateRange: 'all',
      })
      expect(resultCompany).toHaveLength(1)
      expect(resultCompany[0].company_name).toBe('Apple')

      const resultTitle = filterApplications(mockApps, {
        searchQuery: 'engineer',
        statusFilters: [],
        customColumnFilters: [],
        dateRange: 'all',
      })
      expect(resultTitle).toHaveLength(2)
      expect(resultTitle.map(a => a.company_name)).toEqual(['Google', 'Stripe'])
    })

    it('should filter by status', () => {
      const result = filterApplications(mockApps, {
        searchQuery: '',
        statusFilters: ['interviewing', 'offered'],
        customColumnFilters: [],
        dateRange: 'all',
      })
      expect(result).toHaveLength(2)
      expect(result.map(a => a.company_name)).toEqual(['Google', 'Stripe'])
    })

    it('should filter by custom column', () => {
      const result = filterApplications(mockApps, {
        searchQuery: '',
        statusFilters: [],
        customColumnFilters: ['col_urgent', 'none'],
        dateRange: 'all',
      })
      expect(result).toHaveLength(2)
      expect(result.map(a => a.company_name)).toEqual(['Apple', 'Google'])
    })

    it('should filter by date range', () => {
      // Today is 2026-08-24. Apple is 08-20 (4 days ago), Google is 08-10 (14 days ago), Stripe is 07-24 (31 days ago)
      const result7d = filterApplications(mockApps, {
        searchQuery: '',
        statusFilters: [],
        customColumnFilters: [],
        dateRange: '7d',
      })
      expect(result7d).toHaveLength(1) // Only Apple
      expect(result7d[0].company_name).toBe('Apple')

      const result30d = filterApplications(mockApps, {
        searchQuery: '',
        statusFilters: [],
        customColumnFilters: [],
        dateRange: '30d',
      })
      expect(result30d).toHaveLength(2) // Apple and Google
    })

    it('should combine multiple filters', () => {
      const result = filterApplications(mockApps, {
        searchQuery: 'end', // matches Frontend, Backend
        statusFilters: ['interviewing'],
        customColumnFilters: [],
        dateRange: '30d',
      })
      expect(result).toHaveLength(1)
      expect(result[0].company_name).toBe('Google')
    })
  })

  describe('sortApplications', () => {
    it('should return original array for manual sort', () => {
      const result = sortApplications(mockApps, 'manual')
      expect(result).toEqual(mockApps)
    })

    it('should sort by newest_applied', () => {
      const result = sortApplications(mockApps, 'newest_applied')
      expect(result.map(a => a.company_name)).toEqual(['Apple', 'Google', 'Stripe'])
    })

    it('should sort by oldest_applied', () => {
      const result = sortApplications(mockApps, 'oldest_applied')
      expect(result.map(a => a.company_name)).toEqual(['Stripe', 'Google', 'Apple'])
    })

    it('should sort by company A-Z', () => {
      const result = sortApplications(mockApps, 'company_az')
      expect(result.map(a => a.company_name)).toEqual(['Apple', 'Google', 'Stripe'])
    })
  })

  describe('validateCustomColumnFilters', () => {
    const mockColumns = [{ id: 'col1' }, { id: 'col2' }]

    it('should keep valid custom ID', () => {
      const result = validateCustomColumnFilters(['col1'], mockColumns)
      expect(result.hasInvalid).toBe(false)
      expect(result.validFilters).toEqual(['col1'])
    })

    it('should remove invalid custom ID', () => {
      const result = validateCustomColumnFilters(['invalid-id'], mockColumns)
      expect(result.hasInvalid).toBe(true)
      expect(result.validFilters).toEqual([])
    })

    it('should handle mixed valid and invalid IDs', () => {
      const result = validateCustomColumnFilters(['col1', 'invalid-id', 'col2'], mockColumns)
      expect(result.hasInvalid).toBe(true)
      expect(result.validFilters).toEqual(['col1', 'col2'])
    })

    it('should treat "none" as a valid ID', () => {
      const result = validateCustomColumnFilters(['none', 'invalid-id'], mockColumns)
      expect(result.hasInvalid).toBe(true)
      expect(result.validFilters).toEqual(['none'])
    })

    it('should return empty array when all IDs are invalid', () => {
      const result = validateCustomColumnFilters(['invalid1', 'invalid2'], mockColumns)
      expect(result.hasInvalid).toBe(true)
      expect(result.validFilters).toEqual([])
    })
  })
})
