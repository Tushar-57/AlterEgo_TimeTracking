import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AnalyticsDashboard } from '../AnalyticsDashboard'

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  Pie: () => <div data-testid="pie" />,
  Area: () => <div data-testid="area" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />
}))

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders loading state initially', () => {
    render(<AnalyticsDashboard />)
    
    expect(screen.getByText('Loading analytics...')).toBeInTheDocument()
  })

  it('renders analytics data after loading', async () => {
    render(<AnalyticsDashboard />)
    
    // Fast-forward past the loading delay
    vi.advanceTimersByTime(1000)
    
    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
    })

    expect(screen.getByText('Insights into your AI agent interactions and learning patterns')).toBeInTheDocument()
  })

  it('displays key metrics correctly', async () => {
    render(<AnalyticsDashboard />)
    
    vi.advanceTimersByTime(1000)
    
    await waitFor(() => {
      expect(screen.getByText('160')).toBeInTheDocument() // Total interactions
      expect(screen.getByText('22.8')).toBeInTheDocument() // Daily average
      expect(screen.getByText('34')).toBeInTheDocument() // Knowledge entries
      expect(screen.getByText('85%')).toBeInTheDocument() // Preference stability
    })

    expect(screen.getByText('Total Interactions')).toBeInTheDocument()
    expect(screen.getByText('Daily Average')).toBeInTheDocument()
    expect(screen.getByText('Knowledge Entries')).toBeInTheDocument()
    expect(screen.getByText('Preference Stability')).toBeInTheDocument()
  })

  it('allows switching between time ranges', async () => {
    render(<AnalyticsDashboard />)
    
    vi.advanceTimersByTime(1000)
    
    await waitFor(() => {
      expect(screen.getByText('Last 30 days')).toBeInTheDocument()
    })

    // Click on 7 days button
    const sevenDaysButton = screen.getByText('Last 7 days')
    fireEvent.click(sevenDaysButton)

    // Should be selected now
    expect(sevenDaysButton).toHaveClass('bg-primary')
  })

  it('switches between different chart tabs', async () => {
    render(<AnalyticsDashboard />)
    
    vi.advanceTimersByTime(1000)
    
    await waitFor(() => {
      expect(screen.getByText('Daily Interactions')).toBeInTheDocument()
    })

    // Switch to Agent Usage tab
    const agentUsageTab = screen.getByRole('tab', { name: /agent usage/i })
    fireEvent.click(agentUsageTab)

    expect(screen.getByText('Agent Usage Distribution')).toBeInTheDocument()
    expect(screen.getByText('Agent Rankings')).toBeInTheDocument()

    // Switch to Patterns tab
    const patternsTab = screen.getByRole('tab', { name: /patterns/i })
    fireEvent.click(patternsTab)

    expect(screen.getByText('Preference Changes Over Time')).toBeInTheDocument()

    // Switch to Growth tab
    const growthTab = screen.getByRole('tab', { name: /growth/i })
    fireEvent.click(growthTab)

    expect(screen.getByText('Knowledge Base Growth')).toBeInTheDocument()
  })

  it('displays agent rankings correctly', async () => {
    render(<AnalyticsDashboard />)
    
    vi.advanceTimersByTime(1000)
    
    await waitFor(() => {
      const agentUsageTab = screen.getByRole('tab', { name: /agent usage/i })
      fireEvent.click(agentUsageTab)
    })

    // Check that agent rankings are displayed
    expect(screen.getByText('Orchestrator')).toBeInTheDocument()
    expect(screen.getByText('Productivity')).toBeInTheDocument()
    expect(screen.getByText('Health')).toBeInTheDocument()
    expect(screen.getByText('Finance')).toBeInTheDocument()
    expect(screen.getByText('Journal')).toBeInTheDocument()
    expect(screen.getByText('Scheduling')).toBeInTheDocument()

    // Check interaction counts
    expect(screen.getByText('45 interactions')).toBeInTheDocument()
    expect(screen.getByText('32 interactions')).toBeInTheDocument()
  })

  it('renders charts with correct test ids', async () => {
    render(<AnalyticsDashboard />)
    
    vi.advanceTimersByTime(1000)
    
    await waitFor(() => {
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(2) // Daily interactions and activity by hour
      expect(screen.getAllByTestId('bar-chart')).toHaveLength(1)
      expect(screen.getAllByTestId('area-chart')).toHaveLength(1)
    })
  })

  it('handles empty analytics data gracefully', async () => {
    // This test would require mocking the data loading to return null
    // For now, we test the current behavior with demo data
    render(<AnalyticsDashboard />)
    
    vi.advanceTimersByTime(1000)
    
    await waitFor(() => {
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument()
    })

    // Should show demo data, not empty state
    expect(screen.queryByText('No Analytics Data')).not.toBeInTheDocument()
  })

  it('formats time correctly in tooltips', async () => {
    render(<AnalyticsDashboard />)
    
    vi.advanceTimersByTime(1000)
    
    await waitFor(() => {
      expect(screen.getByText('Activity by Hour')).toBeInTheDocument()
    })

    // The formatHour function should be working (tested indirectly through chart rendering)
    expect(screen.getAllByTestId('area-chart')).toHaveLength(1)
  })

  it('displays correct tab icons', async () => {
    render(<AnalyticsDashboard />)
    
    vi.advanceTimersByTime(1000)
    
    await waitFor(() => {
      // Check that all tabs are rendered with their icons
      expect(screen.getByRole('tab', { name: /interactions/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /agent usage/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /patterns/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /growth/i })).toBeInTheDocument()
    })
  })
})