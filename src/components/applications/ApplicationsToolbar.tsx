import * as React from 'react'
import { Search, Settings, Plus, Filter, ArrowUpDown, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { FilterState, SortOption, DateFilterOption } from '@/lib/utils/filter-utils'
import type { ApplicationStatus, CustomColumnDB } from '@/lib/types/database.types'

// We will export a subset of application statuses that make sense to filter by directly
const CORE_STATUSES: ApplicationStatus[] = [
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

interface ApplicationsToolbarProps {
  filters: FilterState
  onSearchChange: (query: string) => void
  onStatusFilterChange: (status: ApplicationStatus) => void
  onCustomColumnFilterChange: (colId: string) => void
  onDateRangeChange: (range: DateFilterOption) => void
  onSortChange: (sort: SortOption) => void
  onClearFilters: () => void
  customColumns: CustomColumnDB[]
  onManageColumns: () => void
  onNewApplication?: () => void
  onExport?: () => void
  isExporting?: boolean
}

export function ApplicationsToolbar({
  filters,
  onSearchChange,
  onStatusFilterChange,
  onCustomColumnFilterChange,
  onDateRangeChange,
  onSortChange,
  onClearFilters,
  customColumns,
  onManageColumns,
  onNewApplication,
  onExport,
  isExporting,
}: ApplicationsToolbarProps) {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = React.useState(false)

  const activeFilterCount =
    filters.statusFilters.length +
    filters.customColumnFilters.length +
    (filters.dateRange !== 'all' ? 1 : 0)

  // Status mapping
  const getStatusName = (status: ApplicationStatus) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const FilterContent = () => (
    <>
      <div className="space-y-4 py-4">
        <div>
          <h4 className="mb-2 text-sm font-medium text-label-primary">Core Status</h4>
          <div className="grid grid-cols-2 gap-2">
            {CORE_STATUSES.map(status => (
              <label
                key={status}
                className="flex items-center gap-2 text-sm text-label-secondary hover:text-label-primary cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  className="rounded border-border text-foreground focus:ring-ring/40 shadow-xs transition-colors"
                  checked={filters.statusFilters.includes(status)}
                  onChange={() => onStatusFilterChange(status)}
                />
                {getStatusName(status)}
              </label>
            ))}
          </div>
        </div>

        <div className="h-px bg-label-quaternary/20 w-full my-2" />

        <div>
          <h4 className="mb-2 text-sm font-medium text-label-primary">Custom Column</h4>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-label-secondary hover:text-label-primary cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="rounded border-border text-foreground focus:ring-ring/40 shadow-xs transition-colors"
                checked={filters.customColumnFilters.includes('none')}
                onChange={() => onCustomColumnFilterChange('none')}
              />
              No Custom Column
            </label>
            {customColumns.map(col => (
              <label
                key={col.id}
                className="flex items-center gap-2 text-sm text-label-secondary hover:text-label-primary cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  className="rounded border-border text-foreground focus:ring-ring/40 shadow-xs transition-colors"
                  checked={filters.customColumnFilters.includes(col.id)}
                  onChange={() => onCustomColumnFilterChange(col.id)}
                />
                {col.name}
              </label>
            ))}
          </div>
        </div>

        <div className="h-px bg-label-quaternary/20 w-full my-2" />

        <div>
          <h4 className="mb-2 text-sm font-medium text-label-primary">Date Applied</h4>
          <div className="flex flex-col gap-2">
            {[
              { value: 'all', label: 'All time' },
              { value: 'today', label: 'Today' },
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: 'this_month', label: 'This month' },
            ].map(opt => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-sm text-label-secondary hover:text-label-primary cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="mobile-date-range"
                  className="border-border text-foreground focus:ring-ring/40 shadow-xs transition-colors"
                  checked={filters.dateRange === opt.value}
                  onChange={() => onDateRangeChange(opt.value as DateFilterOption)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="h-px bg-label-quaternary/20 w-full my-2" />

        <div>
          <h4 className="mb-2 text-sm font-medium text-label-primary">Sort By</h4>
          <div className="flex flex-col gap-2">
            {[
              { value: 'manual', label: 'Manual (Drag & Drop)' },
              { value: 'newest_applied', label: 'Newest Applied' },
              { value: 'oldest_applied', label: 'Oldest Applied' },
              { value: 'newest_updated', label: 'Recently Updated' },
              { value: 'oldest_updated', label: 'Least Recently Updated' },
              { value: 'company_az', label: 'Company A-Z' },
            ].map(opt => (
              <label
                key={opt.value}
                className="flex items-center gap-2 text-sm text-label-secondary hover:text-label-primary cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="mobile-sort-option"
                  className="border-border text-foreground focus:ring-ring/40 shadow-xs transition-colors"
                  checked={filters.sortOption === opt.value}
                  onChange={() => onSortChange(opt.value as SortOption)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 pb-0">
      <h2 className="text-lg font-semibold text-label-primary shrink-0 hidden lg:block">
        Application Pipeline
      </h2>

      {/* Search Bar */}
      <div className="flex-1 w-full lg:mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-900 dark:text-label-tertiary" />
          <Input
            type="text"
            placeholder="Search by company or job title..."
            value={filters.searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-10 bg-white border-neutral-900/40 focus-visible:border-neutral-900 text-neutral-900 placeholder:text-neutral-500 shadow-xs dark:glass-light dark:border-border dark:text-foreground dark:placeholder:text-label-tertiary rounded-md w-full transition-all"
          />
        </div>
      </div>

      {/* Desktop Controls */}
      <div className="hidden sm:flex items-center gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-neutral-900 border-neutral-900 dark:bg-card dark:text-foreground dark:border-border font-medium relative hover:bg-neutral-100 dark:hover:bg-accent active:scale-[0.98] transition-all shadow-xs"
            >
              <Filter className="h-4 w-4 mr-2 text-neutral-900 dark:text-foreground" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-blue-500 text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 max-h-[300px] overflow-y-auto">
            <DropdownMenuLabel>Core Status</DropdownMenuLabel>
            {CORE_STATUSES.map(status => (
              <DropdownMenuCheckboxItem
                key={status}
                checked={filters.statusFilters.includes(status)}
                onCheckedChange={() => onStatusFilterChange(status)}
              >
                {getStatusName(status)}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Custom Column</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={filters.customColumnFilters.includes('none')}
              onCheckedChange={() => onCustomColumnFilterChange('none')}
            >
              No Custom Column
            </DropdownMenuCheckboxItem>
            {customColumns.map(col => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={filters.customColumnFilters.includes(col.id)}
                onCheckedChange={() => onCustomColumnFilterChange(col.id)}
              >
                {col.name}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Date Applied</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={filters.dateRange}
              onValueChange={v => onDateRangeChange(v as DateFilterOption)}
            >
              <DropdownMenuRadioItem value="all">All time</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="today">Today</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="7d">Last 7 days</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="30d">Last 30 days</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="this_month">This month</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-neutral-900 border-neutral-900 dark:bg-card dark:text-foreground dark:border-border font-medium hover:bg-neutral-100 dark:hover:bg-accent active:scale-[0.98] transition-all shadow-xs"
            >
              <ArrowUpDown className="h-4 w-4 mr-2 text-neutral-900 dark:text-foreground" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuRadioGroup
              value={filters.sortOption}
              onValueChange={v => onSortChange(v as SortOption)}
            >
              <DropdownMenuRadioItem value="manual">Manual (Drag & Drop)</DropdownMenuRadioItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioItem value="newest_applied">Newest Applied</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="oldest_applied">Oldest Applied</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="newest_updated">Recently Updated</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="oldest_updated">
                Least Recently Updated
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="company_az">Company A-Z</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          onClick={onManageColumns}
          variant="outline"
          size="sm"
          className="bg-white text-neutral-900 border-neutral-900 dark:bg-card dark:text-foreground dark:border-border font-medium hover:bg-neutral-100 dark:hover:bg-accent active:scale-[0.98] transition-all shadow-xs"
        >
          <Settings className="h-4 w-4 mr-2 text-neutral-900 dark:text-foreground" />
          Columns
        </Button>
        {onExport && (
          <Button
            onClick={onExport}
            size="sm"
            variant="outline"
            className="bg-white text-neutral-900 border-neutral-900 dark:bg-card dark:text-foreground dark:border-border font-medium hover:bg-neutral-100 dark:hover:bg-accent active:scale-[0.98] transition-all shadow-xs"
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-neutral-900 dark:text-foreground" />
            ) : (
              <Download className="mr-2 h-4 w-4 text-neutral-900 dark:text-foreground" />
            )}
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        )}
        {onNewApplication && (
          <Button
            onClick={onNewApplication}
            size="sm"
            variant="outline"
            className="bg-white text-neutral-900 border-neutral-900 dark:bg-card dark:text-foreground dark:border-border font-medium hover:bg-neutral-100 dark:hover:bg-accent active:scale-[0.98] transition-all shadow-xs"
          >
            <Plus className="mr-2 h-4 w-4 text-neutral-900 dark:text-foreground" />
            New
          </Button>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="flex sm:hidden items-center gap-2 w-full">
        <Dialog open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-neutral-900 border-neutral-900 dark:bg-card dark:text-foreground dark:border-border font-medium flex-1 relative hover:bg-neutral-100 dark:hover:bg-accent active:scale-[0.98] transition-all shadow-xs"
            >
              <Filter className="h-4 w-4 mr-2 text-neutral-900 dark:text-foreground" />
              Filter & Sort
              {activeFilterCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-neutral-900 text-white dark:bg-blue-500 text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md w-full h-[90vh] flex flex-col p-0 glass-ultra border-0 rounded-t-xl rounded-b-none mt-auto mb-0 sm:rounded-xl">
            <DialogHeader className="px-4 py-3 border-b border-white/10 shrink-0">
              <DialogTitle>Filter & Sort</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-4 pb-20">
              <FilterContent />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 glass-heavy border-t border-white/10 flex gap-2">
              <Button variant="outline" className="flex-1 glass-light" onClick={onClearFilters}>
                Clear All
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Apply
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          onClick={onManageColumns}
          size="sm"
          variant="outline"
          className="bg-white text-neutral-900 border-neutral-900 dark:bg-card dark:text-foreground dark:border-border font-medium hover:bg-neutral-100 dark:hover:bg-accent active:scale-[0.98] transition-all px-3 shadow-xs"
        >
          <Settings className="h-4 w-4 text-neutral-900 dark:text-foreground" />
          <span className="sr-only">Columns</span>
        </Button>
        {onExport && (
          <Button
            onClick={onExport}
            size="sm"
            variant="outline"
            className="bg-white text-neutral-900 border-neutral-900 dark:bg-card dark:text-foreground dark:border-border font-medium hover:bg-neutral-100 dark:hover:bg-accent active:scale-[0.98] transition-all px-3 shadow-xs"
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin text-neutral-900 dark:text-foreground" />
            ) : (
              <Download className="h-4 w-4 text-neutral-900 dark:text-foreground" />
            )}
            <span className="sr-only">Export CSV</span>
          </Button>
        )}
        {onNewApplication && (
          <Button
            onClick={onNewApplication}
            size="sm"
            variant="outline"
            className="bg-white text-neutral-900 border-neutral-900 dark:bg-card dark:text-foreground dark:border-border font-medium hover:bg-neutral-100 dark:hover:bg-accent active:scale-[0.98] transition-all px-3 shadow-xs"
          >
            <Plus className="h-4 w-4 text-neutral-900 dark:text-foreground" />
            <span className="sr-only">New Application</span>
          </Button>
        )}
      </div>
    </div>
  )
}
