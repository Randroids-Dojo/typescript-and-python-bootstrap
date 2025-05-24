import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserProfile } from './UserProfile'
import { userApi } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  userApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn()
  }
}))

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads and displays user profile', async () => {
    vi.mocked(userApi.getProfile).mockResolvedValueOnce({
      data: {
        bio: 'Test bio',
        display_name: 'Test User'
      }
    })
    
    render(<UserProfile />)
    
    expect(screen.getByText('Loading profile...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument()
    })
  })

  it('displays default values when profile is empty', async () => {
    vi.mocked(userApi.getProfile).mockResolvedValueOnce({
      data: {
        bio: null,
        display_name: null
      }
    })
    
    render(<UserProfile />)
    
    await waitFor(() => {
      const nameInput = screen.getByLabelText('Display Name')
      const bioInput = screen.getByLabelText('Bio')
      expect(nameInput).toHaveValue('')
      expect(bioInput).toHaveValue('')
    })
  })

  it('updates profile on form submission', async () => {
    const user = userEvent.setup()
    vi.mocked(userApi.getProfile).mockResolvedValueOnce({
      data: {
        bio: 'Old bio',
        display_name: 'Old Name'
      }
    })
    vi.mocked(userApi.updateProfile).mockResolvedValueOnce({
      data: {
        bio: 'New bio',
        display_name: 'New Name'
      }
    })
    
    render(<UserProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Old bio')).toBeInTheDocument()
    })
    
    const nameInput = screen.getByLabelText('Display Name')
    const bioInput = screen.getByLabelText('Bio')
    
    await user.clear(nameInput)
    await user.type(nameInput, 'New Name')
    await user.clear(bioInput)
    await user.type(bioInput, 'New bio')
    
    const updateButton = screen.getByRole('button', { name: 'Save Profile' })
    await user.click(updateButton)
    
    await waitFor(() => {
      expect(userApi.updateProfile).toHaveBeenCalledWith({
        display_name: 'New Name',
        bio: 'New bio'
      })
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
    })
  })

  it('handles profile load error', async () => {
    vi.mocked(userApi.getProfile).mockRejectedValueOnce(new Error('Network error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<UserProfile />)
    
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Bio')).toHaveValue('')
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load profile:', expect.any(Error))
    consoleSpy.mockRestore()
  })

  it('handles profile update error', async () => {
    const user = userEvent.setup()
    vi.mocked(userApi.getProfile).mockResolvedValueOnce({
      data: {
        bio: 'Test bio',
        display_name: 'Test User'
      }
    })
    vi.mocked(userApi.updateProfile).mockRejectedValueOnce(new Error('Update failed'))
    
    render(<UserProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument()
    })
    
    const updateButton = screen.getByRole('button', { name: 'Save Profile' })
    await user.click(updateButton)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to update profile')).toBeInTheDocument()
    })
  })

  it('shows loading state during update', async () => {
    const user = userEvent.setup()
    vi.mocked(userApi.getProfile).mockResolvedValueOnce({
      data: {
        bio: 'Test bio',
        display_name: 'Test User'
      }
    })
    
    let resolveUpdate: any
    vi.mocked(userApi.updateProfile).mockImplementationOnce(
      () => new Promise(resolve => { resolveUpdate = resolve })
    )
    
    render(<UserProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument()
    })
    
    const updateButton = screen.getByRole('button', { name: 'Save Profile' })
    await user.click(updateButton)
    
    expect(updateButton).toBeDisabled()
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    
    resolveUpdate({ data: { bio: 'Test bio', display_name: 'Test User' } })
    
    await waitFor(() => {
      expect(updateButton).not.toBeDisabled()
      expect(screen.getByText('Save Profile')).toBeInTheDocument()
    })
  })

  it('clears error and success messages on new submission', async () => {
    const user = userEvent.setup()
    vi.mocked(userApi.getProfile).mockResolvedValueOnce({
      data: {
        bio: 'Test bio',
        display_name: 'Test User'
      }
    })
    vi.mocked(userApi.updateProfile)
      .mockRejectedValueOnce(new Error('First update failed'))
      .mockResolvedValueOnce({ data: { bio: 'Test bio', display_name: 'Test User' } })
    
    render(<UserProfile />)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument()
    })
    
    const updateButton = screen.getByRole('button', { name: 'Save Profile' })
    
    await user.click(updateButton)
    await waitFor(() => {
      expect(screen.getByText('Failed to update profile')).toBeInTheDocument()
    })
    
    await user.click(updateButton)
    await waitFor(() => {
      expect(screen.queryByText('Failed to update profile')).not.toBeInTheDocument()
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument()
    })
  })
})