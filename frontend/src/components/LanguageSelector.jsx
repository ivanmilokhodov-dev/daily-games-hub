import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const languages = [
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'uk', name: 'Українська', flag: 'UA' }
]

function LanguageSelector() {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0]

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const changeLanguage = (code) => {
    i18n.changeLanguage(code)
    setIsOpen(false)
  }

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        className="language-btn"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {currentLang.flag}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        </svg>
      </button>

      {isOpen && (
        <div className="language-dropdown">
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`language-option ${lang.code === i18n.language ? 'active' : ''}`}
              onClick={() => changeLanguage(lang.code)}
              type="button"
            >
              {lang.flag} {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageSelector
