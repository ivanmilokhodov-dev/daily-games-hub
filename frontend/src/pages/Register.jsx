import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

function Register() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordTooShort'))
      return
    }

    setLoading(true)

    try {
      await register(
        formData.username,
        formData.email,
        formData.password,
        formData.displayName || formData.username
      )
      navigate('/dashboard')
    } catch (err) {
      const errorData = err.response?.data
      if (errorData?.details) {
        const messages = Object.values(errorData.details).join(', ')
        setError(messages)
      } else {
        setError(errorData?.message || t('auth.registrationFailed'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{t('auth.createAccount')}</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              {t('auth.username')} *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={20}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              {t('auth.email')} *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="displayName">
              {t('auth.displayName')}
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              className="form-input"
              value={formData.displayName}
              onChange={handleChange}
              placeholder={t('auth.displayNamePlaceholder')}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              {t('auth.password')} *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              {t('auth.confirmPassword')} *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
          </button>
        </form>

        <div className="auth-footer">
          {t('auth.haveAccount')} <Link to="/login">{t('nav.login')}</Link>
        </div>
      </div>
    </div>
  )
}

export default Register
