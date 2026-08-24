'use client'

import * as React from 'react'
import { Plus, Rocket, Lightbulb } from 'lucide-react'
import { NavBar } from '@/components/layout/NavBar'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { KanbanBoardV3 } from '@/components/applications/KanbanBoardV3'
import ApplicationForm from '@/components/applications/ApplicationForm'
import { ApplicationDetail } from '@/components/applications/ApplicationDetail'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Application } from '@/lib/types/database.types'
import type { ApplicationFormData } from '@/lib/schemas/application.schema'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  createApplicationAction,
  updateApplicationAction,
  deleteApplicationAction,
  updateApplicationPositionAction,
  getApplicationsAction,
  getCustomColumnsAction,
  createCustomColumnAction,
} from '@/app/dashboard/actions'
import type { CustomColumnDB } from '@/lib/types/database.types'
import { columnStorage } from '@/lib/storage/column-storage'

export default function ApplicationsPage() {
  const [applications, setApplications] = React.useState<Application[]>([])
  const [customColumns, setCustomColumns] = React.useState<CustomColumnDB[]>([])
  const [filteredApplications, setFilteredApplications] = React.useState<Application[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState('')

  // Modal states
  const [isNewApplicationModalOpen, setIsNewApplicationModalOpen] = React.useState(false)
  const [selectedApplication, setSelectedApplication] = React.useState<Application | null>(null)

  // Operation loading states
  const [isCreating, setIsCreating] = React.useState(false)
  const [createError, setCreateError] = React.useState<string | null>(null)

  // User state for NavBar
  const [user, setUser] = React.useState<User | null>(null)

  // Load user session and applications on mount
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        setError(null)

        // Get authenticated user session
        const supabase = createClient()
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !currentUser) {
          console.error('Authentication error:', authError)
          setError('Authentication required. Please log in.')
          return
        }

        setUser(currentUser)

        // Load applications and custom columns
        const [apps, dbColumns] = await Promise.all([
          getApplicationsAction(),
          getCustomColumnsAction(),
        ])

        // Handle LocalStorage Migration
        let finalColumns = dbColumns
        if (dbColumns.length === 0) {
          const localData = columnStorage.getColumns().filter(col => col.isCustom)
          if (localData.length > 0) {
            try {
              // Migrate local custom columns to Supabase
              const migrationPromises = localData.map(col =>
                createCustomColumnAction({
                  name: col.name,
                  description: col.description || null,
                  icon: col.icon || null,
                  order: col.order,
                })
              )
              const migratedCols = await Promise.all(migrationPromises)
              finalColumns = migratedCols
              // Clear local storage after successful migration
              if (typeof window !== 'undefined') {
                localStorage.removeItem('kanban-columns')
              }
            } catch (migrationError) {
              console.error('Failed to migrate local columns:', migrationError)
              // We just log it and proceed. Users can recreate them.
            }
          }
        }

        setApplications(apps)
        setFilteredApplications(apps)
        setCustomColumns(finalColumns)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load applications. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter applications when search query changes
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredApplications(applications)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const filtered = applications.filter(
      app =>
        app.company_name.toLowerCase().includes(query) ||
        app.job_title.toLowerCase().includes(query)
    )
    setFilteredApplications(filtered)
  }, [searchQuery, applications])

  // Handle create application
  const handleCreateApplication = async (formData: ApplicationFormData) => {
    setIsCreating(true)
    setCreateError(null)

    try {
      const newApplication = await createApplicationAction(formData)
      setApplications(prev => [newApplication, ...prev])
      setIsNewApplicationModalOpen(false)
    } catch (err) {
      console.error('Failed to create application:', err)
      setCreateError('Failed to create application. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle update application
  const handleUpdateApplication = async (id: string, formData: ApplicationFormData) => {
    try {
      const updatedApplication = await updateApplicationAction(id, formData)
      setApplications(prev => prev.map(app => (app.id === id ? updatedApplication : app)))
      setSelectedApplication(null)
    } catch (err) {
      console.error('Failed to update application:', err)
      throw err // Re-throw to let ApplicationDetail handle the error
    }
  }

  // Handle delete application
  const handleDeleteApplication = async (id: string) => {
    try {
      await deleteApplicationAction(id)
      setApplications(prev => prev.filter(app => app.id !== id))
      setSelectedApplication(null)
    } catch (err) {
      console.error('Failed to delete application:', err)
      throw err // Re-throw to let ApplicationDetail handle the error
    }
  }

  // Handle update application status (drag-and-drop)
  const handleUpdateApplicationColumn = async (
    id: string,
    position: number,
    newStatus?: Application['status'],
    customColumnId?: string | null
  ) => {
    try {
      const updatedApplication = await updateApplicationPositionAction(
        id,
        position,
        newStatus,
        customColumnId
      )
      setApplications(prev => prev.map(app => (app.id === id ? updatedApplication : app)))
    } catch (err) {
      console.error('Failed to update application column:', err)
      throw err // Re-throw to let KanbanBoard handle the error
    }
  }

  // Handle custom column changes
  const handleCustomColumnsChange = (newColumns: CustomColumnDB[]) => {
    setCustomColumns(newColumns)
  }

  // Handle application card click
  const handleApplicationClick = (application: Application) => {
    setSelectedApplication(application)
  }

  // Handle close detail modal
  const handleCloseDetail = () => {
    setSelectedApplication(null)
  }

  // Handle open new application modal
  const handleOpenNewModal = () => {
    setCreateError(null)
    setIsNewApplicationModalOpen(true)
  }

  // Handle close new application modal
  const handleCloseNewModal = () => {
    setIsNewApplicationModalOpen(false)
    setCreateError(null)
  }

  if (isLoading) {
    return (
      <AnimatedBackground variant="minimal">
        <div className="min-h-screen flex flex-col">
          <NavBar variant="authenticated" user={user} />
          <main className="mx-auto w-full flex-1 px-4 py-4 flex flex-col">
            <div className="flex flex-1 items-center justify-center p-8 glass-ultra rounded-glass shadow-glass-subtle">
              <p className="text-label-secondary">Loading applications...</p>
            </div>
          </main>
        </div>
      </AnimatedBackground>
    )
  }

  if (error) {
    return (
      <AnimatedBackground variant="minimal">
        <div className="min-h-screen flex flex-col">
          <NavBar variant="authenticated" user={user} />
          <main className="mx-auto w-full flex-1 px-4 py-4 flex flex-col">
            <div className="flex flex-1 items-center justify-center p-8 glass-light rounded-glass shadow-glass-soft">
              <div className="text-center">
                <p
                  className="text-label-primary font-medium mb-4"
                  style={{ color: 'var(--color-error)' }}
                >
                  {error}
                </p>
                <Button onClick={() => window.location.reload()} className="mt-4 btn-glass">
                  Retry
                </Button>
              </div>
            </div>
          </main>
        </div>
      </AnimatedBackground>
    )
  }

  return (
    <AnimatedBackground variant="minimal">
      <div className="min-h-screen flex flex-col">
        <NavBar variant="authenticated" user={user} />

        <main className="mx-auto w-full flex-1 px-4 py-4 flex flex-col">
          {applications.length === 0 && !isNewApplicationModalOpen ? (
            <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] px-4">
              <div className="max-w-md text-center space-y-6 glass-ultra rounded-glass-lg p-8 shadow-glass-soft">
                <div className="flex justify-center">
                  <Rocket className="h-24 w-24" style={{ color: 'var(--tint-blue)' }} />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold text-label-primary">
                    Start Your Job Hunt Journey
                  </h2>
                  <p className="text-label-secondary text-lg">
                    Track applications, ace interviews, land your dream job
                  </p>
                </div>

                <Button
                  onClick={handleOpenNewModal}
                  size="lg"
                  className="w-full sm:w-auto btn-glass font-semibold"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Your First Application
                </Button>

                <div
                  className="glass-medium rounded-glass-sm p-4 shadow-glass-subtle"
                  style={{ border: '1px solid var(--glass-border-medium)' }}
                >
                  <p className="text-sm text-label-primary flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" style={{ color: 'var(--tint-yellow)' }} />
                    <span>
                      Tip: Start by adding jobs you&apos;re interested in to your wishlist
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full">
              {/* Kanban Board (Detailed View) */}
              <KanbanBoardV3
                applications={filteredApplications}
                customColumns={customColumns}
                onUpdateApplicationColumn={handleUpdateApplicationColumn}
                onCustomColumnsChange={handleCustomColumnsChange}
                onApplicationClick={handleApplicationClick}
                isLoading={false}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onNewApplication={handleOpenNewModal}
              />
            </div>
          )}
        </main>

        {/* New Application Modal */}
        <Dialog open={isNewApplicationModalOpen} onOpenChange={handleCloseNewModal}>
          <DialogContent variant="glass" className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Application</DialogTitle>
              <DialogDescription>
                Fill in the details of your job application below.
              </DialogDescription>
            </DialogHeader>

            {createError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-200">
                {createError}
              </div>
            )}

            <ApplicationForm
              onSubmit={handleCreateApplication}
              onCancel={handleCloseNewModal}
              isLoading={isCreating}
            />
          </DialogContent>
        </Dialog>

        {/* Application Detail Sheet */}
        {selectedApplication && (
          <ApplicationDetail
            application={selectedApplication}
            onUpdate={handleUpdateApplication}
            onDelete={handleDeleteApplication}
            onClose={handleCloseDetail}
            isOpen={true}
          />
        )}
      </div>
    </AnimatedBackground>
  )
}
