import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'
import SubmitScore from '../pages/SubmitScore'
import { AuthProvider } from '../context/AuthContext'
import api from '../services/api'

vi.mock('../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  }
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderSubmitScore() {
  localStorage.getItem.mockImplementation((key) => {
    if (key === 'token') return 'test-token'
    if (key === 'user') return JSON.stringify({ username: 'testuser', displayName: 'Test' })
    return null
  })

  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <SubmitScore />
        </AuthProvider>
      </I18nextProvider>
    </BrowserRouter>
  )
}

describe('SubmitScore Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockResolvedValue({
      data: [
        { id: 'WORDLE', name: 'Wordle', description: 'Guess the word' },
        { id: 'CONNECTIONS', name: 'Connections', description: 'Group words' },
      ]
    })
  })

  it('should render submit score form', async () => {
    renderSubmitScore()

    await waitFor(() => {
      expect(screen.getByText(/submit score/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('should fetch and display games', async () => {
    renderSubmitScore()

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/games')
    })
  })

  it('should auto-detect Wordle game from pasted result', async () => {
    renderSubmitScore()

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    const textarea = screen.getByRole('textbox')
    await userEvent.type(textarea, 'Wordle 123 4/6\n⬛🟨⬛⬛⬛\n🟩🟩🟩🟩🟩')

    await waitFor(() => {
      expect(screen.getByText(/detected/i)).toBeInTheDocument()
    })
  })

  it('should submit score successfully', async () => {
    api.post.mockResolvedValueOnce({ data: { id: 1, gameType: 'WORDLE' } })
    api.get.mockImplementation((url) => {
      if (url === '/api/games') {
        return Promise.resolve({
          data: [{ id: 'WORDLE', name: 'Wordle', description: 'Guess the word' }]
        })
      }
      return Promise.resolve({ data: {} })
    })

    renderSubmitScore()

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    const textarea = screen.getByRole('textbox')
    await userEvent.type(textarea, 'Wordle 123 4/6')

    const select = screen.getByRole('combobox')
    await userEvent.selectOptions(select, 'WORDLE')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/scores', expect.objectContaining({
        gameType: 'WORDLE'
      }))
    })
  })

  it('should show error when submission fails', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: 'Already submitted' } }
    })

    renderSubmitScore()

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    const textarea = screen.getByRole('textbox')
    await userEvent.type(textarea, 'Wordle 123 4/6')

    const select = screen.getByRole('combobox')
    await userEvent.selectOptions(select, 'WORDLE')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/already submitted/i)).toBeInTheDocument()
    })
  })
})
