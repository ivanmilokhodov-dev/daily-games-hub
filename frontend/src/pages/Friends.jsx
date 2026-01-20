import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

function Friends() {
  const { t } = useTranslation()
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [activeTab, setActiveTab] = useState('friends')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [friendsRes, pendingRes, sentRes] = await Promise.all([
        api.get('/api/friends'),
        api.get('/api/friends/requests/pending'),
        api.get('/api/friends/requests/sent')
      ])
      setFriends(friendsRes.data)
      setPendingRequests(pendingRes.data)
      setSentRequests(sentRes.data)
    } catch (err) {
      setError(t('friends.fetchError'))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    try {
      setSearching(true)
      const response = await api.get(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchResults(response.data)
    } catch (err) {
      setError(t('friends.searchError'))
    } finally {
      setSearching(false)
    }
  }

  const handleSendRequest = async (userId) => {
    try {
      await api.post(`/api/friends/request/${userId}`)
      setSearchResults(prev =>
        prev.map(u => u.id === userId ? { ...u, friendshipStatus: 'SENT' } : u)
      )
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || t('friends.requestError'))
    }
  }

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await api.post(`/api/friends/accept/${friendshipId}`)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || t('friends.acceptError'))
    }
  }

  const handleDeclineRequest = async (friendshipId) => {
    try {
      await api.post(`/api/friends/decline/${friendshipId}`)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || t('friends.declineError'))
    }
  }

  const handleRemoveFriend = async (friendId) => {
    if (!confirm(t('friends.confirmRemove'))) return
    try {
      await api.delete(`/api/friends/${friendId}`)
      fetchData()
    } catch (err) {
      setError(err.response?.data?.message || t('friends.removeError'))
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="friends-page">
      <div className="page-header">
        <h1>{t('friends.title')}</h1>
        <p>{t('friends.subtitle')}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Search Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{t('friends.findFriends')}</h2>
        </div>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            className="form-input"
            placeholder={t('friends.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={searching}>
            {searching ? t('common.loading') : t('friends.search')}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map(user => (
              <div key={user.id} className="friend-item">
                <Link to={`/profile/${user.username}`} className="friend-info">
                  <div className="friend-avatar">
                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="friend-details">
                    <span className="friend-name">{user.displayName || user.username}</span>
                    <span className="friend-username">@{user.username}</span>
                  </div>
                  <span className="streak-badge">{user.globalDayStreak} days</span>
                </Link>
                <div className="friend-actions">
                  {user.friendshipStatus === null && (
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => handleSendRequest(user.id)}
                    >
                      {t('friends.addFriend')}
                    </button>
                  )}
                  {user.friendshipStatus === 'SENT' && (
                    <span className="badge">{t('friends.requestSent')}</span>
                  )}
                  {user.friendshipStatus === 'ACCEPTED' && (
                    <span className="badge badge-success">{t('friends.alreadyFriends')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          {t('friends.myFriends')} ({friends.length})
        </button>
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          {t('friends.pending')} ({pendingRequests.length})
        </button>
        <button
          className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          {t('friends.sent')} ({sentRequests.length})
        </button>
      </div>

      {/* Friends List */}
      {activeTab === 'friends' && (
        <div className="friends-list">
          {friends.length > 0 ? (
            friends.map(friend => (
              <div key={friend.id} className="friend-card">
                <Link to={`/profile/${friend.username}`} className="friend-info">
                  <div className="friend-avatar">
                    {(friend.displayName || friend.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="friend-details">
                    <span className="friend-name">{friend.displayName || friend.username}</span>
                    <span className="friend-username">@{friend.username}</span>
                  </div>
                  <div className="friend-stats">
                    <span className="streak-badge active">{friend.globalDayStreak} days</span>
                    <span className="rating-badge">{friend.averageRating} pts</span>
                  </div>
                </Link>
                <div className="friend-actions">
                  <Link to={`/messages/${friend.friendId}`} className="btn btn-primary btn-small">
                    {t('friends.message')}
                  </Link>
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleRemoveFriend(friend.friendId)}
                  >
                    {t('friends.remove')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <h3>{t('friends.noFriends')}</h3>
              <p>{t('friends.searchToAdd')}</p>
            </div>
          )}
        </div>
      )}

      {/* Pending Requests */}
      {activeTab === 'pending' && (
        <div className="friends-list">
          {pendingRequests.length > 0 ? (
            pendingRequests.map(request => (
              <div key={request.id} className="friend-card">
                <Link to={`/profile/${request.username}`} className="friend-info">
                  <div className="friend-avatar">
                    {(request.displayName || request.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="friend-details">
                    <span className="friend-name">{request.displayName || request.username}</span>
                    <span className="friend-username">@{request.username}</span>
                  </div>
                </Link>
                <div className="friend-actions">
                  <button
                    className="btn btn-primary btn-small"
                    onClick={() => handleAcceptRequest(request.id)}
                  >
                    {t('friends.accept')}
                  </button>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => handleDeclineRequest(request.id)}
                  >
                    {t('friends.decline')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>{t('friends.noPending')}</p>
            </div>
          )}
        </div>
      )}

      {/* Sent Requests */}
      {activeTab === 'sent' && (
        <div className="friends-list">
          {sentRequests.length > 0 ? (
            sentRequests.map(request => (
              <div key={request.id} className="friend-card">
                <Link to={`/profile/${request.username}`} className="friend-info">
                  <div className="friend-avatar">
                    {(request.displayName || request.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="friend-details">
                    <span className="friend-name">{request.displayName || request.username}</span>
                    <span className="friend-username">@{request.username}</span>
                  </div>
                </Link>
                <span className="badge">{t('friends.awaitingResponse')}</span>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>{t('friends.noSent')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Friends
