import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useTheme, themes } from '../context/ThemeContext'
import api from '../services/api'

const languages = [
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'uk', name: 'Українська', flag: 'UA' }
]

// Version info - updated manually or via build process
const APP_VERSION = '1.4.0'

// Patch notes for current version
const PATCH_NOTES = [
  'Amsterdam timezone: Day resets at 00:00 Amsterdam time',
  'Dashboard: "Today\'s Progress" shows all games with checkmarks for completed ones',
  'Home page: "Popular Daily Games" shows "✓ Played" badge on games submitted today',
  'Profile: Shows all games with ratings (unplayed games display 1000 rating)',
  'Average rating now calculated across all 10 games (unplayed = 1000)',
  'Submit score: Shows time until next submission when duplicate detected',
  'Submit score: Game selector and fields visible after pasting result',
  'Submit score: Game detection works immediately on first paste',
  'Groups: Manual refresh button replaces auto-updating',
  'Groups: Users modal shows average rating for each member',
  'Settings: Display name limited to 15 characters',
  'Groups: Group names limited to 15 characters',
  'Fixed theme flash (white blink) on page reload'
]

function Settings() {
  const { t, i18n } = useTranslation()
  const { user, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    username: user?.username || ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })

  const [adminPassword, setAdminPassword] = useState('')
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' })
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' })
  const [adminMessage, setAdminMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState({ profile: false, password: false })

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileMessage({ type: '', text: '' })
    setLoading(prev => ({ ...prev, profile: true }))

    try {
      await api.put('/api/users/profile', {
        displayName: profileData.displayName,
        email: profileData.email
      })
      await refreshUser()
      setProfileMessage({ type: 'success', text: t('settings.profileUpdated') })
    } catch (err) {
      setProfileMessage({ type: 'error', text: t('settings.updateFailed') })
    } finally {
      setLoading(prev => ({ ...prev, profile: false }))
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordMessage({ type: '', text: '' })

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: t('auth.passwordMismatch') })
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: t('auth.passwordTooShort') })
      return
    }

    setLoading(prev => ({ ...prev, password: true }))

    try {
      await api.put('/api/users/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setPasswordMessage({ type: 'success', text: t('settings.passwordChanged') })
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
    } catch (err) {
      const message = err.response?.status === 401
        ? t('settings.incorrectPassword')
        : t('settings.passwordChangeFailed')
      setPasswordMessage({ type: 'error', text: message })
    } finally {
      setLoading(prev => ({ ...prev, password: false }))
    }
  }

  const handleAdminAccess = (e) => {
    e.preventDefault()
    setAdminMessage({ type: '', text: '' })

    if (adminPassword === 'password') {
      localStorage.setItem('adminAccess', 'true')
      navigate('/admin')
    } else {
      setAdminMessage({ type: 'error', text: t('settings.invalidAdminPassword') })
    }
  }

  const changeLanguage = (code) => {
    i18n.changeLanguage(code)
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>{t('settings.title')}</h1>
        <p>{t('settings.subtitle')}</p>
      </div>

      {/* Appearance Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>{t('settings.appearance')}</h2>

        {/* Theme Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">{t('settings.selectTheme')}</label>
          {/* Light themes row */}
          <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Light Themes</div>
          <div className="theme-grid" style={{ marginBottom: '1rem' }}>
            {themes.filter(t => !t.isDark).map((t) => (
              <button
                key={t.id}
                className={`theme-option ${theme === t.id ? 'active' : ''}`}
                onClick={() => setTheme(t.id)}
                data-theme-preview={t.id}
              >
                <div className="theme-preview">
                  <div className="theme-preview-header"></div>
                  <div className="theme-preview-content">
                    <div className="theme-preview-card"></div>
                    <div className="theme-preview-card"></div>
                  </div>
                </div>
                <span className="theme-name">{t.name}</span>
              </button>
            ))}
          </div>
          {/* Dark themes row */}
          <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Dark Themes</div>
          <div className="theme-grid">
            {themes.filter(t => t.isDark).map((t) => (
              <button
                key={t.id}
                className={`theme-option ${theme === t.id ? 'active' : ''}`}
                onClick={() => setTheme(t.id)}
                data-theme-preview={t.id}
              >
                <div className="theme-preview">
                  <div className="theme-preview-header"></div>
                  <div className="theme-preview-content">
                    <div className="theme-preview-card"></div>
                    <div className="theme-preview-card"></div>
                  </div>
                </div>
                <span className="theme-name">{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div>
          <label className="form-label">{t('language.select')}</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {languages.map(lang => (
              <button
                key={lang.code}
                className={`btn ${lang.code === i18n.language ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => changeLanguage(lang.code)}
              >
                {lang.flag} {lang.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>{t('settings.account')}</h2>

        {/* Edit Profile */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>{t('settings.editProfile')}</h3>
          {profileMessage.text && (
            <div className={profileMessage.type === 'success' ? 'success-message' : 'error-message'}>
              {profileMessage.text}
            </div>
          )}
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label className="form-label">{t('auth.username')}</label>
              <input
                type="text"
                className="form-input"
                value={profileData.username}
                disabled
                style={{ opacity: 0.6 }}
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Username cannot be changed
              </small>
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.displayName')}</label>
              <input
                type="text"
                name="displayName"
                className="form-input"
                value={profileData.displayName}
                onChange={handleProfileChange}
                maxLength={15}
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                Maximum 15 characters
              </small>
            </div>
            <div className="form-group">
              <label className="form-label">{t('auth.email')}</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={profileData.email}
                onChange={handleProfileChange}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading.profile}>
              {loading.profile ? t('common.loading') : t('settings.updateProfile')}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>{t('settings.changePassword')}</h3>
          {passwordMessage.text && (
            <div className={passwordMessage.type === 'success' ? 'success-message' : 'error-message'}>
              {passwordMessage.text}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">{t('settings.currentPassword')}</label>
              <input
                type="password"
                name="currentPassword"
                className="form-input"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settings.newPassword')}</label>
              <input
                type="password"
                name="newPassword"
                className="form-input"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settings.confirmNewPassword')}</label>
              <input
                type="password"
                name="confirmNewPassword"
                className="form-input"
                value={passwordData.confirmNewPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading.password}>
              {loading.password ? t('common.loading') : t('settings.changePassword')}
            </button>
          </form>
        </div>
      </div>

      {/* Admin Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>{t('settings.admin')}</h2>
        {adminMessage.text && (
          <div className="error-message">{adminMessage.text}</div>
        )}
        <form onSubmit={handleAdminAccess}>
          <div className="form-group">
            <label className="form-label">{t('settings.enterAdminPassword')}</label>
            <input
              type="password"
              className="form-input"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            {t('settings.accessAdmin')}
          </button>
        </form>
      </div>

      {/* Version Info */}
      <div className="version-info">
        <h4>Scordle v{APP_VERSION}</h4>
        <p style={{ marginBottom: '0.75rem' }}>What's new in this version:</p>
        <ul className="patch-notes-list">
          {PATCH_NOTES.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Settings
