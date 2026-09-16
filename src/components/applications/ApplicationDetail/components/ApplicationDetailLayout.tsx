'use client'

import * as React from 'react'
import type { Application, CustomColumnDB } from '@/lib/types/database.types'
import type { ApplicationFormData } from '@/lib/schemas/application.schema'
import type { TabType } from '../types'
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
    <div className="flex flex-col h-full max-h-[90vh] max-sm:max-h-[92vh] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      {/* Mobile Drag Handle Indicator */}
      <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0 bg-white dark:bg-slate-900">
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-neutral-200 dark:border-slate-800 rounded-t-2xl shrink-0">
        {/* Primary Header Info */}
        <div className="flex items-start justify-between gap-4 p-6 pb-3">
          <div className="flex items-center gap-4 min-w-0">
            <CompanyLogo
              companyName={application.company_name}
              size="lg"
              className="flex-shrink-0 rounded-xl"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-50 truncate leading-tight tracking-tight">
                {application.job_title}
              </h1>
              <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-400 truncate leading-tight mt-0.5">
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
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-3">
          {/* Location */}
          {application.location && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 dark:text-slate-500">📍</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {application.location}
              </span>
            </div>
          )}

          {/* Salary */}
          {application.salary_range && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 dark:text-slate-500">💰</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {application.salary_range}
              </span>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500">📊</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {getStatusLabel(application.status)}
            </span>
          </div>

          {/* Column */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500">📁</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Column: {columnName}
            </span>
          </div>

          {/* Date Applied */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500">📅</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {new Date(application.date_applied).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* Source */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 dark:text-slate-500">🔗</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Added from {application.source || 'external'}
            </span>
          </div>
        </div>
      </div>

      {/* Three Panel Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Panel - Navigation */}
        <div className="hidden lg:block w-60 shrink-0 border-r border-neutral-200 dark:border-slate-800 overflow-y-auto bg-slate-50/70 dark:bg-slate-900">
          <TabNavigation activeTab={activeTab} onTabChange={onTabChange} disabled={isEditMode} />
        </div>

        {/* Main Content Basin */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-slate-50 dark:bg-[#090d16]">
          <MainPanel application={application} activeTab={activeTab} />
        </div>

        {/* Right Panel - Timeline */}
        <div className="hidden xl:block w-80 shrink-0 border-l border-neutral-200 dark:border-slate-800 overflow-y-auto bg-slate-50/70 dark:bg-slate-900">
          <ApplicationTimeline application={application} customColumns={customColumns} />
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden border-t border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 px-2">
        <TabNavigation activeTab={activeTab} onTabChange={onTabChange} disabled={isEditMode} />
      </div>
    </div>
  )
}
