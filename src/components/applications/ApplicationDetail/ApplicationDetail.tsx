'use client'

import * as React from 'react'
import { Dialog, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
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
import { ApplicationDetailLayout } from './components/ApplicationDetailLayout'
import { useApplicationDetail } from './hooks/useApplicationDetail'
import ApplicationForm from '../ApplicationForm'
import type { Application, CustomColumnDB } from '@/lib/types/database.types'
import type { ApplicationFormData } from '@/lib/schemas/application.schema'
import { VisuallyHidden } from '@/components/ui/visually-hidden'

// Custom DialogContent without built-in close button
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 backdrop-blur-[40px] [-webkit-backdrop-filter:blur(40px)] bg-black/50'
      )}
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-glass-lg bg-white text-neutral-900 border-neutral-200 dark:bg-[var(--glass-medium)] dark:text-foreground dark:backdrop-blur-[30px] dark:[-webkit-backdrop-filter:blur(30px)] dark:saturate-[200%] dark:border-[var(--glass-border-strong)] data-[state=open]:animate-spring-bounce-in',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

export interface ApplicationDetailProps {
  application: Application
  customColumns?: CustomColumnDB[]
  onUpdate: (id: string, data: ApplicationFormData) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
  isOpen: boolean
}

export function ApplicationDetail({
  application,
  customColumns = [],
  onUpdate,
  onDelete,
  onClose,
  isOpen,
}: ApplicationDetailProps) {
  const {
    activeTab,
    isEditMode,
    isDeleteDialogOpen,
    isSubmitting,
    isDeleting,
    error,
    setActiveTab,
    setDeleteDialogOpen,
    setError: _setError,
    handleEditClick,
    handleCancelEdit,
    handleFormSubmit,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
  } = useApplicationDetail({
    application,
    onUpdate,
    onDelete,
    onClose,
  })

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className={cn(
            'w-full overflow-hidden p-0 bg-white text-neutral-900 border border-neutral-200 shadow-2xl rounded-glass-lg dark:glass-light dark:rounded-glass-lg dark:shadow-glass-dramatic dark:backdrop-blur-[20px] dark:[-webkit-backdrop-filter:blur(20px)] dark:saturate-[180%] dark:border-[var(--glass-border-strong)] dark:bg-[var(--glass-medium)]',
            isEditMode ? 'max-w-5xl h-auto max-h-[90vh]' : 'max-w-[85vw] h-full max-h-[90vh]'
          )}
        >
          {/* Visually Hidden Title for Accessibility */}
          <VisuallyHidden>
            <DialogTitle>
              Application Details: {application.job_title} at {application.company_name}
            </DialogTitle>
            <DialogDescription>
              View and edit job application details for {application.job_title} position at{' '}
              {application.company_name}
            </DialogDescription>
          </VisuallyHidden>
          {error && (
            <div className="bg-red-50 border border-red-200 dark:glass-light dark:bg-red-500/10 dark:border-red-600/40 rounded-glass-sm m-4 p-4 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {isEditMode ? (
            <div className="flex flex-col max-h-[90vh] bg-white dark:bg-transparent">
              {/* Edit Mode Header */}
              <div className="bg-white dark:glass-ultra border-b border-neutral-200 dark:border-label-quaternary/20 rounded-t-glass-lg p-6 shrink-0">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-label-primary">
                  Edit Application
                </h2>
                <p className="text-neutral-600 dark:text-label-secondary mt-1">
                  Update the details for your application to {application.company_name}
                </p>
              </div>

              {/* Form Content - Scrollable if needed */}
              <div className="overflow-y-auto p-6 bg-white dark:bg-transparent">
                <ApplicationForm
                  onSubmit={handleFormSubmit}
                  onCancel={handleCancelEdit}
                  initialData={{
                    company_name: application.company_name,
                    job_title: application.job_title,
                    job_url: application.job_url ?? '',
                    location: application.location ?? '',
                    salary_range: application.salary_range ?? '',
                    status: application.status,
                    date_applied: application.date_applied,
                    notes: application.notes ?? '',
                  }}
                  isLoading={isSubmitting}
                  submitButtonText="Save Changes"
                />
              </div>
            </div>
          ) : (
            <ApplicationDetailLayout
              application={application}
              customColumns={customColumns}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onClose={onClose}
              isEditMode={isEditMode}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onEdit={handleEditClick}
              onDeleteClick={handleDeleteClick}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white text-neutral-900 border-neutral-200 dark:bg-card dark:text-foreground dark:border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-neutral-900 dark:text-foreground">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-600 dark:text-muted-foreground">
              This action cannot be undone. This will permanently delete the application for{' '}
              <strong>{application.company_name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="bg-white text-neutral-900 border-neutral-900 dark:bg-card dark:text-foreground dark:border-border"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

ApplicationDetail.displayName = 'ApplicationDetail'
