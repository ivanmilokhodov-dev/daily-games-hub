import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function UserProfile() {
  const { t } = useTranslation()
  const { username } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [friendAction, setFriendAction] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedScore, setSelectedScore] = useState(null)
  const itemsPerPage = 10

  useEffect(() => {
    fetchProfile()
  }, [username])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/api/users/profile/${username}`)
      setProfile(response.data)
    } catch (err) {
      setError(t('profile.notFound'))
    } finally {
      setLoading(false)
    }
  }

  const handleAddFriend = async () => {
    try {
      setFriendAction(true)
      await api.post(`/api/friends/request/${profile.id}`)
      setProfile(prev => ({ ...prev, friendshipStatus: 'SENT' }))
    } catch (err) {
      setError(err.response?.data?.message || t('profile.friendRequestFailed'))
    } finally {
      setFriendAction(false)
    }
  }

  const handleAcceptFriend = async () => {
    try {
      setFriendAction(true)
      // Need to get friendship ID - fetch pending requests
      const pending = await api.get('/api/friends/requests/pending')
      const request = pending.data.find(r => r.friendId === profile.id)
      if (request) {
        await api.post(`/api/friends/accept/${request.id}`)
        setProfile(prev => ({ ...prev, friendshipStatus: 'ACCEPTED' }))
      }
    } catch (err) {
      setError(err.response?.data?.message || t('profile.acceptFailed'))
    } finally {
      setFriendAction(false)
    }
  }

  const handleRemoveFriend = async () => {
    if (!confirm(t('profile.confirmRemoveFriend'))) return
    try {
      setFriendAction(true)
      await api.delete(`/api/friends/${profile.id}`)
      setProfile(prev => ({ ...prev, friendshipStatus: null }))
    } catch (err) {
      setError(err.response?.data?.message || t('profile.removeFailed'))
    } finally {
      setFriendAction(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <div className="profile-header-content">
          <div className="profile-avatar">
            {(profile.displayName || profile.username).charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h1>{profile.displayName || profile.username}</h1>
            <p className="profile-username">@{profile.username}</p>
            <div className="profile-stats-inline">
              <span className="streak-badge active">
                {profile.globalDayStreak} {t('profile.dayStreak')}
              </span>
              <span className="rating-badge">
                {profile.averageRating} {t('profile.rating')}
              </span>
            </div>
          </div>
          {!profile.isOwnProfile && (
            <div className="profile-actions">
              {profile.friendshipStatus === null && (
                <button
                  className="btn btn-primary"
                  onClick={handleAddFriend}
                  disabled={friendAction}
                >
                  {t('profile.addFriend')}
                </button>
              )}
              {profile.friendshipStatus === 'SENT' && (
                <button className="btn btn-secondary" disabled>
                  {t('profile.requestSent')}
                </button>
              )}
              {profile.friendshipStatus === 'PENDING' && (
                <button
                  className="btn btn-primary"
                  onClick={handleAcceptFriend}
                  disabled={friendAction}
                >
                  {t('profile.acceptRequest')}
                </button>
              )}
              {profile.friendshipStatus === 'ACCEPTED' && (
                <>
                  <Link to={`/messages/${profile.id}`} className="btn btn-primary">
                    {t('profile.message')}
                  </Link>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={handleRemoveFriend}
                    disabled={friendAction}
                  >
                    {t('profile.removeFriend')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">{t('profile.stats')}</h2>
          </div>
          <div className="profile-stats-grid">
            <div className="stat-item">
              <div className="stat-value">{profile.totalGamesPlayed}</div>
              <div className="stat-label">{t('profile.gamesPlayed')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{profile.globalDayStreak}</div>
              <div className="stat-label">{t('profile.currentStreak')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{profile.longestGlobalStreak}</div>
              <div className="stat-label">{t('profile.longestStreak')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{profile.averageRating}</div>
              <div className="stat-label">{t('profile.avgRating')}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">{t('profile.gameRatings')}</h2>
          </div>
          {profile.ratings && profile.ratings.length > 0 ? (
            <div className="ratings-list">
              {profile.ratings.map(rating => (
                <div key={rating.gameType} className="rating-item">
                  <div className="rating-game">
                    <span className="rating-game-name">{rating.gameDisplayName}</span>
                    <span className="rating-games-count">
                      {rating.gamesPlayed} {t('profile.games')} ({rating.gamesWon} {t('profile.won')})
                    </span>
                  </div>
                  <div className="rating-value">{rating.rating}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>{t('profile.noRatings')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Rating History Graph */}
      {profile.ratingHistory && profile.ratingHistory.length > 1 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Average Rating History</h2>
          </div>
          <div className="rating-graph">
            <svg viewBox="0 0 400 120" className="rating-chart">
              {(() => {
                const data = profile.ratingHistory
                if (data.length < 2) return null
                const maxRating = Math.max(...data.map(d => d.rating))
                const minRating = Math.min(...data.map(d => d.rating))
                const range = maxRating - minRating || 100
                const padding = range * 0.15

                const points = data.map((d, i) => {
                  const x = (i / (data.length - 1)) * 370 + 25
                  const y = 100 - ((d.rating - minRating + padding) / (range + padding * 2)) * 80
                  return `${x},${y}`
                }).join(' ')

                return (
                  <>
                    {/* Grid lines */}
                    <line x1="25" y1="20" x2="395" y2="20" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4" />
                    <line x1="25" y1="60" x2="395" y2="60" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4" />
                    <line x1="25" y1="100" x2="395" y2="100" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4" />
                    {/* Rating labels */}
                    <text x="5" y="24" fontSize="9" fill="var(--text-secondary)">{maxRating}</text>
                    <text x="5" y="104" fontSize="9" fill="var(--text-secondary)">{minRating}</text>
                    {/* Line chart */}
                    <polyline
                      points={points}
                      fill="none"
                      stroke="var(--primary-color)"
                      strokeWidth="2.5"
                    />
                    {data.map((d, i) => {
                      const x = (i / (data.length - 1)) * 370 + 25
                      const y = 100 - ((d.rating - minRating + padding) / (range + padding * 2)) * 80
                      return (
                        <circle
                          key={i}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="var(--primary-color)"
                        >
                          <title>{d.date}: {d.rating}</title>
                        </circle>
                      )
                    })}
                  </>
                )
              })()}
            </svg>
            <div className="rating-graph-labels">
              <span>{profile.ratingHistory[0]?.date ? new Date(profile.ratingHistory[0].date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}</span>
              <span>Current: {profile.averageRating}</span>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('profile.recentGames')}</h2>
        </div>
        {profile.recentScores && profile.recentScores.length > 0 ? (
          <>
            <div className="game-history-table">
              <div className="game-history-header">
                <div className="game-history-cell game-col">Game</div>
                <div className="game-history-cell date-col">Date</div>
                <div className="game-history-cell result-col">Result</div>
                <div className="game-history-cell rating-col">Rating</div>
              </div>
              {profile.recentScores
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map(score => (
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
            {Math.ceil(profile.recentScores.length / itemsPerPage) > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-small btn-outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {Math.ceil(profile.recentScores.length / itemsPerPage)}
                </span>
                <button
                  className="btn btn-small btn-outline"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(profile.recentScores.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(profile.recentScores.length / itemsPerPage)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>{t('profile.noGames')}</p>
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

export default UserProfile
