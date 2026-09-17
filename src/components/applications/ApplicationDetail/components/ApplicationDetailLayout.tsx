'use client'

import * as React from 'react'
import type { Application, CustomColumnDB } from '@/lib/types/database.types'
import type { ApplicationFormData } from '@/lib/schemas/application.schema'
import type { TabType } from '../types'
import { MapPin, WalletCards, Activity, KanbanSquare, Calendar, Compass } from 'lucide-react'
import { CompanyLogo } from '@/components/ui/company-logo'
import { DEFAULT_COLUMNS } from '@/lib/storage/column-storage'
import { getStatusLabel } from '@/lib/utils/status-colors'
import { TabNavigation } from './LeftPanel/TabNavigation'
import { MainPanel } from './MainPanel/MainPanel'
import { ApplicationTimeline } from './RightPanel/ApplicationTimeline'
import { ActionButtons } from './ActionButtons'

interface ApplicationDetailLayoutProps {
  application: Application
  customColumns?: CustomColumnDB[]
  onUpdate: (id: string, data: ApplicationFormData) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
  isEditMode: boolean
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  onEdit: () => void
  onDeleteClick: () => void
}

export function ApplicationDetailLayout({
  application,
  customColumns = [],
  onUpdate: _onUpdate,
  onDelete: _onDelete,
  onClose,
  isEditMode,
  activeTab,
  onTabChange,
  onEdit,
  onDeleteClick,
}: ApplicationDetailLayoutProps) {
  const columnName = application.custom_column_id
    ? customColumns.find(c => c.id === application.custom_column_id)?.name || 'Custom Column'
    : DEFAULT_COLUMNS.find(col => col.statuses?.includes(application.status))?.name ||
      getStatusLabel(application.status)

  return (
    <div className="flex flex-col h-full max-h-[90vh] max-sm:max-h-[92vh] bg-[var(--modal-shell)] text-[var(--text-primary)]">
      {/* Mobile Drag Handle Indicator */}
      <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0 bg-[var(--modal-header)]">
        <div className="w-12 h-1.5 rounded-full bg-[var(--border-strong)]" />
      </div>

      {/* Header */}
      <div className="bg-[var(--modal-header)] border-b border-[var(--modal-divider)] rounded-t-2xl shrink-0">
        {/* Primary Header Info */}
        <div className="flex items-start justify-between gap-4 p-6 pb-3">
          <div className="flex items-center gap-4 min-w-0">
            <CompanyLogo
              companyName={application.company_name}
              size="lg"
              className="flex-shrink-0 rounded-xl"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] truncate leading-tight tracking-tight">
                {application.job_title}
              </h1>
              <p className="text-sm sm:text-base font-medium text-[var(--text-secondary)] truncate leading-tight mt-0.5">
                {application.company_name}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <ActionButtons
            application={application}
            onEdit={onEdit}
            onDelete={onDeleteClick}
            onClose={onClose}
            isDisabled={isEditMode}
          />
        </div>

        {/* Metadata Strip */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 pb-4 text-xs sm:text-sm text-[var(--text-secondary)] border-t border-[var(--modal-divider)] pt-3">
          {/* Location */}
          {application.location && (
            <div className="flex items-center gap-1.5">
              <MapPin
                className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0"
                aria-hidden="true"
              />
              <span className="font-medium text-[var(--text-primary)]">{application.location}</span>
            </div>
          )}

          {/* Salary */}
          {application.salary_range && (
            <div className="flex items-center gap-1.5">
              <WalletCards
                className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0"
                aria-hidden="true"
              />
              <span className="font-medium text-[var(--text-primary)]">
                {application.salary_range}
              </span>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <Activity
              className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0"
              aria-hidden="true"
            />
            <span className="font-medium text-[var(--text-primary)]">
              {getStatusLabel(application.status)}
            </span>
          </div>

          {/* Column */}
          <div className="flex items-center gap-1.5">
            <KanbanSquare
              className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0"
              aria-hidden="true"
            />
            <span className="font-medium text-[var(--text-primary)]">Column: {columnName}</span>
          </div>

          {/* Date Applied */}
          <div className="flex items-center gap-1.5">
            <Calendar
              className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0"
              aria-hidden="true"
            />
            <span className="font-medium text-[var(--text-primary)]">
              {new Date(application.date_applied).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Source */}
          <div className="flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" aria-hidden="true" />
            <span className="font-medium text-[var(--text-primary)]">
              Added from {application.source || 'external'}
            </span>
          </div>
        </div>
      </div>

      {/* Three Panel Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Panel - Navigation */}
        <div className="hidden lg:block w-60 shrink-0 border-r border-[var(--modal-divider)] overflow-y-auto bg-[var(--modal-sidebar)]">
          <TabNavigation activeTab={activeTab} onTabChange={onTabChange} disabled={isEditMode} />
        </div>

        {/* Main Content Basin */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-[var(--modal-canvas)]">
          <MainPanel application={application} activeTab={activeTab} />
        </div>

        {/* Right Panel - Timeline */}
        <div className="hidden xl:block w-80 shrink-0 border-l border-[var(--modal-divider)] overflow-y-auto bg-[var(--modal-sidebar)]">
          <ApplicationTimeline application={application} customColumns={customColumns} />
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden border-t border-[var(--modal-divider)] bg-[var(--modal-header)] py-1.5 px-2">
        <TabNavigation activeTab={activeTab} onTabChange={onTabChange} disabled={isEditMode} />
      </div>
    </div>
  )
}
