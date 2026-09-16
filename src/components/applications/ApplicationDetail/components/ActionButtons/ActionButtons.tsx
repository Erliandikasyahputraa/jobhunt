'use client'

import * as React from 'react'
import { Edit2, Trash2, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Application } from '@/lib/types/database.types'

interface ActionButtonsProps {
  application: Application
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
  isDisabled?: boolean
}

export function ActionButtons({
  application,
  onEdit,
  onDelete,
  onClose,
  isDisabled = false,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* View Job Link */}
      {application.job_url && (
        <a
          href={application.job_url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-card shadow-xs',
            'text-slate-700 dark:text-slate-300 hover:text-foreground hover:bg-accent',
            'transition-all duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
            isDisabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <ExternalLink className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <span className="hidden sm:inline">View Job</span>
        </a>
      )}

      {/* Edit Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        disabled={isDisabled}
        className="transition-all duration-150 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-border"
      >
        <Edit2 className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
        <span className="hidden sm:inline">Edit</span>
      </Button>

      {/* Delete Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onDelete}
        disabled={isDisabled}
        className={cn(
          'bg-red-500/10 text-red-700 dark:text-red-400',
          'border-red-200 dark:border-red-900/60',
          'hover:bg-red-500/20 transition-all duration-150 rounded-lg'
        )}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Delete</span>
      </Button>

      {/* Close Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className={cn(
          'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
          'hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150',
          'min-w-[36px] px-2 rounded-lg'
        )}
        aria-label="Close dialog"
      >
        <X className="w-5 h-5" />
        <span className="sr-only">Close</span>
      </Button>
    </div>
  )
}
