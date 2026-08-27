import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApplicationTimeline } from '../ApplicationDetail/components/RightPanel/ApplicationTimeline'
import { ApplicationDetail } from '../ApplicationDetail/ApplicationDetail'
import type {
  Application,
  ApplicationStatusHistoryDB,
  ApplicationDocumentDB,
  CustomColumnDB,
} from '@/lib/types/database.types'
import { getStatusLabel, getStatusCategory } from '@/lib/utils/status-colors'
import { getDashboardStats } from '@/lib/utils/dashboard'

vi.mock('@/app/dashboard/actions', () => ({
  getApplicationHistoryAction: vi.fn(),
}))

vi.mock('@/app/dashboard/actions/documents', () => ({
  getDocumentsByApplicationAction: vi.fn(),
}))

import { getApplicationHistoryAction } from '@/app/dashboard/actions'
import { getDocumentsByApplicationAction } from '@/app/dashboard/actions/documents'

const mockApplication: Application = {
  id: 'app-uuid-1',
  user_id: 'user-uuid-1',
  company_name: 'Stripe',
  company_id: null,
  job_title: 'Staff Engineer',
  job_url: 'https://stripe.com/jobs/1',
  location: 'Remote',
  salary_range: '$200k - $260k',
  status: 'phone_screen',
  date_applied: '2026-07-23',
  notes: null,
  position: 1,
  custom_column_id: null,
  created_at: '2026-08-26T14:32:00.000Z',
  updated_at: '2026-08-26T15:00:00.000Z',
}

const mockCustomColumns: CustomColumnDB[] = [
  {
    id: 'col-1',
    user_id: 'user-uuid-1',
    name: 'Interview Pipeline',
    description: null,
    icon: 'briefcase',
    order: 0,
    created_at: '2026-08-20T00:00:00Z',
    updated_at: '2026-08-20T00:00:00Z',
  },
  {
    id: 'col-2',
    user_id: 'user-uuid-1',
    name: 'Executive Review',
    description: null,
    icon: 'user-check',
    order: 1,
    created_at: '2026-08-20T00:00:00Z',
    updated_at: '2026-08-20T00:00:00Z',
  },
]

describe('Canonical Status Terminology', () => {
  it('maps phone_screen to "Phone Screen"', () => {
    expect(getStatusLabel('phone_screen')).toBe('Phone Screen')
  })

  it('maps assessment to "Assessment"', () => {
    expect(getStatusLabel('assessment')).toBe('Assessment')
  })

  it('maps take_home to "Take Home"', () => {
    expect(getStatusLabel('take_home')).toBe('Take Home')
  })

  it('maps interviewing to "Interview"', () => {
    expect(getStatusLabel('interviewing')).toBe('Interview')
  })

  it('maps final_round to "Final Round"', () => {
    expect(getStatusLabel('final_round')).toBe('Final Round')
  })

  it('preserves "Interviewing" as high-level analytics category for all interview sub-stages', () => {
    expect(getStatusCategory('phone_screen')).toBe('Interviewing')
    expect(getStatusCategory('assessment')).toBe('Interviewing')
    expect(getStatusCategory('take_home')).toBe('Interviewing')
    expect(getStatusCategory('interviewing')).toBe('Interviewing')
    expect(getStatusCategory('final_round')).toBe('Interviewing')
  })
})

describe('Dashboard KPI Interviews Aggregation', () => {
  it('increments interviews KPI for each interview sub-status', () => {
    const apps: Application[] = [
      { ...mockApplication, id: '1', status: 'phone_screen' },
      { ...mockApplication, id: '2', status: 'assessment' },
      { ...mockApplication, id: '3', status: 'take_home' },
      { ...mockApplication, id: '4', status: 'interviewing' },
      { ...mockApplication, id: '5', status: 'final_round' },
      { ...mockApplication, id: '6', status: 'applied' },
      { ...mockApplication, id: '7', status: 'offered' },
    ]

    const stats = getDashboardStats(apps)
    expect(stats.total).toBe(7)
    expect(stats.interviews).toBe(5) // All 5 interview stages counted!
    expect(stats.offers).toBe(1)
  })
})

describe('ApplicationTimeline Data and Ordering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getApplicationHistoryAction as any).mockResolvedValue([])
    ;(getDocumentsByApplicationAction as any).mockResolvedValue([])
  })

  it('uses applications.created_at for Application Created, not date_applied', async () => {
    render(<ApplicationTimeline application={mockApplication} />)

    await waitFor(() => {
      expect(screen.getByText('Application Created')).toBeInTheDocument()
    })

    // Should display August 2026 for creation date (from created_at: 2026-08-26)
    expect(screen.getByText(/Aug 26, 2026/i)).toBeInTheDocument()

    // date_applied should only appear as descriptive note "Applied on Jul 23, 2026", NOT as creation timestamp
    expect(screen.getByText(/Applied on Jul 23, 2026/i)).toBeInTheDocument()
  })

  it('renders real historical status transitions from application_status_history', async () => {
    const mockHistory: ApplicationStatusHistoryDB[] = [
      {
        id: 'hist-1',
        application_id: 'app-uuid-1',
        user_id: 'user-uuid-1',
        from_status: 'applied',
        to_status: 'phone_screen',
        from_custom_column_id: null,
        to_custom_column_id: null,
        created_at: '2026-08-27T09:15:00.000Z',
      },
    ]

    ;(getApplicationHistoryAction as any).mockResolvedValue(mockHistory)

    render(<ApplicationTimeline application={mockApplication} />)

    await waitFor(() => {
      expect(screen.getByText('Status Changed')).toBeInTheDocument()
    })

    expect(screen.getByText('Applied → Phone Screen')).toBeInTheDocument()
    expect(screen.getByText(/Aug 27, 2026/i)).toBeInTheDocument()
  })

  it('renders custom column movement events correctly', async () => {
    const mockHistory: ApplicationStatusHistoryDB[] = [
      {
        id: 'hist-col-1',
        application_id: 'app-uuid-1',
        user_id: 'user-uuid-1',
        from_status: 'phone_screen',
        to_status: 'phone_screen',
        from_custom_column_id: 'col-1',
        to_custom_column_id: 'col-2',
        created_at: '2026-08-27T11:00:00.000Z',
      },
    ]

    ;(getApplicationHistoryAction as any).mockResolvedValue(mockHistory)

    render(<ApplicationTimeline application={mockApplication} customColumns={mockCustomColumns} />)

    await waitFor(() => {
      expect(screen.getByText('Column Moved')).toBeInTheDocument()
    })

    expect(screen.getByText('Interview Pipeline → Executive Review')).toBeInTheDocument()
  })

  it('renders simultaneous status and custom column transition correctly', async () => {
    const mockHistory: ApplicationStatusHistoryDB[] = [
      {
        id: 'hist-comb-1',
        application_id: 'app-uuid-1',
        user_id: 'user-uuid-1',
        from_status: 'applied',
        to_status: 'interviewing',
        from_custom_column_id: 'col-1',
        to_custom_column_id: 'col-2',
        created_at: '2026-08-27T11:30:00.000Z',
      },
    ]

    ;(getApplicationHistoryAction as any).mockResolvedValue(mockHistory)

    render(<ApplicationTimeline application={mockApplication} customColumns={mockCustomColumns} />)

    await waitFor(() => {
      expect(screen.getByText('Status & Column Changed')).toBeInTheDocument()
    })

    expect(screen.getByText(/Applied → Interview/i)).toBeInTheDocument()
    expect(screen.getByText(/Interview Pipeline → Executive Review/i)).toBeInTheDocument()
  })

  it('reactively re-fetches history when application.status or updated_at changes without unmounting', async () => {
    ;(getApplicationHistoryAction as any).mockResolvedValueOnce([])

    const { rerender } = render(
      <ApplicationTimeline application={mockApplication} customColumns={mockCustomColumns} />
    )

    await waitFor(() => {
      expect(screen.getByText('Application Created')).toBeInTheDocument()
    })

    // Now simulate application update from drag-and-drop or edit form
    const updatedMockHistory: ApplicationStatusHistoryDB[] = [
      {
        id: 'hist-2',
        application_id: 'app-uuid-1',
        user_id: 'user-uuid-1',
        from_status: 'phone_screen',
        to_status: 'interviewing',
        from_custom_column_id: null,
        to_custom_column_id: null,
        created_at: '2026-08-27T12:00:00.000Z',
      },
    ]
    ;(getApplicationHistoryAction as any).mockResolvedValueOnce(updatedMockHistory)

    const updatedApp: Application = {
      ...mockApplication,
      status: 'interviewing',
      updated_at: '2026-08-27T12:00:00.000Z',
    }

    rerender(<ApplicationTimeline application={updatedApp} customColumns={mockCustomColumns} />)

    await waitFor(() => {
      expect(screen.getByText('Phone Screen → Interview')).toBeInTheDocument()
    })
  })

  it('renders document upload events alongside status changes ordered chronologically', async () => {
    const mockHistory: ApplicationStatusHistoryDB[] = [
      {
        id: 'hist-1',
        application_id: 'app-uuid-1',
        user_id: 'user-uuid-1',
        from_status: 'applied',
        to_status: 'interviewing',
        from_custom_column_id: null,
        to_custom_column_id: null,
        created_at: '2026-08-27T10:00:00.000Z',
      },
    ]

    const mockDocs: ApplicationDocumentDB[] = [
      {
        id: 'doc-1',
        application_id: 'app-uuid-1',
        user_id: 'user-uuid-1',
        name: 'resume_staff.pdf',
        document_type: 'resume',
        storage_path: 'user/app/resume.pdf',
        mime_type: 'application/pdf',
        size_bytes: 1024,
        created_at: '2026-08-27T08:00:00.000Z',
        updated_at: '2026-08-27T08:00:00.000Z',
      },
    ]

    ;(getApplicationHistoryAction as any).mockResolvedValue(mockHistory)
    ;(getDocumentsByApplicationAction as any).mockResolvedValue(mockDocs)

    render(<ApplicationTimeline application={mockApplication} />)

    await waitFor(() => {
      expect(screen.getByText('Status Changed')).toBeInTheDocument()
      expect(screen.getByText('Document Added')).toBeInTheDocument()
      expect(screen.getByText('Application Created')).toBeInTheDocument()
    })

    // Verify canonical status label in transition
    expect(screen.getByText('Applied → Interview')).toBeInTheDocument()
    expect(screen.getByText(/resume_staff\.pdf/i)).toBeInTheDocument()
  })
})

describe('Job Detail Distinct Status and Column Resolution', () => {
  it('TEST 1: resolves Status = Phone Screen and Column = Interview for phone_screen in standard column', () => {
    const app: Application = {
      ...mockApplication,
      status: 'phone_screen',
      custom_column_id: null,
    }

    render(
      <ApplicationDetail
        application={app}
        customColumns={mockCustomColumns}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
        isOpen={true}
      />
    )

    expect(screen.getByText('Phone Screen')).toBeInTheDocument()
    expect(screen.getByText('Column: Interview')).toBeInTheDocument()
  })

  it('TEST 2: resolves Status = Final Round and Column = Interview for final_round in standard column', () => {
    const app: Application = {
      ...mockApplication,
      status: 'final_round',
      custom_column_id: null,
    }

    render(
      <ApplicationDetail
        application={app}
        customColumns={mockCustomColumns}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
        isOpen={true}
      />
    )

    expect(screen.getByText('Final Round')).toBeInTheDocument()
    expect(screen.getByText('Column: Interview')).toBeInTheDocument()
  })

  it('TEST 3: resolves Status = Applied and Column = Applied for applied in standard column', () => {
    const app: Application = {
      ...mockApplication,
      status: 'applied',
      custom_column_id: null,
    }

    render(
      <ApplicationDetail
        application={app}
        customColumns={mockCustomColumns}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
        isOpen={true}
      />
    )

    expect(screen.getByText('Applied')).toBeInTheDocument()
    expect(screen.getByText('Column: Applied')).toBeInTheDocument()
  })

  it('TEST 4: resolves Status = Interview and Column = custom column name when custom_column_id is present', () => {
    const app: Application = {
      ...mockApplication,
      status: 'interviewing',
      custom_column_id: 'col-1',
    }

    render(
      <ApplicationDetail
        application={app}
        customColumns={mockCustomColumns}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onClose={vi.fn()}
        isOpen={true}
      />
    )

    expect(screen.getByText('Interview')).toBeInTheDocument()
    expect(screen.getByText('Column: Interview Pipeline')).toBeInTheDocument()
  })
})
