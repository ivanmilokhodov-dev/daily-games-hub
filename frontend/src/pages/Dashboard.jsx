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
          <div>
            {scores.slice(0, 10).map((score) => (
              <div key={score.id} className="leaderboard-item">
                <div className="leaderboard-user">
                  <div className="name">{score.gameDisplayName}</div>
                  <div className="game">{score.gameDate}</div>
                </div>
                <div className="leaderboard-score">
                  {score.solved !== null && (
                    <span style={{ color: score.solved ? 'var(--success-color)' : 'var(--danger-color)' }}>
                      {score.solved ? t('dashboard.solved') : t('dashboard.failed')}
                    </span>
                  )}
                  {score.attempts && <span> in {score.attempts} {t('dashboard.tries')}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>{t('dashboard.noActivity')}</h3>
            <p>{t('dashboard.startPlaying')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
