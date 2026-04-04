import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { KnowledgeBaseViewer } from '../KnowledgeBaseViewer'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock data
const mockEntries = [
  {
    entry_id: '1',
    user_id: 'single_user',
    entry_type: 'preference',
    category: 'productivity',
    title: 'Work Schedule Preference',
    content: 'Prefers to work 9-5 with 25-minute focused sessions',
    metadata: { work_hours: '09:00-17:00', break_style: 'pomodoro' },
    tags: ['work', 'schedule', 'focus'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    entry_id: '2',
    user_id: 'single_user',
    entry_type: 'interaction',
    category: 'health',
    title: 'Exercise Goal Discussion',
    content: 'User wants to exercise 30 minutes daily, prefers morning workouts',
    metadata: { duration: 30, time_preference: 'morning' },
    tags: ['exercise', 'goals', 'routine'],
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
]

const mockPreferences = {
  user_id: 'single_user',
  productivity: {
    work_hours: '09:00-17:00',
    break_preferences: 'pomodoro',
    priority_system: 'eisenhower'
  },
  health: {
    exercise_goals: '30min daily',
    sleep_schedule: '23:00-07:00',
    dietary_preferences: ['vegetarian']
  }
}

const mockStats = {
  total_entries: 2,
  entries_by_type: {
    preference: 1,
    interaction: 1,
    pattern: 0,
    insight: 0
  },
  entries_by_category: {
    productivity: 1,
    health: 1
  },
  last_updated: '2024-01-02T00:00:00Z',
  embedding_model: 'text-embedding-ada-002'
}

describe('KnowledgeBaseViewer', () => {
  const mockOnEditPreferences = vi.fn()

  beforeEach(() => {
    mockFetch.mockClear()
    mockOnEditPreferences.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    render(<KnowledgeBaseViewer onEditPreferences={mockOnEditPreferences} />)
    
    expect(screen.getByText('Loading knowledge base...')).toBeInTheDocument()
  })

  it('renders knowledge base data successfully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEntries)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPreferences)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats)
      })

    render(<KnowledgeBaseViewer onEditPreferences={mockOnEditPreferences} />)

    await waitFor(() => {
      expect(screen.getByText('Knowledge Base')).toBeInTheDocument()
    })

    // Check stats are displayed
    expect(screen.getByText('2')).toBeInTheDocument() // Total entries
    expect(screen.getByText('Total Entries')).toBeInTheDocument()

    // Check entries are displayed
    expect(screen.getByText('Work Schedule Preference')).toBeInTheDocument()
    expect(screen.getByText('Exercise Goal Discussion')).toBeInTheDocument()
  })

  it('handles API errors gracefully with demo data', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'))

    render(<KnowledgeBaseViewer onEditPreferences={mockOnEditPreferences} />)

    await waitFor(() => {
      expect(screen.getByText('Knowledge Base')).toBeInTheDocument()
    })

    // Should show demo data
    expect(screen.getByText('Work Schedule Preference')).toBeInTheDocument()
  })

  it('filters entries by search query', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEntries)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPreferences)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats)
      })

    render(<KnowledgeBaseViewer onEditPreferences={mockOnEditPreferences} />)

    await waitFor(() => {
      expect(screen.getByText('Knowledge Base')).toBeInTheDocument()
    })

    // Search for "exercise"
    const searchInput = screen.getByPlaceholderText('Search entries, tags, or content...')
    fireEvent.change(searchInput, { target: { value: 'exercise' } })

    // Wait for filtering to take effect and check that only exercise entry is visible
    await waitFor(() => {
      expect(screen.getByText('Exercise Goal Discussion')).toBeInTheDocument()
      expect(screen.queryByText('Work Schedule Preference')).not.toBeInTheDocument()
    })
  })

  it('filters entries by category', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEntries)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPreferences)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats)
      })

    render(<KnowledgeBaseViewer onEditPreferences={mockOnEditPreferences} />)

    await waitFor(() => {
      expect(screen.getByText('Knowledge Base')).toBeInTheDocument()
    })

    // Filter by health category
    const categorySelect = screen.getByDisplayValue('All Categories')
    fireEvent.change(categorySelect, { target: { value: 'health' } })

    // Wait for filtering to take effect and check that only health entry is visible
    await waitFor(() => {
      expect(screen.getByText('Exercise Goal Discussion')).toBeInTheDocument()
      expect(screen.queryByText('Work Schedule Preference')).not.toBeInTheDocument()
    })
  })

  it('calls onEditPreferences when edit button is clicked', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEntries)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPreferences)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats)
      })

    render(<KnowledgeBaseViewer onEditPreferences={mockOnEditPreferences} />)

    await waitFor(() => {
      expect(screen.getByText('Knowledge Base')).toBeInTheDocument()
    })

    const editButton = screen.getByText('Edit Preferences')
    fireEvent.click(editButton)

    expect(mockOnEditPreferences).toHaveBeenCalledTimes(1)
  })

  it('shows empty state when no entries match filters', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]) // Empty entries
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPreferences)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockStats, total_entries: 0 })
      })

    render(<KnowledgeBaseViewer onEditPreferences={mockOnEditPreferences} />)

    await waitFor(() => {
      expect(screen.getByText('No entries found')).toBeInTheDocument()
    })

    expect(screen.getByText('Your knowledge base is empty. Start interacting with agents to build your knowledge base.')).toBeInTheDocument()
  })

  it('displays entry tags correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEntries)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPreferences)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats)
      })

    render(<KnowledgeBaseViewer onEditPreferences={mockOnEditPreferences} />)

    await waitFor(() => {
      expect(screen.getByText('Knowledge Base')).toBeInTheDocument()
    })

    // Check that tags are displayed
    expect(screen.getByText('work')).toBeInTheDocument()
    expect(screen.getByText('schedule')).toBeInTheDocument()
    expect(screen.getByText('focus')).toBeInTheDocument()
    expect(screen.getByText('exercise')).toBeInTheDocument()
    expect(screen.getByText('goals')).toBeInTheDocument()
    expect(screen.getByText('routine')).toBeInTheDocument()
  })
})