'use client'

import * as React from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { Circle, CheckCircle, Clock, FileText, Plus, Columns } from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  Application,
  ApplicationStatusHistoryDB,
  ApplicationDocumentDB,
  CustomColumnDB,
} from '@/lib/types/database.types'
import { DEFAULT_COLUMNS } from '@/lib/storage/column-storage'
import { getStatusLabel } from '@/lib/utils/status-colors'
import { getApplicationHistoryAction } from '@/app/dashboard/actions'
import { getDocumentsByApplicationAction } from '@/app/dashboard/actions/documents'

export interface TimelineEvent {
  id: string
  type: 'creation' | 'status_change' | 'column_move' | 'document_added' | 'note_added'
  title: string
  description: string
  timestamp: Date
  icon?: React.ComponentType<{ className?: string }>
}

export interface ApplicationTimelineProps {
  application: Application
  customColumns?: CustomColumnDB[]
  className?: string
  initialHistory?: ApplicationStatusHistoryDB[]
  initialDocuments?: ApplicationDocumentDB[]
}

export function ApplicationTimeline({
  application,
  customColumns = [],
  className,
  initialHistory,
  initialDocuments,
}: ApplicationTimelineProps) {
  const [history, setHistory] = React.useState<ApplicationStatusHistoryDB[]>(initialHistory || [])
  const [documents, setDocuments] = React.useState<ApplicationDocumentDB[]>(initialDocuments || [])
  const [_isLoading, setIsLoading] = React.useState(!initialHistory && !initialDocuments)

  React.useEffect(() => {
    let isMounted = true
    async function loadTimelineData() {
      try {
        const [fetchedHistory, fetchedDocs] = await Promise.all([
          getApplicationHistoryAction(application.id).catch(() => []),
          getDocumentsByApplicationAction(application.id).catch(() => []),
        ])
        if (isMounted) {
          setHistory(fetchedHistory)
          setDocuments(fetchedDocs)
          setIsLoading(false)
        }
      } catch {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadTimelineData()
    return () => {
      isMounted = false
    }
  }, [application.id, application.updated_at, application.status, application.custom_column_id])

  const resolveColumnName = React.useCallback(
    (customColumnId: string | null, statusFallback: string) => {
      if (customColumnId) {
        const found = customColumns.find(c => c.id === customColumnId)
        return found ? found.name : 'Custom Column'
      }
      const defaultCol = DEFAULT_COLUMNS.find(c => c.statuses?.includes(statusFallback as any))
      return defaultCol ? defaultCol.name : getStatusLabel(statusFallback)
    },
    [customColumns]
  )

  // Generate timeline events based on real application created_at, status history, and documents
  const timelineEvents: TimelineEvent[] = React.useMemo(() => {
    const events: TimelineEvent[] = []

    // 1. Application Creation Event (MUST use applications.created_at, NEVER date_applied)
    let creationDate: Date
    try {
      creationDate = application.created_at ? parseISO(application.created_at) : new Date()
      if (!isValid(creationDate)) creationDate = new Date()
    } catch {
      creationDate = new Date()
    }

    let appliedDateNote = ''
    if (application.date_applied) {
      try {
        const parsedApplied = parseISO(application.date_applied)
        if (isValid(parsedApplied)) {
          appliedDateNote = `Applied on ${format(parsedApplied, 'MMM dd, yyyy')}`
        }
      } catch {
        // ignore date parse error
      }
    }

    events.push({
      id: 'application-created',
      type: 'creation',
      title: 'Application Created',
      description: appliedDateNote
        ? `Added job application for ${application.job_title} at ${application.company_name} · ${appliedDateNote}`
        : `Added job application for ${application.job_title} at ${application.company_name}`,
      timestamp: creationDate,
      icon: Plus,
    })

    // 2. Real Historical Status & Column Transitions (from application_status_history)
    history.forEach(item => {
      // Skip the baseline insert where from_status and from_custom_column_id are both null
      if (item.from_status === null && item.from_custom_column_id === null) {
        return
      }

      let eventDate = parseISO(item.created_at)
      if (!isValid(eventDate)) eventDate = new Date()

      const hasStatusChange = item.from_status && item.from_status !== item.to_status
      const hasColumnChange = item.from_custom_column_id !== item.to_custom_column_id

      if (hasStatusChange && hasColumnChange) {
        const fromCol = resolveColumnName(
          item.from_custom_column_id,
          item.from_status || 'wishlist'
        )
        const toCol = resolveColumnName(item.to_custom_column_id, item.to_status)
        events.push({
          id: `status-history-${item.id}`,
          type: 'status_change',
          title: 'Status & Column Changed',
          description: `${getStatusLabel(item.from_status!)} → ${getStatusLabel(item.to_status)} (${fromCol} → ${toCol})`,
          timestamp: eventDate,
          icon: CheckCircle,
        })
      } else if (hasStatusChange) {
        events.push({
          id: `status-history-${item.id}`,
          type: 'status_change',
          title: 'Status Changed',
          description: `${getStatusLabel(item.from_status!)} → ${getStatusLabel(item.to_status)}`,
          timestamp: eventDate,
          icon: CheckCircle,
        })
      } else if (hasColumnChange) {
        const fromCol = resolveColumnName(
          item.from_custom_column_id,
          item.from_status || item.to_status
        )
        const toCol = resolveColumnName(item.to_custom_column_id, item.to_status)
        events.push({
          id: `column-history-${item.id}`,
          type: 'column_move',
          title: 'Column Moved',
          description: `${fromCol} → ${toCol}`,
          timestamp: eventDate,
          icon: Columns,
        })
      }
    })

    // 3. Document Upload Events (from application_documents)
    documents.forEach(doc => {
      let docDate = parseISO(doc.created_at)
      if (!isValid(docDate)) docDate = new Date()

      events.push({
        id: `doc-${doc.id}`,
        type: 'document_added',
        title: 'Document Added',
        description: `Uploaded ${doc.name} (${doc.document_type.replace('_', ' ')})`,
        timestamp: docDate,
        icon: FileText,
      })
    })

    // Sort events by timestamp (newest first)
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [application, history, documents, resolveColumnName])

  const formatDate = (date: Date): string => {
    return format(date, 'MMM dd, yyyy')
  }

  const formatTime = (date: Date): string => {
    return format(date, 'h:mm a')
  }

  const _getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'creation':
        return Plus
      case 'status_change':
        return CheckCircle
      case 'column_move':
        return Columns
      case 'document_added':
        return FileText
      case 'note_added':
        return FileText
      default:
        return Circle
    }
  }

  const getEventColor = (type: TimelineEvent['type'], isLatest: boolean) => {
    if (isLatest) {
      return 'border-orange-600 bg-orange-600 text-white dark:border-amber-500 dark:bg-amber-500 dark:text-slate-950 ring-4 ring-orange-500/15 dark:ring-amber-500/20'
    }
    switch (type) {
      case 'creation':
      case 'status_change':
      case 'column_move':
        return 'border-slate-400 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
      case 'document_added':
        return 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
      case 'note_added':
        return 'border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
      default:
        return 'border-slate-300 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500'
    }
  }

  return (
    <div className={cn('p-6 bg-slate-50/70 dark:bg-slate-900', className)}>
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
          Timeline
        </h3>
      </div>

      <div className="space-y-4">
        {timelineEvents.map((event, index) => {
          const isLatest = index === 0
          const isLast = index === timelineEvents.length - 1

          return (
            <div key={event.id} className="relative pl-6 pb-4 last:pb-0">
              {/* Timeline dot */}
              <div
                className={cn(
                  'absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 z-10 flex items-center justify-center',
                  getEventColor(event.type, isLatest)
                )}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>

              {/* Timeline line - connecting vertical line between dots (NEUTRAL SLATE) */}
              {!isLast && (
                <div
                  className="absolute left-[7px] top-[18px] h-full border-l-2 border-slate-200 dark:border-slate-800"
                  aria-hidden="true"
                />
              )}

              {/* Event content */}
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                    {event.title}
                  </h4>
                  <div className="flex flex-col items-end text-right shrink-0">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(event.timestamp)}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      {formatTime(event.timestamp)}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          )
        })}

        {/* Empty state for future events */}
        {timelineEvents.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-600 dark:text-slate-400">No timeline events yet</p>
          </div>
        )}

        {/* Add more events prompt */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            Timeline will update as your application progresses
          </p>
        </div>
      </div>
    </div>
  )
}
