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
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef(null)
  const mobileMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setShowUserMenu(false)
    setShowMobileMenu(false)
    logout()
    navigate('/')
  }

  const closeMobileMenu = () => {
    setShowMobileMenu(false)
  }

  return (
    <nav className="navbar">
      <div className="container">
        {/* Mobile hamburger button - only visible on mobile when authenticated */}
        {isAuthenticated && (
          <div className="mobile-menu-container" ref={mobileMenuRef}>
            <button
              className="hamburger-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Menu"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>

            {showMobileMenu && (
              <div className="mobile-dropdown">
                <NavLink to="/" onClick={closeMobileMenu}>{t('nav.home')}</NavLink>
                <NavLink to="/dashboard" onClick={closeMobileMenu}>{t('nav.dashboard')}</NavLink>
                <NavLink to="/groups" onClick={closeMobileMenu}>{t('nav.groups')}</NavLink>
                <NavLink to="/submit" onClick={closeMobileMenu}>{t('nav.submitScore')}</NavLink>
                <div className="mobile-dropdown-divider" />
                <NavLink to="/settings" onClick={closeMobileMenu}>{t('nav.settings')}</NavLink>
                <button onClick={openGuide} className="mobile-dropdown-btn">{t('nav.help')}</button>
                <button onClick={toggleTheme} className="mobile-dropdown-btn">
                  {isDark ? '☀ Light Mode' : '☾ Dark Mode'}
                </button>
                <div className="mobile-dropdown-divider" />
                <button onClick={handleLogout} className="mobile-dropdown-btn logout-btn">
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        )}

        <Link to="/" className="navbar-brand">
          Scordle
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

        {/* Mobile profile button - visible on mobile when authenticated */}
        {isAuthenticated && (
          <div className="mobile-profile-container" ref={menuRef}>
            <button
              className="mobile-profile-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="user-streak">{user?.globalDayStreak || 0}</span>
            </button>

            {showUserMenu && (
              <div className="user-dropdown mobile-user-dropdown">
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
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
