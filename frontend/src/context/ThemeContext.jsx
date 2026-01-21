import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export const themes = [
  // Orange accent pair
  { id: 'light', name: 'Light', isDark: false, accent: 'orange' },
  { id: 'dark', name: 'Dark', isDark: true, accent: 'orange' },
  // Blue accent pair
  { id: 'sky', name: 'Sky', isDark: false, accent: 'blue' },
  { id: 'ocean', name: 'Ocean', isDark: true, accent: 'blue' },
  // Green accent pair
  { id: 'forest', name: 'Forest', isDark: false, accent: 'green' },
  { id: 'emerald', name: 'Emerald', isDark: true, accent: 'green' },
  // Purple accent pair
  { id: 'lavender', name: 'Lavender', isDark: false, accent: 'purple' },
  { id: 'midnight', name: 'Midnight', isDark: true, accent: 'purple' }
]

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme')
    return stored || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    const currentThemeData = themes.find(t => t.id === theme)
    if (currentThemeData?.isDark) {
      setTheme('light')
    } else {
      setTheme('dark')
    }
  }

  const setThemeById = (themeId) => {
    if (themes.find(t => t.id === themeId)) {
      setTheme(themeId)
    }
  }

  const currentThemeData = themes.find(t => t.id === theme) || themes[0]

  const value = {
    theme,
    setTheme: setThemeById,
    toggleTheme,
    isDark: currentThemeData.isDark,
    themes
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
