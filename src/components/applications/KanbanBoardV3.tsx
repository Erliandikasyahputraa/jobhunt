'use client'

import * as React from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { ApplicationCard } from './ApplicationCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'
import type { Application, ApplicationStatus, CustomColumnDB } from '@/lib/types/database.types'
import type { ColumnConfig } from '@/lib/types/column.types'
import { DEFAULT_COLUMNS } from '@/lib/storage/column-storage'
import { getColumnIcon } from '@/lib/utils/column-icons'
import { useHorizontalScroll } from '@/hooks/use-horizontal-scroll'
import { reorderApplicationsAction } from '@/app/dashboard/actions'
import { toast } from 'sonner'
import type { SortOption } from '@/lib/utils/filter-utils'
import { sortApplications } from '@/lib/utils/filter-utils'

interface KanbanBoardV3Props {
  applications: Application[]
  customColumns: CustomColumnDB[]
  onUpdateApplicationColumn: (
    id: string,
    position: number,
    newStatus?: ApplicationStatus,
    customColumnId?: string | null
  ) => Promise<void>
  onApplicationClick?: (application: Application) => void
  isLoading?: boolean
  sortOption?: SortOption
}

const CORE_EMPTY_STATE_GUIDANCE: Record<string, { heading: string; text: string; cta?: string }> = {
  saved: {
    heading: 'No saved jobs yet',
    text: "Start by adding jobs you're interested in to your wishlist",
    cta: 'Add jobs to wishlist',
  },
  applied: {
    heading: 'No applications submitted yet',
    text: 'Applications you submit will appear here',
  },
  interview: {
    heading: 'No interviews scheduled',
    text: 'When companies respond, your interviews will appear here',
  },
  offers: {
    heading: 'No offers yet',
    text: 'Keep applying! Your successful offers will be tracked here',
  },
  closed: {
    heading: 'No archived applications',
    text: "Applications that didn't work out will be stored here for future reference",
  },
}

interface SortableApplicationProps {
  application: Application
  isDragging: boolean
  isDragDisabled: boolean
  onApplicationClick?: (application: Application) => void
}

function SortableApplication({
  application,
  isDragging,
  isDragDisabled,
  onApplicationClick,
}: SortableApplicationProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: application.id,
    disabled: isDragDisabled,
    data: {
      applicationId: application.id,
      currentStatus: application.status,
      customColumnId: application.custom_column_id,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn('touch-manipulation', isDragDisabled && 'cursor-default')}
    >
      <ApplicationCard
        application={application}
        isDragging={isDragging}
        onClick={() => onApplicationClick?.(application)}
        dragHandleProps={
          isDragDisabled ? undefined : (listeners as unknown as Record<string, unknown>)
        }
      />
    </div>
  )
}

interface EmptyStateProps {
  column: ColumnConfig
  Icon: React.ComponentType<{ className?: string }>
}

function EmptyState({ column, Icon }: EmptyStateProps) {
  const guidance = CORE_EMPTY_STATE_GUIDANCE[column.id] || {
    heading: `No ${column.name.toLowerCase()} applications`,
    text: `Applications will appear here when you add them to this column.`,
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center glass-ultra rounded-glass border-2 border-dashed border-label-quaternary/30 p-12 text-center">
      <div className="glass-light rounded-full p-4 mb-4 border border-label-quaternary/20">
        <Icon className="h-12 w-12 text-label-tertiary" />
      </div>
      <h4 className="mb-2 font-bold text-label-primary text-base">{guidance.heading}</h4>
      <p className="mb-4 max-w-sm text-sm text-label-secondary leading-relaxed">{guidance.text}</p>
      {guidance.cta && (
        <Button
          variant="outline"
          size="sm"
          disabled
          className="glass-light border border-label-quaternary/30"
        >
          {guidance.cta}
        </Button>
      )}
    </div>
  )
}

interface KanbanColumnProps {
  column: ColumnConfig
  applications: Application[]
  activeId: string | null
  sortOption: SortOption
  onApplicationClick?: (application: Application) => void
  isExpanded: boolean
  onToggleExpand: () => void
}

function DroppableKanbanColumn({
  column,
  applications,
  activeId,
  sortOption,
  onApplicationClick,
  isExpanded,
  onToggleExpand,
}: KanbanColumnProps) {
  const isDragDisabled = sortOption !== 'manual'
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    disabled: isDragDisabled,
    data: {
      column,
    },
  })

  const count = applications.length
  const isExpandable = column.id === 'interview' && !column.isCustom

  const icon = column.icon || getColumnIcon(column.id)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-full md:w-auto min-w-0 md:min-w-[280px] lg:min-w-[320px] flex-1 flex-col rounded-glass p-3 shadow-glass-soft backdrop-blur-sm transition-all duration-200 md:snap-center',
        'md:h-full min-h-[150px] md:min-h-[200px]',
        'glass-light',
        isOver &&
          !isDragDisabled &&
          'ring-2 ring-blue-400 ring-opacity-50 shadow-glass-dramatic scale-[1.02]'
      )}
      data-testid={`column-${column.id}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isExpandable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 glass-ultra rounded-full hover:glass-light transition-all"
              onClick={onToggleExpand}
              aria-label={isExpanded ? 'Collapse sub-stages' : 'Expand sub-stages'}
              data-testid={`toggle-expand-${column.id}`}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-label-primary" />
              ) : (
                <ChevronRight className="h-4 w-4 text-label-primary" />
              )}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full glass-light border border-label-quaternary/20">
              <span className="text-xl">{icon}</span>
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-label-primary">{column.name}</h3>
              {column.isCustom && (
                <Badge variant="secondary" className="text-xs w-fit">
                  Custom
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Badge
          variant="outline"
          className="text-sm font-semibold glass-light border border-label-quaternary/30 px-3 py-1"
          data-testid={`count-badge-${column.id}`}
        >
          {count}
        </Badge>
      </div>

      {column.description && (
        <p className="mb-4 text-sm text-label-secondary">{column.description}</p>
      )}

      <SortableContext
        items={applications.map(app => app.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={cn(
            'flex flex-1 flex-col gap-3 transition-all duration-200 overflow-y-visible md:overflow-y-auto',
            'h-full min-h-[100px] column-content'
          )}
        >
          {applications.length === 0 ? (
            <EmptyState
              column={column}
              Icon={() => (
                <span className="text-3xl">{column.icon || getColumnIcon(column.id)}</span>
              )}
            />
          ) : (
            applications.map(application => (
              <SortableApplication
                key={application.id}
                application={application}
                isDragging={application.id === activeId}
                isDragDisabled={isDragDisabled}
                onApplicationClick={onApplicationClick}
              />
            ))
          )}
          {isOver && !isDragDisabled && applications.length === 0 && (
            <div className="flex items-center justify-center h-20 border-2 border-dashed border-blue-400 rounded-glass-sm animate-pulse">
              <span className="text-blue-400 text-sm font-medium">Drop to move here</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

export function KanbanBoardV3({
  applications,
  customColumns,
  onUpdateApplicationColumn,
  onApplicationClick,
  isLoading = false,
  sortOption = 'manual',
}: KanbanBoardV3Props) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [optimisticApplications, setOptimisticApplications] =
    React.useState<Application[]>(applications)
  const [announcement, setAnnouncement] = React.useState<string>('')
  const [expandedColumns, setExpandedColumns] = React.useState<Set<string>>(new Set())

  const kanbanScroll = useHorizontalScroll<HTMLDivElement>({ behavior: 'auto', throttleMs: 8 })

  // Combine Default Core Columns with User Custom Columns
  const columns: ColumnConfig[] = React.useMemo(() => {
    const customConfig: ColumnConfig[] = customColumns.map(cc => ({
      id: cc.id as any,
      name: cc.name,
      description: cc.description || undefined,
      icon: cc.icon || undefined,
      isCustom: true,
      order: cc.order + 100, // keep them after core columns
    }))

    return [...DEFAULT_COLUMNS, ...customConfig].sort((a, b) => a.order - b.order)
  }, [customColumns])

  React.useEffect(() => {
    setOptimisticApplications(applications)
  }, [applications])

  // Group applications by columns
  const columnApplications = React.useMemo(() => {
    const grouped: Record<string, Application[]> = {}

    columns.forEach(column => {
      grouped[column.id] = []
    })

    optimisticApplications.forEach(app => {
      // 1. If it has a valid custom column, put it there
      if (app.custom_column_id && grouped[app.custom_column_id] !== undefined) {
        grouped[app.custom_column_id].push(app)
        return
      }

      // 2. Otherwise, fall back to core status mapping
      for (const column of DEFAULT_COLUMNS) {
        if (column.statuses && column.statuses.includes(app.status)) {
          if (grouped[column.id]) {
            grouped[column.id].push(app)
          }
          return
        }
      }
    })

    // Sort within columns based on the current sortOption (default: position)
    Object.keys(grouped).forEach(columnId => {
      if (sortOption === 'manual') {
        grouped[columnId].sort((a, b) => a.position - b.position)
      } else {
        grouped[columnId] = sortApplications(grouped[columnId], sortOption)
      }
    })

    return grouped
  }, [optimisticApplications, columns, sortOption])

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    if (sortOption !== 'manual') return
    const { active } = event
    setActiveId(active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    if (sortOption !== 'manual') return
    const { active, over } = event

    setActiveId(null)
    if (!over) return

    const applicationId = active.id as string
    const overData = over.data?.current as { applicationId?: string } | undefined
    const dropTargetId = overData?.applicationId || (over.id as string)

    const application = optimisticApplications.find(app => app.id === applicationId)
    if (!application) return

    let targetColumn = columns.find(col => col.id === dropTargetId)

    if (!targetColumn) {
      const targetApplication = optimisticApplications.find(app => app.id === dropTargetId)
      if (targetApplication) {
        if (targetApplication.custom_column_id) {
          targetColumn = columns.find(col => col.id === targetApplication.custom_column_id)
        } else {
          targetColumn = DEFAULT_COLUMNS.find(col =>
            col.statuses?.includes(targetApplication.status)
          )
        }
      }
    }

    if (!targetColumn && over.data?.current) {
      const overData = over.data.current as Record<string, unknown>
      if (overData.column) {
        targetColumn = overData.column as ColumnConfig
      }
    }

    if (!targetColumn) return

    const currentColumnId =
      application.custom_column_id ||
      DEFAULT_COLUMNS.find(c => c.statuses?.includes(application.status))?.id

    // Same-column reordering
    if (currentColumnId === targetColumn.id) {
      const columnApps = columnApplications[targetColumn.id] || []
      const oldIndex = columnApps.findIndex(app => app.id === applicationId)
      let newIndex = columnApps.findIndex(app => app.id === dropTargetId)

      if (newIndex === -1 && dropTargetId === targetColumn.id) {
        newIndex = columnApps.length - 1
      }

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        return
      }

      const reorderedApps = arrayMove(columnApps, oldIndex, newIndex)
      const positionUpdates = reorderedApps.map((app, index) => ({
        id: app.id,
        position: index + 1,
      }))

      const updatedApplications = optimisticApplications.map(app => {
        const update = positionUpdates.find(u => u.id === app.id)
        return update ? { ...app, position: update.position } : app
      })

      setOptimisticApplications(updatedApplications)
      setAnnouncement(`${application.company_name} reordered within ${targetColumn.name}`)

      try {
        await reorderApplicationsAction(positionUpdates)
        toast.success('Application moved')
      } catch (error) {
        console.error('Failed to reorder applications:', error)
        setOptimisticApplications(applications)
        setAnnouncement(`Failed to reorder ${application.company_name}. Please try again.`)
        toast.error("Couldn't move application. Please try again.")
      }

      return
    }

    // Cross-column move
    let newStatus = application.status
    let newCustomColumnId: string | null = application.custom_column_id

    if (targetColumn.isCustom) {
      // STANDARD -> CUSTOM or CUSTOM -> CUSTOM
      newCustomColumnId = targetColumn.id
      // application.status remains UNCHANGED
    } else {
      // CUSTOM -> STANDARD or STANDARD -> STANDARD
      newCustomColumnId = null
      newStatus = targetColumn.statuses ? targetColumn.statuses[0] : application.status
    }

    const updatedApplications = optimisticApplications.map(app =>
      app.id === applicationId
        ? { ...app, status: newStatus, custom_column_id: newCustomColumnId }
        : app
    )
    setOptimisticApplications(updatedApplications)
    setAnnouncement(`${application.company_name} moved to ${targetColumn.name}`)

    try {
      // Calculate new position at end of target column
      const targetApps = columnApplications[targetColumn.id] || []
      const maxPosition = targetApps.reduce((max, app) => Math.max(max, app.position), 0)
      const newPosition = maxPosition + 1

      await onUpdateApplicationColumn(applicationId, newPosition, newStatus, newCustomColumnId)
      toast.success('Application moved')
    } catch (error) {
      console.error('Failed to update application column:', error)
      setOptimisticApplications(applications)
      setAnnouncement(`Failed to move ${application.company_name}. Please try again.`)
      toast.error("Couldn't move application. Please try again.")
    }
  }

  const activeApplication = React.useMemo(
    () => optimisticApplications.find(app => app.id === activeId),
    [activeId, optimisticApplications]
  )

  const toggleColumnExpansion = (columnId: string) => {
    setExpandedColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(columnId)) {
        newSet.delete(columnId)
      } else {
        newSet.add(columnId)
      }
      return newSet
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div
      role="region"
      aria-label="Job applications kanban board"
      className="flex h-full w-full flex-col md:overflow-hidden"
      style={{ minHeight: 'calc(100vh - 144px)' }}
    >
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={kanbanScroll.ref}
          data-testid="kanban-dnd-context"
          className="flex-1 w-full md:overflow-x-auto kanban-scrollbar md:snap-x md:snap-mandatory overflow-y-visible md:overflow-y-hidden"
        >
          <div
            className="flex flex-col md:flex-row gap-6 md:gap-4 p-0 sm:p-3 pb-24 md:pb-6 md:min-w-max md:h-full"
            style={{ minHeight: 'calc(100vh - 250px)' }}
          >
            {columns.map(column => (
              <DroppableKanbanColumn
                key={column.id}
                column={column}
                applications={columnApplications[column.id] || []}
                activeId={activeId}
                sortOption={sortOption}
                onApplicationClick={onApplicationClick}
                isExpanded={expandedColumns.has(column.id)}
                onToggleExpand={() => toggleColumnExpansion(column.id)}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeApplication ? (
            <div className="rotate-3 cursor-grabbing glass-heavy shadow-glass-dramatic rounded-glass animate-spring-bounce-in transform scale-105">
              <ApplicationCard application={activeApplication} isDragging={true} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

KanbanBoardV3.displayName = 'KanbanBoardV3'
