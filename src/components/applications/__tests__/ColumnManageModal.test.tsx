/**
 * Tests for Column Management Modal
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ColumnManageModal } from '../ColumnManageModal'
import { createCustomColumnAction } from '@/app/dashboard/actions'

vi.mock('@/app/dashboard/actions', () => ({
  createCustomColumnAction: vi.fn(),
  updateCustomColumnAction: vi.fn(),
  deleteCustomColumnAction: vi.fn(),
  reorderCustomColumnsAction: vi.fn(),
}))
// Mock the column icons
vi.mock('@/lib/utils/column-icons', () => ({
  DEFAULT_COLUMN_ICONS: ['📌', '⭐', '🔥'],
  getColumnIcon: () => '📋',
}))

describe('ColumnManageModal', () => {
  const mockOnClose = vi.fn()
  const mockOnCustomColumnsChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal when open', () => {
    render(
      <ColumnManageModal
        isOpen={true}
        onClose={mockOnClose}
        customColumns={[]}
        onCustomColumnsChange={mockOnCustomColumnsChange}
      />
    )

    expect(screen.getByText('Manage Columns')).toBeInTheDocument()
    expect(screen.getByText('Core Columns (Fixed)')).toBeInTheDocument()
    expect(screen.getByText('Custom Columns')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <ColumnManageModal
        isOpen={false}
        onClose={mockOnClose}
        customColumns={[]}
        onCustomColumnsChange={mockOnCustomColumnsChange}
      />
    )

    expect(screen.queryByText('Manage Columns')).not.toBeInTheDocument()
  })

  it('displays core columns', () => {
    render(
      <ColumnManageModal
        isOpen={true}
        onClose={mockOnClose}
        customColumns={[]}
        onCustomColumnsChange={mockOnCustomColumnsChange}
      />
    )

    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('Applied')).toBeInTheDocument()
    expect(screen.getByText('Wishlist and saved positions')).toBeInTheDocument()
  })

  it('shows add column form when Add Column button is clicked', () => {
    render(
      <ColumnManageModal
        isOpen={true}
        onClose={mockOnClose}
        customColumns={[]}
        onCustomColumnsChange={mockOnCustomColumnsChange}
      />
    )

    const addButton = screen.getByText('Add Column')
    fireEvent.click(addButton)

    expect(screen.getByPlaceholderText('Column name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Column description (optional)')).toBeInTheDocument()
  })

  it('creates new custom column when form is submitted', async () => {
    const mockCustomColumn = {
      id: 'custom_123',
      name: 'Test Column',
      description: 'Test description',
      icon: '📌',
      isCustom: true,
      order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    vi.mocked(createCustomColumnAction).mockResolvedValue(mockCustomColumn)

    render(
      <ColumnManageModal
        isOpen={true}
        onClose={mockOnClose}
        customColumns={[]}
        onCustomColumnsChange={mockOnCustomColumnsChange}
      />
    )

    // Open add form
    const addButton = screen.getByText('Add Column')
    fireEvent.click(addButton)

    // Fill form
    const nameInput = screen.getByPlaceholderText('Column name')
    const descriptionInput = screen.getByPlaceholderText('Column description (optional)')

    fireEvent.change(nameInput, { target: { value: 'Test Column' } })
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } })

    // Submit form
    const createButton = screen.getByText('Create Column')
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(createCustomColumnAction).toHaveBeenCalledWith({
        name: 'Test Column',
        description: 'Test description',
        icon: null,
        order: 0,
      })
    })

    expect(mockOnCustomColumnsChange).toHaveBeenCalled()
  })

  it('shows empty state when no custom columns exist', () => {
    render(
      <ColumnManageModal
        isOpen={true}
        onClose={mockOnClose}
        customColumns={[]}
        onCustomColumnsChange={mockOnCustomColumnsChange}
      />
    )

    expect(screen.getByText('No custom columns yet')).toBeInTheDocument()
    expect(
      screen.getByText('Add custom columns to track additional application stages')
    ).toBeInTheDocument()
  })

  it('calls onClose when Done button is clicked', () => {
    render(
      <ColumnManageModal
        isOpen={true}
        onClose={mockOnClose}
        customColumns={[]}
        onCustomColumnsChange={mockOnCustomColumnsChange}
      />
    )

    const doneButton = screen.getByText('Done')
    fireEvent.click(doneButton)

    expect(mockOnClose).toHaveBeenCalled()
  })
})
