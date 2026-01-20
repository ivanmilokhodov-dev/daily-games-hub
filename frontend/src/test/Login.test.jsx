import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'
import Login from '../pages/Login'
import { AuthProvider } from '../context/AuthContext'
import api from '../services/api'

// Mock the API module
vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  }
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderLogin() {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </I18nextProvider>
    </BrowserRouter>
  )
}

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem.mockReturnValue(null)
  })

  it('should render login form', () => {
    renderLogin()

    expect(screen.getByRole('heading')).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('should show error on invalid credentials', async () => {
    api.post.mockRejectedValueOnce({
      response: { status: 401, data: { message: 'Invalid credentials' } }
    })

    renderLogin()

    await userEvent.type(screen.getByLabelText(/username/i), 'wronguser')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await userEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument()
    })
  })

  it('should navigate to dashboard on successful login', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        token: 'test-token',
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        globalDayStreak: 0,
        averageRating: 1000
      }
    })

    renderLogin()

    await userEvent.type(screen.getByLabelText(/username/i), 'testuser')
    await userEvent.type(screen.getByLabelText(/password/i), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should have link to register page', () => {
    renderLogin()

    const registerLink = screen.getByRole('link', { name: /sign up/i })
    expect(registerLink).toHaveAttribute('href', '/register')
  })

  it('should have link to forgot password page', () => {
    renderLogin()

    const forgotLink = screen.getByRole('link', { name: /forgot/i })
    expect(forgotLink).toHaveAttribute('href', '/forgot-password')
  })

  it('should disable submit button while loading', async () => {
    api.post.mockImplementation(() => new Promise(() => {})) // Never resolves

    renderLogin()

    await userEvent.type(screen.getByLabelText(/username/i), 'testuser')
    await userEvent.type(screen.getByLabelText(/password/i), 'password')
    await userEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })
})
