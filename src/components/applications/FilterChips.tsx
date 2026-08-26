import * as React from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { FilterState } from '@/lib/utils/filter-utils'
import type { ApplicationStatus, CustomColumnDB } from '@/lib/types/database.types'
import { DEFAULT_COLUMNS } from '@/lib/storage/column-storage'

interface FilterChipsProps {
  filters: Omit<FilterState, 'searchQuery' | 'sortOption'>
  onRemoveStatus: (status: ApplicationStatus) => void
  onRemoveCustomColumn: (colId: string) => void
  onClearDate: () => void
  onClearAll: () => void
  customColumns: CustomColumnDB[]
}

export function FilterChips({
  filters,
  onRemoveStatus,
  onRemoveCustomColumn,
  onClearDate,
  onClearAll,
  customColumns,
}: FilterChipsProps) {
  const hasFilters =
    filters.statusFilters.length > 0 ||
    filters.customColumnFilters.length > 0 ||
    filters.dateRange !== 'all'

  if (!hasFilters) return null

  // Map status values to human readable names
  const getStatusName = (status: ApplicationStatus) => {
    // Try to find the status in DEFAULT_COLUMNS first to match Kanban names
    const col = DEFAULT_COLUMNS.find(c => c.statuses?.includes(status))
    if (col) {
      return `${col.name} (${status.replace(/_/g, ' ')})`
    }
    return status.replace(/_/g, ' ')
  }

  // Map custom column IDs to names
  const getCustomColumnName = (id: string) => {
    if (id === 'none') return 'No Column'
    return customColumns.find(c => c.id === id)?.name || id
  }

  const getDateLabel = (range: string) => {
    switch (range) {
      case 'today':
        return 'Today'
      case '7d':
        return 'Last 7 days'
      case '30d':
        return 'Last 30 days'
      case 'this_month':
        return 'This month'
      default:
        return 'All time'
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 px-4 md:px-0">
      <span className="text-sm font-medium text-label-tertiary mr-1">Active filters:</span>

      {filters.statusFilters.map(status => (
        <Badge
          key={status}
          variant="secondary"
          className="glass-light border border-label-quaternary/30 gap-1 pr-1 py-1 text-xs"
        >
          <span className="text-label-tertiary mr-1">Status:</span>
          {getStatusName(status)}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            onClick={() => onRemoveStatus(status)}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {status} filter</span>
          </Button>
        </Badge>
      ))}

      {filters.customColumnFilters.map(colId => (
        <Badge
          key={colId}
          variant="secondary"
          className="glass-light border border-label-quaternary/30 gap-1 pr-1 py-1 text-xs"
        >
          <span className="text-label-tertiary mr-1">Column:</span>
          {getCustomColumnName(colId)}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            onClick={() => onRemoveCustomColumn(colId)}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {colId} filter</span>
          </Button>
        </Badge>
      ))}

      {filters.dateRange !== 'all' && (
        <Badge
          variant="secondary"
          className="glass-light border border-label-quaternary/30 gap-1 pr-1 py-1 text-xs"
        >
          <span className="text-label-tertiary mr-1">Date:</span>
          {getDateLabel(filters.dateRange)}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            onClick={onClearDate}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove date filter</span>
          </Button>
        </Badge>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-label-secondary hover:text-label-primary h-7 px-2"
        onClick={onClearAll}
      >
        Clear all
      </Button>
    </div>
  )
}
