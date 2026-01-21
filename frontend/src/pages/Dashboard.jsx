import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [scores, setScores] = useState([])
  const [streaks, setStreaks] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedScore, setSelectedScore] = useState(null)
  const itemsPerPage = 10

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [scoresRes, streaksRes] = await Promise.all([
        api.get('/api/scores/my'),
        api.get('/api/streaks/my')
      ])
      setScores(scoresRes.data)
      setStreaks(streaksRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const todayScores = scores.filter(
    (score) => score.gameDate === new Date().toISOString().split('T')[0]
  )

  // Pagination for recent activity
  const totalPages = Math.ceil(scores.length / itemsPerPage)
  const paginatedScores = scores.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t('dashboard.welcome', { name: user?.displayName || user?.username })}</h1>
        <p>{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">{t('dashboard.todaysGames')}</h2>
            <Link to="/submit" className="btn btn-primary btn-small">
              {t('nav.submitScore')}
            </Link>
          </div>
          {todayScores.length > 0 ? (
            <div>
              {todayScores.map((score) => (
                <div key={score.id} style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: '600' }}>{score.gameDisplayName}</div>
                  <div className="score-result">{score.rawResult}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>{t('dashboard.noGamesToday')}</h3>
              <p>{t('dashboard.submitFirst')}</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">{t('dashboard.yourStreaks')}</h2>
          </div>
          {streaks.length > 0 ? (
            <div className="grid grid-2">
              {streaks.map((streak) => (
                <div
                  key={streak.gameType}
                  className="streak-card"
                >
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                    {streak.gameDisplayName}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span
                      className={`streak-badge ${streak.currentStreak > 0 ? 'active' : ''}`}
                    >
                      {t('dashboard.current')}: {streak.currentStreak}
                    </span>
                    <span className="streak-badge">{t('dashboard.best')}: {streak.longestStreak}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>{t('dashboard.noStreaks')}</h3>
              <p>{t('dashboard.buildStreaks')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <h2 className="card-title">{t('dashboard.recentActivity')}</h2>
        </div>
        {scores.length > 0 ? (
          <>
            <div className="game-history-table">
              <div className="game-history-header">
                <div className="game-history-cell game-col">Game</div>
                <div className="game-history-cell date-col">Date</div>
                <div className="game-history-cell result-col">Result</div>
                <div className="game-history-cell rating-col">Rating</div>
              </div>
              {paginatedScores.map((score) => (
                <div
                  key={score.id}
                  className="game-history-row"
                  onClick={() => setSelectedScore(score)}
                  title="Click to view submitted score"
                >
                  <div className="game-history-cell game-col">
                    {score.gameDisplayName}
                  </div>
                  <div className="game-history-cell date-col">
                    {new Date(score.gameDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="game-history-cell result-col">
                    {score.gameType === 'HORSE' && score.score != null ? (
                      <span style={{ color: 'var(--success-color)', fontWeight: '600' }}>
                        {score.score}%
                      </span>
                    ) : (
                      <>
                        {score.solved !== null && (
                          <span style={{ color: score.solved ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: '600' }}>
                            {score.solved ? t('dashboard.solved') : t('dashboard.failed')}
                          </span>
                        )}
                        {score.attempts && <span style={{ color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>({score.attempts})</span>}
                      </>
                    )}
                  </div>
                  <div className="game-history-cell rating-col">
                    {score.ratingChange !== undefined && score.ratingChange !== null ? (
                      <span style={{ color: score.ratingChange >= 0 ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: '600' }}>
                        {score.ratingChange >= 0 ? '+' : ''}{score.ratingChange}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-small btn-outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn btn-small btn-outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <h3>{t('dashboard.noActivity')}</h3>
            <p>{t('dashboard.startPlaying')}</p>
          </div>
        )}
      </div>

      {/* Score Details Modal */}
      {selectedScore && (
        <div className="modal-overlay" onClick={() => setSelectedScore(null)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedScore.gameDisplayName}</h2>
              <button className="modal-close" onClick={() => setSelectedScore(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                {new Date(selectedScore.gameDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <div className="score-raw-display">
                {selectedScore.rawResult || 'No raw result available'}
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedScore(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
