import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

function ResetPassword() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (!token) {
      setValidating(false)
      return
    }

    const validateToken = async () => {
      try {
        const response = await api.get(`/api/auth/validate-reset-token?token=${token}`)
        setIsValidToken(response.data.valid)
      } catch (err) {
        setIsValidToken(false)
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: t('auth.passwordMismatch') })
      return
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: t('auth.passwordTooShort') })
      return
    }

    setLoading(true)

    try {
      await api.post('/api/auth/reset-password', { token, newPassword: password })
      setMessage({ type: 'success', text: t('settings.passwordChanged') })
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || t('settings.passwordChangeFailed') })
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!token || !isValidToken) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1>{t('common.error')}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Invalid or expired reset link
          </p>
          <Link to="/forgot-password" className="btn btn-primary">
            Request New Link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{t('settings.resetPassword')}</h1>

        {message.text && (
          <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              {t('settings.newPassword')}
            </label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              {t('settings.confirmNewPassword')}
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? t('common.loading') : t('settings.resetPassword')}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">{t('common.back')} {t('nav.login')}</Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
