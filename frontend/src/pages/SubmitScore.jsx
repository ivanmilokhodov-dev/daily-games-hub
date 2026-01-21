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

      // Count mistakes (rows with mixed colors) and solved categories (rows with same color)
      let mistakes = 0
      let solvedCategories = 0
      emojiRows.forEach(row => {
        const squares = [...row].filter(char =>
          char === '🟨' || char === '🟩' || char === '🟦' || char === '🟪'
        )
        if (squares.length === 4 && squares.every(s => s === squares[0])) {
          solvedCategories++
        } else if (squares.length === 4) {
          mistakes++
        }
      })

      // attempts = number of mistakes (0-4), not total guesses
      updates.attempts = String(mistakes)
      // Solved if all 4 categories found (less than 4 mistakes)
      updates.solved = String(solvedCategories === 4)
    }
    // Spotle - Spotify artist guessing (10 guesses max)
    // Example: Spotle #1362🎧 ⬜️⬜️⬜️⬜️⬜️⬜️⬜️🟩 or ⬜⬜⬜⬜⬜⬜⬜⬜⬜❌
    else if (result.includes('spotle') || result.includes('#spotle')) {
      updates.gameType = 'SPOTLE'

      // Check for fail (❌) first
      if (rawResult.includes('❌') || result.includes('x/')) {
        updates.solved = 'false'
        updates.attempts = '10'
      } else if (rawResult.includes('🟩')) {
        updates.solved = 'true'
        // Count squares before green + 1 for the green square
        // Split by green to get the part before it
        const beforeGreen = rawResult.split('🟩')[0]
        // Remove variation selectors and count white squares
        const whiteSquares = beforeGreen.replace(/\uFE0F/g, '').match(/⬜|⬛/g) || []
        // Attempts = white squares + 1 (for the green)
        updates.attempts = String(whiteSquares.length + 1)
      }
    }
    // Bandle - song guessing from clips (6 guesses max)
    // Example: Bandle #1252 x/6 or Bandle #1252 5/6
    else if (result.includes('bandle') || result.includes('#bandle')) {
      updates.gameType = 'BANDLE'
      const match = rawResult.match(/(\d+|x)\/6/i)
      if (match) {
        const attempts = match[1].toLowerCase()
        if (attempts === 'x') {
          updates.solved = 'false'
          updates.attempts = '6'
        } else {
          updates.solved = 'true'
          updates.attempts = attempts
        }
      }
    }
    // Travle - country path finding
    // Example: #travle #1133 +2 (the +X is extra moves from perfect, 0 is perfect)
    else if (result.includes('travle') || result.includes('#travle')) {
      updates.gameType = 'TRAVLE'
      // Look for +X pattern (extra guesses from perfect)
      const plusMatch = rawResult.match(/\+(\d+)/)
      if (plusMatch) {
        updates.attempts = plusMatch[1]
        updates.solved = 'true'
      }
      // Perfect score (no +X means 0)
      if (rawResult.includes('✅') && !plusMatch) {
        updates.solved = 'true'
        updates.attempts = '0'
      }
      // Check for perfect with +0
      if (result.includes('(perfect)') || rawResult.match(/\+0\b/)) {
        updates.attempts = '0'
        updates.solved = 'true'
      }
      if (rawResult.includes('❌') || result.includes('gave up')) {
        updates.solved = 'false'
      }
    }
    // Countryle - country guessing
    // Example: #Countryle 1432 Guessed in 9 tries.
    else if (result.includes('countryle') || result.includes('#countryle')) {
      updates.gameType = 'COUNTRYLE'
      // Look for "Guessed in X tries"
      const guessMatch = rawResult.match(/guessed in (\d+) tries?/i)
      if (guessMatch) {
        updates.attempts = guessMatch[1]
        updates.solved = 'true'
      }
      // Also check X/6 format
      const ratioMatch = rawResult.match(/(\d+)\/\d+/)
      if (!updates.attempts && ratioMatch) {
        updates.attempts = ratioMatch[1]
        updates.solved = 'true'
      }
      if (result.includes('❌') || result.includes('x/')) {
        updates.solved = 'false'
      }
    }
    // Minute Cryptic - cryptic crossword clue
    // Example: 🏋 11 hints – 9 over the community par or 🏆 0 hints – perfect!
    else if (result.includes('minute cryptic') || result.includes('minutecryptic')) {
      updates.gameType = 'MINUTE_CRYPTIC'
      // Look for number of hints
      const hintMatch = rawResult.match(/(\d+)\s*hints?/i)
      if (hintMatch) {
        updates.attempts = hintMatch[1]
        updates.solved = 'true'
      }
      // If we see 🏆 or "0 hints", it's a perfect game
      if (rawResult.includes('🏆') || (hintMatch && hintMatch[1] === '0')) {
        updates.attempts = '0'
        updates.solved = 'true'
      }
      // All minute cryptic games are solved (you always get the answer eventually)
      if (!updates.solved) {
        updates.solved = 'true'
      }
    }
    // Contexto - semantic word guessing
    else if (result.includes('contexto') || result.includes('#contexto')) {
      updates.gameType = 'CONTEXTO'
      // Pattern: "I played contexto #XXX and got it in YY guesses"
      const guessMatch = rawResult.match(/(\d+)\s*(guesses|guess|tentativas)/i)
      const hintMatch = rawResult.match(/(\d+)\s*hints?/i)

      let totalAttempts = 0
      if (guessMatch) {
        totalAttempts += parseInt(guessMatch[1])
      }
      if (hintMatch) {
        // Each hint counts as 5 guesses
        totalAttempts += parseInt(hintMatch[1]) * 5
      }
      if (totalAttempts > 0) {
        updates.attempts = String(totalAttempts)
        updates.solved = 'true'
      }
      if (result.includes('gave up') || result.includes('❌')) {
        updates.solved = 'false'
      }
    }
    // Semantle - word2vec word guessing
    // Example: Semantle #1452 ✅ 21 Guesses 🥈 999/1000 💡 22 Hints
    else if (result.includes('semantle') || result.includes('#semantle')) {
      updates.gameType = 'SEMANTLE'
      const guessMatch = rawResult.match(/(\d+)\s*(guesses|guess)/i)
      const hintMatch = rawResult.match(/(\d+)\s*hints?/i)

      let totalAttempts = 0
      if (guessMatch) {
        totalAttempts += parseInt(guessMatch[1])
      }
      if (hintMatch) {
        // Each hint counts as 5 guesses
        totalAttempts += parseInt(hintMatch[1]) * 5
      }
      if (totalAttempts > 0) {
        updates.attempts = String(totalAttempts)
        updates.solved = 'true'
      }
      if (result.includes('gave up') || result.includes('❌')) {
        updates.solved = 'false'
      }
    }
    // Horse (enclose.horse) - territory game, percentage based, higher is better
    // Example: https://enclose.horse Day 22 💎 PERFECT! 💎 100%
    else if (result.includes('horse') || result.includes('enclose')) {
      updates.gameType = 'HORSE'
      // Look for percentage
      const scoreMatch = rawResult.match(/(\d+)%/)
      if (scoreMatch) {
        updates.score = scoreMatch[1]
        updates.solved = 'true' // Horse is always solved
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

      // Check for duplicate submission error
      if (errorMessage.includes('already submitted') || errorMessage.includes('already have a score')) {
        errorMessage = 'You can only submit one score per game per day. You have already submitted a score for this game today.'
      }

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
