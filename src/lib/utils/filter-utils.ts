import type { Application, ApplicationStatus } from '@/lib/types/database.types'

export type DateFilterOption = 'all' | 'today' | '7d' | '30d' | 'this_month'
export const VALID_DATE_OPTIONS: DateFilterOption[] = ['all', 'today', '7d', '30d', 'this_month']

export type SortOption =
  | 'manual'
  | 'newest_applied'
  | 'oldest_applied'
  | 'newest_updated'
  | 'oldest_updated'
  | 'company_az'
export const VALID_SORT_OPTIONS: SortOption[] = [
  'manual',
  'newest_applied',
  'oldest_applied',
  'newest_updated',
  'oldest_updated',
  'company_az',
]

export const VALID_STATUSES: ApplicationStatus[] = [
  'wishlist',
  'applied',
  'phone_screen',
  'assessment',
  'take_home',
  'interviewing',
  'final_round',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
  'ghosted',
]

export function isValidDateOption(val: string): val is DateFilterOption {
  return VALID_DATE_OPTIONS.includes(val as DateFilterOption)
}

export function isValidSortOption(val: string): val is SortOption {
  return VALID_SORT_OPTIONS.includes(val as SortOption)
}

export function isValidStatus(val: string): val is ApplicationStatus {
  return VALID_STATUSES.includes(val as ApplicationStatus)
}

export interface FilterState {
  searchQuery: string
  statusFilters: ApplicationStatus[]
  customColumnFilters: string[]
  dateRange: DateFilterOption
  sortOption: SortOption
}

export function filterApplications(
  applications: Application[],
  filters: Omit<FilterState, 'sortOption'>
): Application[] {
  const { searchQuery, statusFilters, customColumnFilters, dateRange } = filters

  return applications.filter(app => {
    // 1. Search Query (Company or Job Title)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const matchesCompany = app.company_name.toLowerCase().includes(query)
      const matchesTitle = app.job_title.toLowerCase().includes(query)
      if (!matchesCompany && !matchesTitle) {
        return false
      }
    }

    // 2. Status Filter
    // Only apply if the array is not empty. If non-empty, the app's status MUST be in the array.
    if (statusFilters.length > 0) {
      if (!statusFilters.includes(app.status)) {
        return false
      }
    }

    // 3. Custom Column Filter
    // Only apply if the array is not empty. If non-empty, the app's custom_column_id MUST be in the array.
    // 'none' is a special value to filter applications without a custom column.
    if (customColumnFilters.length > 0) {
      const colId = app.custom_column_id || 'none'
      if (!customColumnFilters.includes(colId)) {
        return false
      }
    }

    // 4. Date Filter
    if (dateRange !== 'all') {
      const appDate = new Date(app.date_applied)
      const now = new Date()
      // Normalize today to start of day for accurate day differences
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      switch (dateRange) {
        case 'today':
          if (appDate < startOfToday) return false
          break
        case '7d': {
          const sevenDaysAgo = new Date(startOfToday)
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          if (appDate < sevenDaysAgo) return false
          break
        }
        case '30d': {
          const thirtyDaysAgo = new Date(startOfToday)
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          if (appDate < thirtyDaysAgo) return false
          break
        }
        case 'this_month': {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          if (appDate < startOfMonth) return false
          break
        }
      }
    }

    return true
  })
}

export function sortApplications(
  applications: Application[],
  sortOption: SortOption
): Application[] {
  // If manual, return original array (position ordering should be handled by Kanban logic)
  if (sortOption === 'manual') {
    return [...applications]
  }

  return [...applications].sort((a, b) => {
    switch (sortOption) {
      case 'newest_applied':
        return new Date(b.date_applied).getTime() - new Date(a.date_applied).getTime()
      case 'oldest_applied':
        return new Date(a.date_applied).getTime() - new Date(b.date_applied).getTime()
      case 'newest_updated':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      case 'oldest_updated':
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      case 'company_az':
        return a.company_name.localeCompare(b.company_name)
      default:
        return 0
    }
  })
}

export function validateCustomColumnFilters(
  currentFilters: string[],
  customColumns: { id: string }[]
): { hasInvalid: boolean; validFilters: string[] } {
  const validIds = new Set(customColumns.map(c => c.id))
  validIds.add('none')

  const hasInvalid = currentFilters.some(id => !validIds.has(id))
  if (!hasInvalid) {
    return { hasInvalid: false, validFilters: currentFilters }
  }

  const validFilters = currentFilters.filter(id => validIds.has(id))
  return { hasInvalid: true, validFilters }
}
