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

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('profile.recentGames')}</h2>
        </div>
        {profile.recentScores && profile.recentScores.length > 0 ? (
          <div className="scores-list">
            {profile.recentScores.map(score => (
              <div key={score.id} className="score-item">
                <div className="score-game">
                  <span className="score-game-name">{score.gameDisplayName}</span>
                  <span className="score-date">{score.gameDate}</span>
                </div>
                <div className="score-result">
                  {score.solved ? (
                    <span className="badge badge-success">
                      {t('dashboard.solved')} {score.attempts && `(${score.attempts} ${t('dashboard.tries')})`}
                    </span>
                  ) : (
                    <span className="badge badge-danger">{t('dashboard.failed')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>{t('profile.noGames')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile
