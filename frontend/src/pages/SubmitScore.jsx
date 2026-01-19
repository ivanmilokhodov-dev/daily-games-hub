import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

function SubmitScore() {
  const { t } = useTranslation()
  const [games, setGames] = useState([])
  const [formData, setFormData] = useState({
    gameType: '',
    rawResult: '',
    attempts: '',
    solved: '',
    score: '',
    timeSeconds: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchGames()
  }, [])

  const fetchGames = async () => {
    try {
      const response = await api.get('/api/games')
      setGames(response.data)
    } catch (error) {
      console.error('Failed to fetch games:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const parseResult = (rawResult, gameType) => {
    const updates = {}

    if (gameType === 'WORDLE') {
      const match = rawResult.match(/Wordle\s+[\d,]+\s+(\d|X)\/6/)
      if (match) {
        const attempts = match[1]
        updates.solved = attempts !== 'X'
        updates.attempts = attempts === 'X' ? 6 : parseInt(attempts)
      }
    }

    if (gameType === 'CONNECTIONS') {
      const lines = rawResult.split('\n').filter((line) => line.trim())
      updates.solved = rawResult.includes('Puzzle') && !rawResult.includes('failed')
      updates.attempts = lines.length - 1
    }

    return updates
  }

  const handleResultPaste = (e) => {
    const rawResult = e.target.value
    setFormData((prev) => {
      const updates = parseResult(rawResult, prev.gameType)
      return {
        ...prev,
        rawResult,
        solved: updates.solved !== undefined ? String(updates.solved) : prev.solved,
        attempts: updates.attempts !== undefined ? String(updates.attempts) : prev.attempts
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const payload = {
        gameType: formData.gameType,
        rawResult: formData.rawResult,
        gameDate: new Date().toISOString().split('T')[0]
      }

      if (formData.attempts) payload.attempts = parseInt(formData.attempts)
      if (formData.solved) payload.solved = formData.solved === 'true'
      if (formData.score) payload.score = parseInt(formData.score)
      if (formData.timeSeconds) payload.timeSeconds = parseInt(formData.timeSeconds)

      await api.post('/api/scores', payload)
      setSuccess(t('submit.scoreSubmitted'))
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      setError(err.response?.data?.message || t('submit.submitFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>{t('submit.title')}</h1>
        <p>{t('submit.subtitle')}</p>
      </div>

      <div className="card">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="gameType">
              {t('submit.game')} *
            </label>
            <select
              id="gameType"
              name="gameType"
              className="form-select"
              value={formData.gameType}
              onChange={handleChange}
              required
            >
              <option value="">{t('submit.selectGame')}</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="rawResult">
              {t('submit.pasteResult')} *
            </label>
            <textarea
              id="rawResult"
              name="rawResult"
              className="form-textarea"
              value={formData.rawResult}
              onChange={handleResultPaste}
              placeholder={t('submit.pasteResultPlaceholder')}
              required
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="solved">
                {t('submit.solved')}
              </label>
              <select
                id="solved"
                name="solved"
                className="form-select"
                value={formData.solved}
                onChange={handleChange}
              >
                <option value="">{t('submit.notSure')}</option>
                <option value="true">{t('common.yes')}</option>
                <option value="false">{t('common.no')}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="attempts">
                {t('submit.attempts')}
              </label>
              <input
                type="number"
                id="attempts"
                name="attempts"
                className="form-input"
                value={formData.attempts}
                onChange={handleChange}
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="score">
                {t('submit.score')}
              </label>
              <input
                type="number"
                id="score"
                name="score"
                className="form-input"
                value={formData.score}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="timeSeconds">
                {t('submit.timeSeconds')}
              </label>
              <input
                type="number"
                id="timeSeconds"
                name="timeSeconds"
                className="form-input"
                value={formData.timeSeconds}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? t('submit.submitting') : t('submit.submitScore')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SubmitScore
