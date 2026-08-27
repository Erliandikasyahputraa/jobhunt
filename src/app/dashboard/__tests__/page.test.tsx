import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'

import DashboardPage from '../page'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { setupMatchMedia } from '@/test/setup'
import type { Application } from '@/lib/types/database.types'
import * as actions from '../actions'
import { createClient } from '@/lib/supabase/client'

// Mock the Supabase API functions that are causing issues
vi.mock('@/lib/api/profiles', () => ({
  getUserProfile: vi.fn().mockResolvedValue(null),
}))

// Wrapper for ThemeProvider context
function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

// Mock server actions
vi.mock('../actions', () => ({
  getApplicationsWorkspaceDataAction: vi.fn(),
  createApplicationAction: vi.fn(),
  updateApplicationAction: vi.fn(),
  deleteApplicationAction: vi.fn(),
  updateApplicationStatusAction: vi.fn(),
  getApplicationsAction: vi.fn(),
}))

// Mock Next.js navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: vi.fn(() => '/dashboard'),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('DashboardPage', () => {
  const mockApplications: Application[] = [
    {
      id: '1',
      user_id: 'user-123',
      company_name: 'Google',
      company_id: null,
      job_title: 'Software Engineer',
      job_url: 'https://google.com/jobs/1',
      location: 'Remote',
      salary_range: '$150k-$200k',
      status: 'applied',
      date_applied: '2025-10-01',
      notes: 'Great company',
      position: 1,
      custom_column_id: null,
      created_at: '2025-10-01T00:00:00Z',
      updated_at: '2025-10-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: 'user-123',
      company_name: 'Microsoft',
      company_id: null,
      job_title: 'Frontend Developer',
      job_url: 'https://microsoft.com/jobs/2',
      location: 'Seattle, WA',
      salary_range: '$140k-$180k',
      status: 'interviewing',
      date_applied: '2025-09-28',
      notes: 'Interview scheduled',
      position: 2,
      custom_column_id: null,
      created_at: '2025-09-28T00:00:00Z',
      updated_at: '2025-09-28T00:00:00Z',
    },
    {
      id: '3',
      user_id: 'user-123',
      company_name: 'Meta',
      company_id: null,
      job_title: 'Full Stack Engineer',
      job_url: null,
      location: 'Menlo Park, CA',
      salary_range: null,
      status: 'wishlist',
      date_applied: '2025-10-03',
      notes: null,
      position: 3,
      custom_column_id: null,
      created_at: '2025-10-03T00:00:00Z',
      updated_at: '2025-10-03T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    setupMatchMedia()
    mockPush.mockClear()
    vi.mocked(actions.getApplicationsWorkspaceDataAction).mockResolvedValue({
      applications: mockApplications,
      customColumns: [],
      user: {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' },
      } as any,
    })
    vi.mocked(actions.getApplicationsAction).mockResolvedValue(mockApplications)

    // Mock authenticated user
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
            },
          },
          error: null,
        }),
      },
    } as unknown as ReturnType<typeof createClient>)
  })

  describe('Rendering and Layout', () => {
    it('should render enhanced global empty state for new users (0 applications)', async () => {
      vi.mocked(actions.getApplicationsWorkspaceDataAction).mockResolvedValue({
        applications: [],
        customColumns: [],
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: { full_name: 'Test User' },
        } as any,
      })
      vi.mocked(actions.getApplicationsAction).mockResolvedValue([])

      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText(/start your job hunt journey/i)).toBeInTheDocument()
      })

      // Verify all empty state elements
      expect(screen.getByText(/your analytics dashboard is ready/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /go to applications/i })).toBeInTheDocument()
      expect(
        screen.getByText(/tip: start by adding jobs you're interested in/i)
      ).toBeInTheDocument()

      // Verify empty state icon
      const emptyStateContainer = screen.getByText(/start your job hunt journey/i).closest('div')
      expect(emptyStateContainer).toBeInTheDocument()
    })

    it('should render dashboard components when applications exist', async () => {
      renderWithTheme(<DashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Google')).toBeInTheDocument() // From RecentActivity
      })

      // Verify dashboard components render
      expect(screen.getByText(/Total Applications/i)).toBeInTheDocument() // From DashboardStats
      expect(screen.getByText(/Recently Updated Applications/i)).toBeInTheDocument() // From RecentActivity
    })

    it('should show loading state initially', async () => {
      vi.mocked(actions.getApplicationsWorkspaceDataAction).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )
      vi.mocked(actions.getApplicationsAction).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      await act(async () => {
        renderWithTheme(<DashboardPage />)
      })

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })
})
