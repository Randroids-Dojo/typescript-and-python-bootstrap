import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GlobalCounter } from './GlobalCounter'
import { counterApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  counterApi: {
    getCounter: vi.fn(),
    incrementCounter: vi.fn()
  }
}))

describe('GlobalCounter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads and displays counter value', async () => {
    vi.mocked(counterApi.getCounter).mockResolvedValueOnce({ 
      data: { 
        count: 42,
        last_updated_by: null,
        last_updated_at: null
      } 
    })
    
    render(<GlobalCounter />)
    
    expect(screen.getByText('Loading counter...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument()
    })
  })

  it('increments counter on button click', async () => {
    const user = userEvent.setup()
    vi.mocked(counterApi.getCounter).mockResolvedValueOnce({ 
      data: { 
        count: 42,
        last_updated_by: null,
        last_updated_at: null
      } 
    })
    vi.mocked(counterApi.incrementCounter).mockResolvedValueOnce({ 
      data: { 
        count: 43,
        last_updated_by: 'testuser',
        last_updated_at: new Date().toISOString()
      } 
    })
    
    render(<GlobalCounter />)
    
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument()
    })
    
    const incrementButton = screen.getByRole('button', { name: 'Increment' })
    await user.click(incrementButton)
    
    await waitFor(() => {
      expect(counterApi.incrementCounter).toHaveBeenCalled()
      expect(screen.getByText('43')).toBeInTheDocument()
    })
  })

  it('handles loading error gracefully', async () => {
    vi.mocked(counterApi.getCounter).mockRejectedValueOnce(new Error('Network error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<GlobalCounter />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading counter...')).not.toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument()
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load counter:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('handles increment error gracefully', async () => {
    const user = userEvent.setup()
    vi.mocked(counterApi.getCounter).mockResolvedValueOnce({ 
      data: { 
        count: 42,
        last_updated_by: null,
        last_updated_at: null
      } 
    })
    vi.mocked(counterApi.incrementCounter).mockRejectedValueOnce(new Error('Network error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<GlobalCounter />)
    
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument()
    })
    
    const incrementButton = screen.getByRole('button', { name: 'Increment' })
    await user.click(incrementButton)
    
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(consoleSpy).toHaveBeenCalledWith('Failed to increment counter:', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })

  it('shows loading state during increment', async () => {
    const user = userEvent.setup()
    vi.mocked(counterApi.getCounter).mockResolvedValueOnce({ 
      data: { 
        count: 42,
        last_updated_by: null,
        last_updated_at: null
      } 
    })
    
    let resolveIncrement: any
    vi.mocked(counterApi.incrementCounter).mockImplementationOnce(
      () => new Promise(resolve => { resolveIncrement = resolve })
    )
    
    render(<GlobalCounter />)
    
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument()
    })
    
    const incrementButton = screen.getByRole('button', { name: 'Increment' })
    await user.click(incrementButton)
    
    expect(incrementButton).toBeDisabled()
    expect(screen.getByText('Incrementing...')).toBeInTheDocument()
    
    resolveIncrement({ 
      data: { 
        count: 43,
        last_updated_by: 'testuser',
        last_updated_at: new Date().toISOString()
      } 
    })
    
    await waitFor(() => {
      expect(incrementButton).not.toBeDisabled()
      expect(screen.getByText('Increment')).toBeInTheDocument()
      expect(screen.getByText('43')).toBeInTheDocument()
    })
  })

  it('displays last updated information', async () => {
    const lastUpdatedAt = new Date().toISOString()
    vi.mocked(counterApi.getCounter).mockResolvedValueOnce({ 
      data: { 
        count: 42,
        last_updated_by: 'testuser',
        last_updated_at: lastUpdatedAt
      } 
    })
    
    render(<GlobalCounter />)
    
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getByText(/Last updated by: testuser/)).toBeInTheDocument()
    })
  })
})