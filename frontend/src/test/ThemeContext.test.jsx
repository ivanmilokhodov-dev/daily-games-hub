import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme, themes } from '../context/ThemeContext'

// Test component that uses the theme context
function TestComponent() {
  const { theme, setTheme, toggleTheme, isDark } = useTheme()

  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="is-dark">{isDark ? 'dark' : 'light'}</div>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('ocean')}>Set Ocean</button>
      <button onClick={() => setTheme('forest')}>Set Forest</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.getItem.mockReturnValue(null)
    document.documentElement.removeAttribute('data-theme')
  })

  it('should start with light theme by default', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    expect(screen.getByTestId('is-dark')).toHaveTextContent('light')
  })

  it('should toggle between light and dark themes', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('light')

    const toggleButton = screen.getByText('Toggle Theme')
    await userEvent.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
      expect(screen.getByTestId('is-dark')).toHaveTextContent('dark')
    })

    await userEvent.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
    })
  })

  it('should set specific theme', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const oceanButton = screen.getByText('Set Ocean')
    await userEvent.click(oceanButton)

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('ocean')
      expect(screen.getByTestId('is-dark')).toHaveTextContent('dark')
    })
  })

  it('should persist theme to localStorage', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    const forestButton = screen.getByText('Set Forest')
    await userEvent.click(forestButton)

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'forest')
    })
  })

  it('should restore theme from localStorage', () => {
    localStorage.getItem.mockReturnValue('midnight')

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('current-theme')).toHaveTextContent('midnight')
    expect(screen.getByTestId('is-dark')).toHaveTextContent('dark')
  })

  it('should have correct themes defined', () => {
    expect(themes).toHaveLength(8)
    expect(themes.map(t => t.id)).toContain('light')
    expect(themes.map(t => t.id)).toContain('dark')
    expect(themes.map(t => t.id)).toContain('sky')
    expect(themes.map(t => t.id)).toContain('ocean')
    expect(themes.map(t => t.id)).toContain('forest')
    expect(themes.map(t => t.id)).toContain('emerald')
    expect(themes.map(t => t.id)).toContain('lavender')
    expect(themes.map(t => t.id)).toContain('midnight')
  })
})
