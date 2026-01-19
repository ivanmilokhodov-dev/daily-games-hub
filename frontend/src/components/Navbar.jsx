import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import LanguageSelector from './LanguageSelector'

function Navbar() {
  const { t } = useTranslation()
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          Daily Games Hub
        </Link>
        <div className="navbar-links">
          <NavLink to="/">{t('nav.home')}</NavLink>
          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard">{t('nav.dashboard')}</NavLink>
              <NavLink to="/submit">{t('nav.submitScore')}</NavLink>
              <NavLink to="/groups">{t('nav.groups')}</NavLink>
              <NavLink to="/leaderboard">{t('nav.leaderboard')}</NavLink>
              <span style={{ color: 'var(--text-secondary)' }}>
                {user?.displayName || user?.username}
              </span>
              <button className="btn btn-outline btn-small" onClick={handleLogout}>
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">{t('nav.login')}</NavLink>
              <Link to="/register" className="btn btn-primary btn-small">
                {t('nav.signup')}
              </Link>
            </>
          )}
          <LanguageSelector />
        </div>
      </div>
    </nav>
  )
}

export default Navbar
