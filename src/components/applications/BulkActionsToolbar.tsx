'use client'

import * as React from 'react'
import { Trash2, X, CheckSquare, Square, ChevronDown, Loader2, Columns, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { ApplicationStatus, CustomColumnDB } from '@/lib/types/database.types'

const CORE_STATUSES: Array<{ value: ApplicationStatus; label: string }> = [
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'applied', label: 'Applied' },
  { value: 'phone_screen', label: 'Phone Screen' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'take_home', label: 'Take Home' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'final_round', label: 'Final Round' },
  { value: 'offered', label: 'Offered' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'ghosted', label: 'Ghosted' },
]

interface BulkActionsToolbarProps {
  selectedCount: number
  totalVisibleCount: number
  customColumns: CustomColumnDB[]
  isMutating: boolean
  onToggleSelectAll: () => void
  onUpdateStatus: (status: ApplicationStatus) => Promise<void>
  onUpdateCustomColumn: (customColumnId: string | null) => Promise<void>
  onDelete: () => Promise<void>
  onClearSelection: () => void
}

export function BulkActionsToolbar({
  selectedCount,
  totalVisibleCount,
  customColumns,
  isMutating,
  onToggleSelectAll,
  onUpdateStatus,
  onUpdateCustomColumn,
  onDelete,
  onClearSelection,
}: BulkActionsToolbarProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  const isAllSelected = selectedCount > 0 && selectedCount === totalVisibleCount

  const handleDeleteConfirm = async () => {
    try {
      await onDelete()
      setIsDeleteDialogOpen(false)
    } catch {
      // Error handling and toast is managed by parent/action handler
    }
  }

  return (
    <>
      <div
        data-testid="bulk-actions-toolbar"
        className="flex flex-wrap items-center justify-between gap-3 p-2.5 sm:p-3 px-4 rounded-glass glass-heavy border border-border/80 shadow-glass-soft animate-in fade-in slide-in-from-top-2 duration-200"
      >
        {/* Left Side: Select All & Count */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            disabled={isMutating}
            onClick={onToggleSelectAll}
            className="flex items-center gap-2 text-sm font-medium hover:glass-light text-label-primary px-2"
            aria-label={
              isAllSelected
                ? 'Deselect all visible applications'
                : 'Select all visible applications'
            }
            data-testid="bulk-select-all-btn"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Square className="h-4 w-4 text-label-secondary" />
            )}
            <span>{isAllSelected ? 'Deselect All' : `Select All (${totalVisibleCount})`}</span>
          </Button>

          <div className="h-4 w-px bg-label-quaternary/30 hidden sm:block" />

          <span
            className="text-sm font-semibold text-label-primary bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full"
            data-testid="bulk-selected-count"
          >
            {selectedCount} selected
          </span>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isMutating}
                className="glass-light font-medium flex items-center gap-1.5"
                data-testid="bulk-status-trigger"
              >
                <Layers className="h-3.5 w-3.5 text-label-secondary" />
                <span>Status</span>
                <ChevronDown className="h-3 w-3 text-label-tertiary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-[300px] overflow-y-auto">
              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {CORE_STATUSES.map(item => (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() => onUpdateStatus(item.value)}
                  className="cursor-pointer"
                  data-testid={`bulk-status-option-${item.value}`}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Custom Column Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isMutating}
                className="glass-light font-medium flex items-center gap-1.5"
                data-testid="bulk-column-trigger"
              >
                <Columns className="h-3.5 w-3.5 text-label-secondary" />
                <span>Column</span>
                <ChevronDown className="h-3 w-3 text-label-tertiary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 max-h-[300px] overflow-y-auto">
              <DropdownMenuLabel>Move to Custom Column</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onUpdateCustomColumn(null)}
                className="cursor-pointer"
                data-testid="bulk-column-option-none"
              >
                No Custom Column
              </DropdownMenuItem>
              {customColumns.map(col => (
                <DropdownMenuItem
                  key={col.id}
                  onClick={() => onUpdateCustomColumn(col.id)}
                  className="cursor-pointer"
                  data-testid={`bulk-column-option-${col.id}`}
                >
                  {col.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Delete Button */}
          <Button
            variant="destructive"
            size="sm"
            disabled={isMutating}
            onClick={() => setIsDeleteDialogOpen(true)}
            className="font-medium flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-xs border border-red-700/20 disabled:opacity-50 disabled:pointer-events-none transition-all"
            data-testid="bulk-delete-trigger"
          >
            {isMutating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>Delete</span>
          </Button>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            disabled={isMutating}
            onClick={onClearSelection}
            className="text-label-secondary hover:text-label-primary px-2"
            aria-label="Clear selection"
            data-testid="bulk-clear-selection-btn"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={open => !isMutating && setIsDeleteDialogOpen(open)}
      >
        <AlertDialogContent variant="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedCount} application{selectedCount === 1 ? '' : 's'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} selected application
              {selectedCount === 1 ? '' : 's'}? This action cannot be undone and will permanently
              remove all attached resumes and cover letters.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating} data-testid="bulk-delete-cancel">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isMutating}
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
              data-testid="bulk-delete-confirm"
            >
              {isMutating && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete {selectedCount} Application{selectedCount === 1 ? '' : 's'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
