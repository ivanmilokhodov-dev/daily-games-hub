import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useGuide } from '../context/GuideContext'

function Navbar() {
  const { t } = useTranslation()
  const { user, isAuthenticated, logout } = useAuth()
  const { toggleTheme, isDark } = useTheme()
  const { openGuide } = useGuide()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setShowUserMenu(false)
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          Scorle
        </Link>
        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <NavLink to="/">{t('nav.home')}</NavLink>
              <NavLink to="/dashboard">{t('nav.dashboard')}</NavLink>
              <NavLink to="/groups">{t('nav.groups')}</NavLink>
              <NavLink to="/submit" className="submit-score-link">{t('nav.submitScore')}</NavLink>
              <button
                className="help-btn"
                onClick={openGuide}
                title={t('nav.help')}
              >
                ?
              </button>
              <div className="user-menu-container" ref={menuRef}>
                <button
                  className="user-badge"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <span className="user-streak">{user?.globalDayStreak || 0}</span>
                  <span className="user-name">{user?.displayName || user?.username}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ marginLeft: '4px' }}>
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <Link
                      to={`/profile/${user?.username}`}
                      className="user-dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      {t('nav.profile')}
                    </Link>

                    <Link
                      to="/settings"
                      className="user-dropdown-item"
                      onClick={() => setShowUserMenu(false)}
                    >
                      {t('nav.settings')}
                    </Link>

                    <div className="user-dropdown-divider" />

                    <button
                      className="user-dropdown-item logout-item"
                      onClick={handleLogout}
                    >
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login">{t('nav.login')}</NavLink>
              <Link to="/register" className="btn btn-primary btn-small">
                {t('nav.signup')}
              </Link>
              <button
                className="help-btn"
                onClick={openGuide}
                title={t('nav.help')}
              >
                ?
              </button>
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                title={t('nav.toggleTheme')}
              >
                {isDark ? '☀' : '☾'}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
