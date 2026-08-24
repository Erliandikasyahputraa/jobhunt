'use client'

import * as React from 'react'
import { Plus, Rocket, Lightbulb } from 'lucide-react'
import { NavBar } from '@/components/layout/NavBar'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import dynamic from 'next/dynamic'

const ActivityCalendar = dynamic(
  () => import('@/components/dashboard/ActivityCalendar').then(m => m.ActivityCalendar),
  { ssr: false }
)

const StatusDistributionChart = dynamic(
  () =>
    import('@/components/dashboard/StatusDistributionChart').then(m => m.StatusDistributionChart),
  { ssr: false }
)
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import {
  getDashboardStats,
  getActivityCalendarData,
  getStatusDistribution,
  getRecentActivity,
} from '@/lib/utils/dashboard'
import { Button } from '@/components/ui/button'
import type { Application } from '@/lib/types/database.types'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { getApplicationsAction } from './actions'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [applications, setApplications] = React.useState<Application[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // User state for NavBar
  const [user, setUser] = React.useState<User | null>(null)

  // Derived dashboard metrics
  const stats = React.useMemo(() => getDashboardStats(applications), [applications])
  const calendarData = React.useMemo(() => getActivityCalendarData(applications), [applications])
  const distributionData = React.useMemo(() => getStatusDistribution(applications), [applications])
  const recentActivityData = React.useMemo(() => getRecentActivity(applications), [applications])

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

        // Set user information
        setUser(currentUser)

        // Load applications
        const apps = await getApplicationsAction()
        setApplications(apps)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load applications. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <AnimatedBackground variant="minimal">
        <div className="min-h-screen">
          <NavBar variant="authenticated" user={user} />
          <main className="mx-auto w-full px-4 py-4">
            <div className="flex items-center justify-center p-8 glass-ultra rounded-glass shadow-glass-subtle">
              <p className="text-label-secondary">Loading dashboard...</p>
            </div>
          </main>
        </div>
      </AnimatedBackground>
    )
  }

  if (error) {
    return (
      <AnimatedBackground variant="minimal">
        <div className="min-h-screen">
          <NavBar variant="authenticated" user={user} />
          <main className="mx-auto w-full px-4 py-4">
            <div className="flex items-center justify-center p-8 glass-light rounded-glass shadow-glass-soft">
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
      <div className="min-h-screen">
        <NavBar variant="authenticated" user={user} />

        <main className="mx-auto w-full px-4 py-4">
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
              <div className="max-w-md text-center space-y-6 glass-ultra rounded-glass-lg p-8 shadow-glass-soft">
                <div className="flex justify-center">
                  <Rocket className="h-24 w-24" style={{ color: 'var(--tint-blue)' }} />
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold text-label-primary">
                    Start Your Job Hunt Journey
                  </h2>
                  <p className="text-label-secondary text-lg">
                    Your analytics dashboard is ready. Head over to your applications pipeline to
                    begin tracking.
                  </p>
                </div>

                <Button
                  onClick={() => router.push('/applications')}
                  size="lg"
                  className="w-full sm:w-auto btn-glass font-semibold"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Go to Applications
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
            <>
              {/* Overview Section */}
              <div className="mb-8 space-y-4">
                <DashboardStats stats={stats} />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <ActivityCalendar
                      years={calendarData.years}
                      dataByYear={calendarData.dataByYear}
                    />
                  </div>
                  <div>
                    <StatusDistributionChart data={distributionData} />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <RecentActivity applications={recentActivityData} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </AnimatedBackground>
  )
}
