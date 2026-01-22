import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

function UserProfile() {
  const { t } = useTranslation()
  const { username } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedScore, setSelectedScore] = useState(null)
  const [filters, setFilters] = useState({ gameType: '', dateFrom: '', dateTo: '' })
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

  const getFilteredScores = () => {
    if (!profile?.recentScores) return []
    return profile.recentScores.filter(score => {
      if (filters.gameType && score.gameType !== filters.gameType) return false
      if (filters.dateFrom && score.gameDate < filters.dateFrom) return false
      if (filters.dateTo && score.gameDate > filters.dateTo) return false
      return true
    })
  }

  const getUniqueGameTypes = () => {
    if (!profile?.recentScores) return []
    const types = [...new Set(profile.recentScores.map(s => s.gameType))]
    return types.map(type => {
      const score = profile.recentScores.find(s => s.gameType === type)
      return { type, displayName: score?.gameDisplayName || type }
    })
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
            {profile.createdAt && (
              <p className="profile-joined" style={{ margin: '0.25rem 0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {t('profile.joined')} {new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
            <div className="profile-stats-inline">
              <span className="streak-badge active">
                {profile.globalDayStreak} {t('profile.dayStreak')}
              </span>
              <span className="rating-badge">
                {profile.averageRating} {t('profile.rating')}
              </span>
            </div>
          </div>
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
          {/* Rating History Graph */}
          {profile.ratingHistory && profile.ratingHistory.length >= 1 && (
            <div className="rating-graph" style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Rating History</div>
              <svg viewBox="0 0 400 95" className="rating-chart" style={{ height: '95px' }}>
                {(() => {
                  const data = profile.ratingHistory
                  if (data.length === 0) return null

                  const maxRating = Math.max(...data.map(d => d.rating))
                  const minRating = Math.min(...data.map(d => d.rating))
                  const range = maxRating - minRating || 100
                  const padding = range * 0.1
                  const chartTop = 12
                  const chartBottom = 68
                  const chartLeft = 35
                  const chartRight = 390
                  const gridRows = 4
                  const gridCols = 6

                  const formatDate = (dateStr) => new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

                  if (data.length === 1) {
                    const rating = data[0].rating
                    const dateStr = formatDate(data[0].date)
                    return (
                      <>
                        {/* Background grid */}
                        <rect x={chartLeft} y={chartTop} width={chartRight - chartLeft} height={chartBottom - chartTop} fill="var(--hover-background)" rx="4" />
                        {[...Array(gridRows + 1)].map((_, i) => (
                          <line key={`h${i}`} x1={chartLeft} y1={chartTop + (i * (chartBottom - chartTop) / gridRows)} x2={chartRight} y2={chartTop + (i * (chartBottom - chartTop) / gridRows)} stroke="var(--border-color)" strokeWidth="0.5" />
                        ))}
                        {[...Array(gridCols + 1)].map((_, i) => (
                          <line key={`v${i}`} x1={chartLeft + (i * (chartRight - chartLeft) / gridCols)} y1={chartTop} x2={chartLeft + (i * (chartRight - chartLeft) / gridCols)} y2={chartBottom} stroke="var(--border-color)" strokeWidth="0.5" />
                        ))}
                        <text x="5" y={(chartTop + chartBottom) / 2 + 3} fontSize="9" fill="var(--text-secondary)">{rating}</text>
                        <circle cx={(chartLeft + chartRight) / 2} cy={(chartTop + chartBottom) / 2} r="5" fill="var(--primary-color)">
                          <title>{data[0].date}: {rating}</title>
                        </circle>
                        <text x={(chartLeft + chartRight) / 2} y="88" fontSize="9" fill="var(--text-secondary)" textAnchor="middle">{dateStr}</text>
                      </>
                    )
                  }

                  const points = data.map((d, i) => {
                    const x = (i / (data.length - 1)) * (chartRight - chartLeft) + chartLeft
                    const y = chartBottom - ((d.rating - minRating + padding) / (range + padding * 2)) * (chartBottom - chartTop)
                    return `${x},${y}`
                  }).join(' ')

                  const firstDate = formatDate(data[0].date)
                  const lastDate = formatDate(data[data.length - 1].date)
                  const displayMax = Math.round(maxRating + padding)
                  const displayMin = Math.round(minRating - padding)

                  return (
                    <>
                      {/* Background with grid */}
                      <rect x={chartLeft} y={chartTop} width={chartRight - chartLeft} height={chartBottom - chartTop} fill="var(--hover-background)" rx="4" />
                      {/* Horizontal grid lines */}
                      {[...Array(gridRows + 1)].map((_, i) => (
                        <line key={`h${i}`} x1={chartLeft} y1={chartTop + (i * (chartBottom - chartTop) / gridRows)} x2={chartRight} y2={chartTop + (i * (chartBottom - chartTop) / gridRows)} stroke="var(--border-color)" strokeWidth="0.5" />
                      ))}
                      {/* Vertical grid lines */}
                      {[...Array(gridCols + 1)].map((_, i) => (
                        <line key={`v${i}`} x1={chartLeft + (i * (chartRight - chartLeft) / gridCols)} y1={chartTop} x2={chartLeft + (i * (chartRight - chartLeft) / gridCols)} y2={chartBottom} stroke="var(--border-color)" strokeWidth="0.5" />
                      ))}
                      {/* Y-axis labels */}
                      <text x="5" y={chartTop + 4} fontSize="9" fill="var(--text-secondary)">{displayMax}</text>
                      <text x="5" y={chartBottom + 3} fontSize="9" fill="var(--text-secondary)">{displayMin}</text>
                      {/* X-axis labels */}
                      <text x={chartLeft} y="88" fontSize="9" fill="var(--text-secondary)" textAnchor="start">{firstDate}</text>
                      <text x={chartRight} y="88" fontSize="9" fill="var(--text-secondary)" textAnchor="end">{lastDate}</text>
                      {/* Line chart */}
                      <polyline points={points} fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                      {data.map((d, i) => {
                        const x = (i / (data.length - 1)) * (chartRight - chartLeft) + chartLeft
                        const y = chartBottom - ((d.rating - minRating + padding) / (range + padding * 2)) * (chartBottom - chartTop)
                        return (
                          <circle key={i} cx={x} cy={y} r="3" fill="var(--primary-color)">
                            <title>{d.date}: {d.rating}</title>
                          </circle>
                        )
                      })}
                    </>
                  )
                })()}
              </svg>
            </div>
          )}
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

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('profile.recentGames')}</h2>
        </div>
        {profile.recentScores && profile.recentScores.length > 0 ? (
          <>
            {/* Filters */}
            <div className="game-history-filters">
              <select
                className="form-input filter-select"
                value={filters.gameType}
                onChange={(e) => { setFilters(f => ({ ...f, gameType: e.target.value })); setCurrentPage(1); }}
              >
                <option value="">All Games</option>
                {getUniqueGameTypes().map(g => (
                  <option key={g.type} value={g.type}>{g.displayName}</option>
                ))}
              </select>
              <input
                type="date"
                className="form-input filter-date"
                value={filters.dateFrom}
                onChange={(e) => { setFilters(f => ({ ...f, dateFrom: e.target.value })); setCurrentPage(1); }}
                placeholder="From"
              />
              <input
                type="date"
                className="form-input filter-date"
                value={filters.dateTo}
                onChange={(e) => { setFilters(f => ({ ...f, dateTo: e.target.value })); setCurrentPage(1); }}
                placeholder="To"
              />
              {(filters.gameType || filters.dateFrom || filters.dateTo) && (
                <button
                  className="btn btn-small btn-outline"
                  onClick={() => { setFilters({ gameType: '', dateFrom: '', dateTo: '' }); setCurrentPage(1); }}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="game-history-table">
              <div className="game-history-header">
                <div className="game-history-cell game-col">Game</div>
                <div className="game-history-cell date-col">Date</div>
                <div className="game-history-cell result-col">Result</div>
                <div className="game-history-cell rating-col">Rating</div>
              </div>
              {getFilteredScores()
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
            {Math.ceil(getFilteredScores().length / itemsPerPage) > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-small btn-outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {Math.ceil(getFilteredScores().length / itemsPerPage)}
                </span>
                <button
                  className="btn btn-small btn-outline"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(getFilteredScores().length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(getFilteredScores().length / itemsPerPage)}
                >
                  Next
                </button>
              </div>
            )}
            {getFilteredScores().length === 0 && (filters.gameType || filters.dateFrom || filters.dateTo) && (
              <div className="empty-state" style={{ padding: '1rem' }}>
                <p>No games match your filters</p>
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
