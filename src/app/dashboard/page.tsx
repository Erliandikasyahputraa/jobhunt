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
import { getApplicationsWorkspaceDataAction } from './actions'
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

        // Load applications and user in a single authenticated server action
        const data = await getApplicationsWorkspaceDataAction()
        setUser(data.user)
        setApplications(data.applications)
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
          <main className="mx-auto w-full px-4 py-6 max-w-7xl">
            <span className="sr-only">Loading dashboard...</span>
            {/* Dashboard Skeleton */}
            <div
              className="space-y-6 animate-pulse"
              aria-busy="true"
              aria-label="Loading dashboard..."
            >
              {/* Stat Cards Skeleton */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="glass-ultra rounded-2xl p-6 shadow-glass-subtle space-y-3 border border-border/30"
                  >
                    <div className="h-4 w-24 bg-muted/60 rounded-md" />
                    <div className="h-8 w-16 bg-muted/80 rounded-md" />
                  </div>
                ))}
              </div>

              {/* Charts Row Skeleton */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 glass-ultra rounded-2xl p-6 shadow-glass-subtle border border-border/30 h-72 flex flex-col justify-between">
                  <div className="h-5 w-40 bg-muted/60 rounded-md" />
                  <div className="h-44 w-full bg-muted/30 rounded-xl" />
                </div>
                <div className="glass-ultra rounded-2xl p-6 shadow-glass-subtle border border-border/30 h-72 flex flex-col justify-between">
                  <div className="h-5 w-36 bg-muted/60 rounded-md" />
                  <div className="h-44 w-full bg-muted/30 rounded-xl" />
                </div>
              </div>

              {/* Recent Activity Skeleton */}
              <div className="glass-ultra rounded-2xl p-6 shadow-glass-subtle border border-border/30 space-y-4">
                <div className="h-5 w-32 bg-muted/60 rounded-md" />
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 w-full bg-muted/30 rounded-xl" />
                  ))}
                </div>
              </div>
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
          <main className="mx-auto w-full px-4 py-6 max-w-7xl">
            <div className="flex items-center justify-center p-8 glass-light rounded-2xl shadow-glass-soft border border-border/40">
              <div className="text-center space-y-3">
                <p className="text-destructive font-medium">{error}</p>
                <Button onClick={() => window.location.reload()} className="btn-brand-gradient">
                  Coba Lagi
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

        <main className="mx-auto w-full px-4 py-6 max-w-7xl">
          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
              <div className="max-w-md text-center space-y-6 glass-ultra rounded-2xl p-8 shadow-glass-soft border border-border/40">
                <div className="flex justify-center">
                  <Rocket className="h-20 w-20 text-brand-primary" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Mulai Perjalanan Cari Kerja Kamu
                  </h2>
                  <span className="sr-only">Start Your Job Hunt Journey</span>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    Dashboard analitik kamu sudah siap. Yuk, mulai masukkan daftar lamaran kerja
                    pertamamu!
                  </p>
                  <span className="sr-only">Your analytics dashboard is ready.</span>
                </div>

                <Button
                  onClick={() => router.push('/applications')}
                  size="lg"
                  aria-label="Go to Applications"
                  className="w-full sm:w-auto btn-brand-gradient font-semibold"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Buka Papan Lamaran
                </Button>

                <div className="glass-medium rounded-xl p-4 shadow-glass-subtle border border-border/40">
                  <p className="text-xs sm:text-sm text-foreground flex items-center justify-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>
                      Tips: Mulai dengan menambahkan lowongan yang kamu incar ke kolom Incaran
                    </span>
                  </p>
                  <span className="sr-only">
                    Tip: Start by adding jobs you&apos;re interested in to your wishlist
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Overview Section */}
              <div className="mb-8 space-y-6">
                <DashboardStats stats={stats} />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                <div className="grid grid-cols-1 gap-6">
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
