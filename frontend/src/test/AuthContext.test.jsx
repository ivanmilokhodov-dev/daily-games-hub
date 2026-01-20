import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../context/AuthContext'
import api from '../services/api'

// Mock the API module
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  }
}))

// Test component that uses the auth context
function TestComponent() {
  const { user, isAuthenticated, login, logout, register } = useAuth()

  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="username">{user?.username || 'no-user'}</div>
      <button onClick={() => login('testuser', 'password')}>Login</button>
      <button onClick={() => register('newuser', 'new@test.com', 'password', 'New User')}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem.mockReturnValue(null)
  })

  it('should start with no authenticated user', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('username')).toHaveTextContent('no-user')
  })

  it('should login user successfully', async () => {
    const mockResponse = {
      data: {
        token: 'test-token',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        globalDayStreak: 5,
        averageRating: 1200
      }
    }
    api.post.mockResolvedValueOnce(mockResponse)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const loginButton = screen.getByText('Login')
    await userEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('username')).toHaveTextContent('testuser')
    })

    expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token')
  })

  it('should register user successfully', async () => {
    const mockResponse = {
      data: {
        token: 'new-token',
        username: 'newuser',
        email: 'new@test.com',
        displayName: 'New User',
        globalDayStreak: 0,
        averageRating: 1000
      }
    }
    api.post.mockResolvedValueOnce(mockResponse)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const registerButton = screen.getByText('Register')
    await userEvent.click(registerButton)

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('username')).toHaveTextContent('newuser')
    })
  })

  it('should logout user', async () => {
    // Start with logged in user
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'test-token'
      if (key === 'user') return JSON.stringify({ username: 'testuser' })
      return null
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Wait for initial state
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    })

    const logoutButton = screen.getByText('Logout')
    await userEvent.click(logoutButton)

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    })

    expect(localStorage.removeItem).toHaveBeenCalledWith('token')
    expect(localStorage.removeItem).toHaveBeenCalledWith('user')
  })

  it('should restore user from localStorage on mount', async () => {
    localStorage.getItem.mockImplementation((key) => {
      if (key === 'token') return 'stored-token'
      if (key === 'user') return JSON.stringify({
        username: 'storeduser',
        displayName: 'Stored User'
      })
      return null
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('username')).toHaveTextContent('storeduser')
    })
  })
})
