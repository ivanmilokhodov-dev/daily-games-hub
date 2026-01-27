import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

function ForgotPassword() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await api.post('/api/auth/forgot-password', { email })
      setMessage({ type: 'success', text: response.data.message || t('settings.resetLinkSent') })
      setEmail('')
    } catch (err) {
      const errorData = err.response?.data
      const status = err.response?.status

      if (status === 429) {
        // Rate limited
        setMessage({ type: 'error', text: errorData?.error || t('settings.tooManyRequests') })
      } else if (status === 500) {
        // Server error (email sending failed)
        setMessage({ type: 'error', text: errorData?.error || t('settings.resetLinkFailed') })
      } else {
        setMessage({ type: 'error', text: t('settings.resetLinkFailed') })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{t('settings.forgotPassword')}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
          {t('settings.enterEmail')}
        </p>

        {message.text && (
          <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              {t('auth.email')}
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? t('common.loading') : t('settings.sendResetLink')}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login">{t('common.back')} {t('nav.login')}</Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
