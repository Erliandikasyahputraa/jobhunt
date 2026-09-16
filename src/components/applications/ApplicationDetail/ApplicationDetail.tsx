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
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

// Custom DialogContent without built-in close button (100% Solid, Opaque Surface Architecture)
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-slate-900/45 dark:bg-black/75 backdrop-blur-[2px] dark:backdrop-blur-[4px]'
      )}
    />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-0 border shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-2xl bg-white text-slate-900 border-neutral-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-800',
        'max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-full max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:max-h-[92vh] max-sm:border-x-0 max-sm:border-b-0',
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
            'w-full overflow-hidden p-0 bg-white text-slate-900 border border-neutral-200 shadow-2xl rounded-2xl dark:bg-slate-900 dark:text-slate-50 dark:border-slate-800',
            isEditMode ? 'max-w-5xl h-auto max-h-[90vh]' : 'max-w-[85vw] h-full max-h-[90vh]',
            'max-sm:max-w-full max-sm:w-full max-sm:h-auto max-sm:max-h-[92vh] max-sm:rounded-t-2xl max-sm:rounded-b-none'
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
            <div className="bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-800/60 rounded-xl m-4 p-4 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {isEditMode ? (
            <div className="flex flex-col max-h-[90vh] bg-white dark:bg-slate-900">
              {/* Edit Mode Header */}
              <div className="bg-white dark:bg-slate-900 border-b border-neutral-200 dark:border-slate-800 rounded-t-2xl max-sm:rounded-t-2xl p-6 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                      Edit Application
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Update the details for your application to {application.company_name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 p-2 rounded-lg"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Form Content - Scrollable with recessed canvas background */}
              <div className="overflow-y-auto p-6 bg-slate-50 dark:bg-[#090d16]">
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
        <AlertDialogContent className="bg-white text-slate-900 border-neutral-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-800 rounded-2xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-slate-50">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              This action cannot be undone. This will permanently delete the application for{' '}
              <strong className="text-slate-900 dark:text-slate-200">
                {application.company_name}
              </strong>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="bg-white text-slate-900 border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700"
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
