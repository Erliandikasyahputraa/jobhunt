'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { GripVertical } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { CompanyLogo } from '@/components/ui/company-logo'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { Application } from '@/lib/types/database.types'

interface ApplicationCardProps {
  application: Application
  onClick?: () => void
  isDragging?: boolean
  dragHandleProps?: Record<string, unknown>
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
}

const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy')
  } catch {
    return dateString
  }
}

export function ApplicationCard({
  application,
  onClick,
  isDragging = false,
  dragHandleProps,
  isSelected = false,
  onToggleSelect,
}: ApplicationCardProps) {
  const handleCardClick = () => {
    onClick?.()
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleCheckboxChange = () => {
    onToggleSelect?.(application.id)
  }

  return (
    <Card
      role="article"
      aria-label={`${application.job_title} at ${application.company_name}`}
      data-testid="application-card"
      onClick={handleCardClick}
      className={cn(
        'glass-light rounded-glass shadow-glass-soft transition-all duration-300 ease-in-out group',
        onClick &&
          'cursor-pointer transition-all duration-300 ease-in-out hover:!border-[hsl(var(--copper-light))] hover:shadow-[0_0_0_1px_hsl(var(--copper-light))]',
        isSelected && 'ring-2 ring-blue-500 border-blue-500/50 bg-blue-500/5',
        isDragging && 'opacity-50 rotate-2 shadow-xl'
      )}
    >
      <CardHeader className="pb-3 p-4">
        <div className="flex items-center gap-3">
          {/* Selection Checkbox */}
          {onToggleSelect && (
            <div
              className="flex items-center justify-center p-0.5 shrink-0"
              onClick={handleCheckboxClick}
              onPointerDown={e => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleCheckboxChange}
                aria-label={`Select ${application.job_title} at ${application.company_name}`}
                data-testid={`select-application-${application.id}`}
                className={cn(
                  'h-4 w-4 rounded transition-opacity duration-200',
                  isSelected ? 'opacity-100' : 'opacity-70 sm:opacity-0 sm:group-hover:opacity-100'
                )}
              />
            </div>
          )}

          {/* Company Logo */}
          <CompanyLogo companyName={application.company_name} size="md" className="flex-shrink-0" />

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate text-label-primary mb-1">
              {application.job_title}
            </h3>
            <p className="text-sm font-medium text-label-secondary truncate">
              {application.company_name}
            </p>
          </div>

          {/* Drag Indicator */}
          <div
            data-testid="drag-indicator"
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 glass-ultra rounded-full p-1 cursor-grab active:cursor-grabbing"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4 sm:h-3 sm:w-3 text-label-tertiary" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-4 px-4">
        <div className="flex items-center justify-between">
          {/* Additional info can go here in the future */}
          <div />

          {/* Application Date */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-label-secondary font-medium">Applied</span>
            <span className="text-sm text-label-secondary">
              {formatDate(application.date_applied)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

ApplicationCard.displayName = 'ApplicationCard'
