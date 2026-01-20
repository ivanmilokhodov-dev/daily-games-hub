import { createContext, useContext, useState, useEffect } from 'react'

const GuideContext = createContext(null)

export function GuideProvider({ children }) {
  const [showGuide, setShowGuide] = useState(false)
  const [hasSeenGuide, setHasSeenGuide] = useState(() => {
    return localStorage.getItem('hasSeenGuide') === 'true'
  })

  const openGuide = () => setShowGuide(true)

  const closeGuide = () => {
    setShowGuide(false)
    if (!hasSeenGuide) {
      localStorage.setItem('hasSeenGuide', 'true')
      setHasSeenGuide(true)
    }
  }

  const showGuideForNewUser = () => {
    if (!hasSeenGuide) {
      setShowGuide(true)
    }
  }

  const value = {
    showGuide,
    openGuide,
    closeGuide,
    hasSeenGuide,
    showGuideForNewUser
  }

  return (
    <GuideContext.Provider value={value}>
      {children}
    </GuideContext.Provider>
  )
}

export function useGuide() {
  const context = useContext(GuideContext)
  if (!context) {
    throw new Error('useGuide must be used within a GuideProvider')
  }
  return context
}
