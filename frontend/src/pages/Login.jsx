import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      const errorData = err.response?.data
      let errorMessage = errorData?.message || t('auth.invalidCredentials')
      if (errorData?.errorCode) {
        errorMessage += ` (${errorData.errorCode})`
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{t('auth.welcomeBack')}</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              {t('auth.username')}
            </label>
            <input
              type="text"
              id="username"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              {t('auth.password')}
            </label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? t('auth.signingIn') : t('nav.login')}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/forgot-password" style={{ display: 'block', marginBottom: '0.5rem' }}>
            {t('settings.forgotPassword')}
          </Link>
          {t('auth.noAccount')} <Link to="/register">{t('nav.signup')}</Link>
        </div>
      </div>
    </div>
  )
}

export default Login
