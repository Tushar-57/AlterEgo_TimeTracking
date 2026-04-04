import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PreferencesEditor } from '../PreferencesEditor'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

const mockPreferences = {
  productivity: {
    work_hours: '09:00-17:00',
    break_preferences: 'pomodoro',
    priority_system: 'eisenhower',
    task_categories: ['work', 'personal', 'learning']
  },
  health: {
    exercise_goals: '30min daily',
    sleep_schedule: '23:00-07:00',
    dietary_preferences: [],
    health_metrics: ['sleep', 'exercise', 'mood']
  },
  finance: {
    budget_categories: ['food', 'transport', 'entertainment'],
    savings_goals: 1000,
    expense_tracking: 'weekly',
    currency: 'USD'
  },
  journal: {
    reflection_frequency: 'daily',
    check_in_time: '21:00',
    reflection_topics: ['gratitude', 'challenges', 'goals'],
    mood_tracking: true
  },
  llm_provider: {
    provider: 'openai',
    openai_model: 'gpt-4',
    ollama_model: 'llama2',
    fallback_enabled: true
  },
  general: {
    timezone: 'UTC',
    language: 'en',
    notification_preferences: {
      web: true,
      telegram: false
    }
  }
}

describe('PreferencesEditor', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    mockFetch.mockClear()
    mockOnClose.mockClear()
    mockOnSave.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('does not render when isOpen is false', () => {
    render(
      <PreferencesEditor
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    expect(screen.queryByText('Edit Preferences')).not.toBeInTheDocument()
  })

  it('renders when isOpen is true', () => {
    render(
      <PreferencesEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('Edit Preferences')).toBeInTheDocument()
    expect(screen.getByText('Customize your AI agent\'s understanding of your preferences')).toBeInTheDocument()
  })

  it('loads preferences on open', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPreferences)
    })

    render(
      <PreferencesEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/knowledge/preferences')
    })
  })

  it('shows loading state while fetching preferences', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(
      <PreferencesEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByText('Loading preferences...')).toBeInTheDocument()
  })

  it('allows switching between tabs', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPreferences)
    })

    render(
      <PreferencesEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Productivity Preferences')).toBeInTheDocument()
    })

    // Click on Health tab
    const healthTab = screen.getByRole('tab', { name: /health/i })
    fireEvent.click(healthTab)

    expect(screen.getByText('Health & Wellness Preferences')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPreferences)
    })

    render(
      <PreferencesEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('09:00-17:00')).toBeInTheDocument()
    })

    // Clear a required field
    const workHoursInput = screen.getByDisplayValue('09:00-17:00')
    fireEvent.change(workHoursInput, { target: { value: '' } })

    // Try to save
    const saveButton = screen.getByText('Save Preferences')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Work hours are required')).toBeInTheDocument()
    })
  })

  it('handles form submission successfully', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPreferences)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

    render(
      <PreferencesEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('09:00-17:00')).toBeInTheDocument()
    })

    // Make a change
    const workHoursInput = screen.getByDisplayValue('09:00-17:00')
    fireEvent.change(workHoursInput, { target: { value: '08:00-16:00' } })

    // Save
    const saveButton = screen.getByText('Save Preferences')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/knowledge/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('"work_hours":"08:00-16:00"')
      })
    })

    expect(mockOnSave).toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('handles array inputs correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPreferences)
    })

    render(
      <PreferencesEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    await waitFor(() => {
      expect(screen.getByDisplayValue('work, personal, learning')).toBeInTheDocument()
    })

    // Update task categories
    const taskCategoriesInput = screen.getByDisplayValue('work, personal, learning')
    fireEvent.change(taskCategoriesInput, { target: { value: 'work, personal, learning, fitness' } })

    // The input should update
    expect(screen.getByDisplayValue('work, personal, learning, fitness')).toBeInTheDocument()
  })

  it('handles switch toggles correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPreferences)
    })

    render(
      <PreferencesEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    // Navigate to journal tab
    await waitFor(() => {
      const journalTab = screen.getByRole('tab', { name: /journal/i })
      fireEvent.click(journalTab)
    })

    // Find and toggle mood tracking switch
    const moodTrackingSwitch = screen.getByRole('switch')
    expect(moodTrackingSwitch).toBeChecked()
    
    fireEvent.click(moodTrackingSwitch)
    expect(moodTrackingSwitch).not.toBeChecked()
  })

  it('closes when cancel button is clicked', async () => {
    render(
      <PreferencesEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('closes when X button is clicked', async () => {
    render(
      <PreferencesEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    const closeButton = screen.getByRole('button', { name: '' }) // X button has no text
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('disables save button when form is not dirty', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPreferences)
    })

    render(
      <PreferencesEditor
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    )

    await waitFor(() => {
      const saveButton = screen.getByText('Save Preferences')
      expect(saveButton).toBeDisabled()
    })
  })
})