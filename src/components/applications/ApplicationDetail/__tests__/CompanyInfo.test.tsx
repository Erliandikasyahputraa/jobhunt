import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CompanyInfo } from '../components/MainPanel/CompanyInfo'
import {
  getCompaniesAction,
  getCompanyByIdAction,
  createCompanyAction,
  updateCompanyAction,
  linkCompanyAction,
  unlinkCompanyAction,
} from '@/app/dashboard/actions'
import type { Application, CompanyDB } from '@/lib/types/database.types'

vi.mock('@/app/dashboard/actions', () => ({
  getCompaniesAction: vi.fn(),
  getCompanyByIdAction: vi.fn(),
  createCompanyAction: vi.fn(),
  updateCompanyAction: vi.fn(),
  linkCompanyAction: vi.fn(),
  unlinkCompanyAction: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockApplication: Application = {
  id: 'app-1',
  user_id: 'user-1',
  company_name: 'Test Corp',
  company_id: null,
  job_title: 'Engineer',
  status: 'applied',
  position: 1,
  date_applied: '2026-08-26',
  created_at: '2026-08-26',
  updated_at: '2026-08-26',
  job_url: null,
  location: null,
  salary_range: null,
  notes: null,
  custom_column_id: null,
}

const mockCompany: CompanyDB = {
  id: 'comp-1',
  user_id: 'user-1',
  name: 'Test Corp Linked',
  website: 'https://test.com',
  industry: 'Tech',
  location: 'Remote',
  linkedin_url: null,
  github_url: null,
  overview: 'A test company',
  created_at: '2026-08-26',
  updated_at: '2026-08-26',
}

describe('CompanyInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "No company profile linked" when company_id is null', async () => {
    render(<CompanyInfo application={mockApplication} />)
    expect(await screen.findByText('No company profile linked')).toBeInTheDocument()
    expect(screen.getByText(/Test Corp/)).toBeInTheDocument()
  })

  it('fetches and displays company profile when company_id is present', async () => {
    const appWithCompany = { ...mockApplication, company_id: 'comp-1' }
    vi.mocked(getCompanyByIdAction).mockResolvedValueOnce(mockCompany)

    render(<CompanyInfo application={appWithCompany} />)

    expect(await screen.findByText('Test Corp Linked')).toBeInTheDocument()
    expect(screen.getByText('Tech')).toBeInTheDocument()
    expect(screen.getByText('Remote')).toBeInTheDocument()
    expect(getCompanyByIdAction).toHaveBeenCalledWith('comp-1')
  })

  it('shows create company form when Create button is clicked', async () => {
    render(<CompanyInfo application={mockApplication} />)

    const createBtn = await screen.findByText(/Create Company Profile/i)
    fireEvent.click(createBtn)

    expect(await screen.findByLabelText(/Company Name/i)).toBeInTheDocument()
    // It should pre-fill the name with application.company_name
    expect(screen.getByDisplayValue('Test Corp')).toBeInTheDocument()
  })

  it('submits create form and links company', async () => {
    render(<CompanyInfo application={mockApplication} />)

    // Click Create
    const createBtn = await screen.findByText(/Create Company Profile/i)
    fireEvent.click(createBtn)

    // Fill and submit
    vi.mocked(createCompanyAction).mockResolvedValueOnce(mockCompany)
    vi.mocked(linkCompanyAction).mockResolvedValueOnce()

    const saveBtn = await screen.findByText('Save')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(createCompanyAction).toHaveBeenCalled()
      expect(linkCompanyAction).toHaveBeenCalledWith('app-1', 'comp-1')
    })

    // Should now display the linked company
    expect(await screen.findByText('Test Corp Linked')).toBeInTheDocument()
  })

  it('shows link existing company list', async () => {
    render(<CompanyInfo application={mockApplication} />)

    vi.mocked(getCompaniesAction).mockResolvedValueOnce([mockCompany])

    const linkBtn = await screen.findByText(/Link Existing Company/i)
    fireEvent.click(linkBtn)

    expect(await screen.findByText(/Select Company/i)).toBeInTheDocument()
    expect(getCompaniesAction).toHaveBeenCalled()
  })

  it('unlinks company successfully and preserves company_name', async () => {
    const appWithCompany = { ...mockApplication, company_id: 'comp-1' }
    vi.mocked(getCompanyByIdAction).mockResolvedValueOnce(mockCompany)
    vi.mocked(unlinkCompanyAction).mockResolvedValueOnce()
    const { toast } = await import('sonner')

    render(<CompanyInfo application={appWithCompany} />)
    expect(await screen.findByText('Test Corp Linked')).toBeInTheDocument()

    const unlinkBtn = screen.getByRole('button', { name: /Unlink/i })
    fireEvent.click(unlinkBtn)

    await waitFor(() => {
      expect(unlinkCompanyAction).toHaveBeenCalledWith('app-1')
      // Original application company name is preserved on the application object contextually,
      // and it shows "No company profile linked" with the application's company_name.
      expect(screen.getByText(/Test Corp/)).toBeInTheDocument()
      expect(toast.success).toHaveBeenCalledWith('Company unlinked')
    })
  })

  it('shows edit company form and submits updates', async () => {
    const appWithCompany = { ...mockApplication, company_id: 'comp-1' }
    vi.mocked(getCompanyByIdAction).mockResolvedValueOnce(mockCompany)
    const { toast } = await import('sonner')

    render(<CompanyInfo application={appWithCompany} />)
    expect(await screen.findByText('Test Corp Linked')).toBeInTheDocument()

    const editBtn = screen.getByRole('button', { name: /Edit/i })
    fireEvent.click(editBtn)

    expect(await screen.findByLabelText(/Company Name/i)).toBeInTheDocument()

    const input = screen.getByLabelText(/Company Name/i)
    fireEvent.change(input, { target: { value: 'Updated Corp' } })

    vi.mocked(updateCompanyAction).mockResolvedValueOnce({ ...mockCompany, name: 'Updated Corp' })
    const saveBtn = screen.getByRole('button', { name: /Save/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(updateCompanyAction).toHaveBeenCalledWith(
        'comp-1',
        expect.objectContaining({ name: 'Updated Corp' })
      )
      expect(toast.success).toHaveBeenCalledWith('Company profile updated')
    })

    expect(await screen.findByText('Updated Corp')).toBeInTheDocument()
  })

  it('displays error toast on server action failure', async () => {
    render(<CompanyInfo application={mockApplication} />)
    const { toast } = await import('sonner')

    const createBtn = await screen.findByText(/Create Company Profile/i)
    fireEvent.click(createBtn)

    vi.mocked(createCompanyAction).mockRejectedValueOnce(new Error('Unauthorized access'))

    const saveBtn = await screen.findByText('Save')
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Unauthorized access')
    })
  })
})
