import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function SubmitScore() {
  const { t } = useTranslation()
  const { refreshUser } = useAuth()
  const [games, setGames] = useState([])
  const [formData, setFormData] = useState({
    gameType: '',
    rawResult: '',
    attempts: '',
    solved: '',
    score: '',
    timeSeconds: ''
  })
  const [detectedGame, setDetectedGame] = useState(null)
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

  const detectGameAndParse = (rawResult) => {
    const result = rawResult.toLowerCase()
    const updates = {
      gameType: '',
      solved: '',
      attempts: '',
      score: '',
      timeSeconds: ''
    }

    // Wordle - 5-letter word game with colored squares
    if (result.includes('wordle') && (rawResult.includes('⬛') || rawResult.includes('🟨') || rawResult.includes('🟩') || rawResult.includes('⬜'))) {
      updates.gameType = 'WORDLE'
      const match = rawResult.match(/(\d+|X)\/6/)
      if (match) {
        const attempts = match[1]
        updates.solved = attempts !== 'X' ? 'true' : 'false'
        updates.attempts = attempts === 'X' ? '6' : attempts
      }
    }
    // Connections - has colored squares and "Connections"
    else if (result.includes('connections') || (rawResult.includes('🟨') && rawResult.includes('🟩') && rawResult.includes('🟦') && rawResult.includes('🟪'))) {
      updates.gameType = 'CONNECTIONS'
      // Count rows of emojis (each row is one guess)
      const emojiRows = rawResult.split('\n').filter(line =>
        line.includes('🟨') || line.includes('🟩') || line.includes('🟦') || line.includes('🟪')
      )
      updates.attempts = String(emojiRows.length)

      // Solved only if there are exactly 4 rows where each row has 4 squares of the SAME color
      let solvedCategories = 0
      emojiRows.forEach(row => {
        // Check if all 4 squares in the row are the same color
        const squares = [...row].filter(char =>
          char === '🟨' || char === '🟩' || char === '🟦' || char === '🟪'
        )
        if (squares.length === 4 && squares.every(s => s === squares[0])) {
          solvedCategories++
        }
      })
      updates.solved = String(solvedCategories === 4)
    }
    // Spotle - Spotify artist guessing
    else if (result.includes('spotle') || result.includes('#spotle')) {
      updates.gameType = 'SPOTLE'
      const match = rawResult.match(/(\d+)\/\d+/)
      if (match) {
        updates.attempts = match[1]
        updates.solved = 'true'
      }
      if (result.includes('x/') || result.includes('❌')) {
        updates.solved = 'false'
      }
    }
    // Bandle - song guessing from clips
    else if (result.includes('bandle') || result.includes('#bandle')) {
      updates.gameType = 'BANDLE'
      const match = rawResult.match(/(\d+)\/\d+/)
      if (match) {
        updates.attempts = match[1]
        updates.solved = 'true'
      }
      if (result.includes('x/') || result.includes('❌')) {
        updates.solved = 'false'
      }
    }
    // Travle - country path finding
    else if (result.includes('travle') || result.includes('#travle')) {
      updates.gameType = 'TRAVLE'
      // Look for +X pattern (extra guesses)
      const plusMatch = rawResult.match(/\+(\d+)/)
      if (plusMatch) {
        updates.attempts = plusMatch[1]
        updates.solved = 'true'
      }
      // Perfect score
      if (rawResult.includes('✅') || result.includes('perfect')) {
        updates.solved = 'true'
        updates.attempts = '0'
      }
      if (result.includes('❌') || result.includes('gave up')) {
        updates.solved = 'false'
      }
    }
    // Countryle - country guessing
    else if (result.includes('countryle') || result.includes('#countryle')) {
      updates.gameType = 'COUNTRYLE'
      const match = rawResult.match(/(\d+)\/\d+/)
      if (match) {
        updates.attempts = match[1]
        updates.solved = 'true'
      }
      // Count flag emojis or guess lines
      const lines = rawResult.split('\n').filter(line => line.trim().length > 0)
      if (!updates.attempts && lines.length > 1) {
        updates.attempts = String(lines.length - 1)
      }
      if (result.includes('❌') || result.includes('x/')) {
        updates.solved = 'false'
      } else if (!updates.solved) {
        updates.solved = 'true'
      }
    }
    // Worldle - country shape guessing
    else if (result.includes('worldle') || result.includes('#worldle')) {
      updates.gameType = 'WORLDLE'
      const match = rawResult.match(/(\d+)\/\d+/)
      if (match) {
        updates.attempts = match[1]
        updates.solved = 'true'
      }
      if (result.includes('x/') || result.includes('❌')) {
        updates.solved = 'false'
      }
    }
    // Minute Cryptic - cryptic crossword
    else if (result.includes('minute cryptic') || result.includes('minutecryptic')) {
      updates.gameType = 'MINUTE_CRYPTIC'
      // Look for time in format like "0:45" or "45s"
      const timeMatch = rawResult.match(/(\d+):(\d+)/) || rawResult.match(/(\d+)s/)
      if (timeMatch) {
        if (timeMatch[2]) {
          updates.timeSeconds = String(parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]))
        } else {
          updates.timeSeconds = timeMatch[1]
        }
        updates.solved = 'true'
      }
      if (result.includes('❌') || result.includes('fail')) {
        updates.solved = 'false'
      }
    }
    // Contexto - semantic word guessing
    else if (result.includes('contexto') || result.includes('#contexto')) {
      updates.gameType = 'CONTEXTO'
      // Pattern: "I played contexto #XXX and got it in YY guesses"
      const match = rawResult.match(/(\d+)\s*(guesses|guess|tentativas)/i)
      if (match) {
        updates.attempts = match[1]
        updates.solved = 'true'
      }
      if (result.includes('gave up') || result.includes('❌')) {
        updates.solved = 'false'
      }
    }
    // Semantle - word2vec word guessing
    else if (result.includes('semantle') || result.includes('#semantle')) {
      updates.gameType = 'SEMANTLE'
      const match = rawResult.match(/(\d+)\s*(guesses|guess)/i)
      if (match) {
        updates.attempts = match[1]
        updates.solved = 'true'
      }
      if (result.includes('gave up') || result.includes('❌')) {
        updates.solved = 'false'
      }
    }
    // Horse (enclose.horse) - territory game
    else if (result.includes('horse') || result.includes('enclose')) {
      updates.gameType = 'HORSE'
      // Look for score/percentage pattern
      const scoreMatch = rawResult.match(/(\d+)%/) || rawResult.match(/score[:\s]*(\d+)/i)
      if (scoreMatch) {
        updates.score = scoreMatch[1]
        updates.solved = 'true'
      }
    }

    return updates
  }

  const handleResultPaste = (e) => {
    const rawResult = e.target.value
    const detected = detectGameAndParse(rawResult)

    // Find the game name for display
    const gameInfo = games.find(g => g.id === detected.gameType)
    setDetectedGame(gameInfo?.name || null)

    setFormData((prev) => ({
      ...prev,
      rawResult,
      gameType: detected.gameType || prev.gameType,
      solved: detected.solved || prev.solved,
      attempts: detected.attempts || prev.attempts,
      score: detected.score || prev.score,
      timeSeconds: detected.timeSeconds || prev.timeSeconds
    }))
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
      await refreshUser()
      setTimeout(() => navigate('/dashboard'), 1500)
    } catch (err) {
      const errorData = err.response?.data
      let errorMessage = errorData?.message || t('submit.submitFailed')
      if (errorData?.errorCode) {
        errorMessage += ` (${errorData.errorCode})`
      }
      setError(errorMessage)
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
          {/* Paste Result - FIRST */}
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
              style={{ minHeight: '150px' }}
            />
            {detectedGame && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: 'var(--success-color)',
                color: 'white',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}>
                Detected: <strong>{detectedGame}</strong>
              </div>
            )}
          </div>

          {/* Game Selection */}
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
                min="0"
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
            className="btn btn-submit-score"
            disabled={loading || !formData.gameType}
          >
            {loading ? t('submit.submitting') : t('submit.submitScore')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SubmitScore
