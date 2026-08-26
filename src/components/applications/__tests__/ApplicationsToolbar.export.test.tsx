import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ApplicationsToolbar } from '../ApplicationsToolbar'

const defaultProps = {
  applications: [],
  filters: {
    statusFilters: [],
    customColumnFilters: [],
    dateRange: '30d' as const,
    sortOption: 'newest_applied' as const,
    searchQuery: '',
  },
  onSearchChange: vi.fn(),
  onFilterChange: vi.fn(),
  onSortChange: vi.fn(),
  onStatusFilterChange: vi.fn(),
  onCustomColumnFilterChange: vi.fn(),
  onDateRangeChange: vi.fn(),
  onClearFilters: vi.fn(),
  customColumns: [],
  onManageColumns: vi.fn(),
}

describe('ApplicationsToolbar Export UI', () => {
  it('renders Export CSV button by default', () => {
    render(<ApplicationsToolbar {...defaultProps} onExport={vi.fn()} />)
    const exportBtns = screen.getAllByText('Export CSV')
    expect(exportBtns.length).toBeGreaterThan(0)
    expect(exportBtns[0]).toBeInTheDocument()
    expect(exportBtns[0]).not.toBeDisabled()
  })

  it('calls onExport when clicked', () => {
    const onExportMock = vi.fn()
    render(<ApplicationsToolbar {...defaultProps} onExport={onExportMock} />)
    const exportBtn = screen.getAllByText('Export CSV')[0]
    fireEvent.click(exportBtn)
    expect(onExportMock).toHaveBeenCalledTimes(1)
  })

  it('renders Exporting... and disables button when isExporting is true', () => {
    const onExportMock = vi.fn()
    render(<ApplicationsToolbar {...defaultProps} onExport={onExportMock} isExporting={true} />)
    const exportBtns = screen.getAllByRole('button', { name: /Exporting\.\.\./i })
    expect(exportBtns.length).toBeGreaterThan(0)
    expect(exportBtns[0]).toBeInTheDocument()
    expect(exportBtns[0]).toBeDisabled()

    // Duplicate click
    fireEvent.click(exportBtns[0])
    expect(onExportMock).not.toHaveBeenCalled()
  })

  it('does not render export button if onExport is not provided', () => {
    render(<ApplicationsToolbar {...defaultProps} />)
    expect(screen.queryByText('Export CSV')).not.toBeInTheDocument()
    expect(screen.queryByText('Exporting...')).not.toBeInTheDocument()
  })
})
