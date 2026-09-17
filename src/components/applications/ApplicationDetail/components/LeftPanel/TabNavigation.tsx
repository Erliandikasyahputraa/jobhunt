'use client'

import * as React from 'react'
import { FileText, Building, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TabType } from '../../types'

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  disabled?: boolean
}

const tabItems: Array<{
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}> = [
  {
    id: 'overview',
    label: 'Overview',
    icon: FileText,
    description: 'Job description and details',
  },
  {
    id: 'company',
    label: 'Company',
    icon: Building,
    description: 'Company information and research',
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FolderOpen,
    description: 'Resume, cover letter, and attachments',
  },
]

export function TabNavigation({ activeTab, onTabChange, disabled = false }: TabNavigationProps) {
  const handleTabClick = React.useCallback(
    (tabId: TabType) => {
      if (!disabled) {
        onTabChange(tabId)
      }
    },
    [disabled, onTabChange]
  )

  return (
    <nav className="p-3 sm:p-4 space-y-1.5" role="tablist">
      {tabItems.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
            disabled={disabled}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all duration-150 text-left',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
              isActive
                ? 'bg-amber-500/10 dark:bg-amber-500/15 text-[var(--text-primary)] border-l-[3px] border-amber-600 dark:border-amber-500 shadow-xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-recessed)]',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Icon
              className={cn(
                'w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-colors',
                isActive ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-muted)]'
              )}
            />
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  'text-sm truncate',
                  isActive
                    ? 'font-semibold text-[var(--text-primary)]'
                    : 'font-medium text-[var(--text-primary)]'
                )}
              >
                {tab.label}
              </div>
              <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                {tab.description}
              </div>
            </div>
          </button>
        )
      })}
    </nav>
  )
}
