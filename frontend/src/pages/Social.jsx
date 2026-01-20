import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Social() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState('friends')

  // Friends state
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [friendsLoading, setFriendsLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [friendsTab, setFriendsTab] = useState('friends')

  // Groups state
  const [groups, setGroups] = useState([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [selectedGroupScores, setSelectedGroupScores] = useState({})

  const [error, setError] = useState('')

  useEffect(() => {
    fetchFriendsData()
    fetchGroups()
  }, [])

  // Friends functions
  const fetchFriendsData = async () => {
    try {
      setFriendsLoading(true)
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
      setFriendsLoading(false)
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
      fetchFriendsData()
    } catch (err) {
      setError(err.response?.data?.message || t('friends.requestError'))
    }
  }

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await api.post(`/api/friends/accept/${friendshipId}`)
      fetchFriendsData()
    } catch (err) {
      setError(err.response?.data?.message || t('friends.acceptError'))
    }
  }

  const handleDeclineRequest = async (friendshipId) => {
    try {
      await api.post(`/api/friends/decline/${friendshipId}`)
      fetchFriendsData()
    } catch (err) {
      setError(err.response?.data?.message || t('friends.declineError'))
    }
  }

  const handleRemoveFriend = async (friendId) => {
    if (!confirm(t('friends.confirmRemove'))) return
    try {
      await api.delete(`/api/friends/${friendId}`)
      fetchFriendsData()
    } catch (err) {
      setError(err.response?.data?.message || t('friends.removeError'))
    }
  }

  // Groups functions
  const fetchGroups = async () => {
    try {
      const response = await api.get('/api/groups')
      setGroups(response.data)
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setGroupsLoading(false)
    }
  }

  const fetchGroupScores = async (groupId) => {
    try {
      const response = await api.get(`/api/scores/group/${groupId}`)
      setSelectedGroupScores((prev) => ({ ...prev, [groupId]: response.data }))
    } catch (error) {
      console.error('Failed to fetch group scores:', error)
    }
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await api.post('/api/groups', { name: newGroupName })
      setGroups((prev) => [...prev, response.data])
      setShowCreateModal(false)
      setNewGroupName('')
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    }
  }

  const handleJoinGroup = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await api.post(`/api/groups/join/${inviteCode}`)
      setGroups((prev) => [...prev, response.data])
      setShowJoinModal(false)
      setInviteCode('')
    } catch (err) {
      setError(err.response?.data?.message || t('groups.invalidCode'))
    }
  }

  const handleLeaveGroup = async (groupId) => {
    if (!confirm(t('groups.confirmLeave'))) return

    try {
      await api.delete(`/api/groups/${groupId}/leave`)
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    }
  }

  const handleDeleteGroup = async (groupId) => {
    if (!confirm(t('groups.confirmDelete'))) return

    try {
      await api.delete(`/api/groups/${groupId}`)
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    }
  }

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code)
    alert(t('groups.copied'))
  }

  return (
    <div className="social-page">
      <div className="page-header">
        <h1>{t('social.title')}</h1>
        <p>{t('social.subtitle')}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Section Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab ${activeSection === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveSection('friends')}
        >
          {t('social.friends')} ({friends.length})
        </button>
        <button
          className={`tab ${activeSection === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveSection('groups')}
        >
          {t('social.groups')} ({groups.length})
        </button>
      </div>

      {/* Friends Section */}
      {activeSection === 'friends' && (
        <>
          {friendsLoading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
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
                    {searchResults.map(searchUser => (
                      <div key={searchUser.id} className="friend-item">
                        <Link to={`/profile/${searchUser.username}`} className="friend-info">
                          <div className="friend-avatar">
                            {(searchUser.displayName || searchUser.username).charAt(0).toUpperCase()}
                          </div>
                          <div className="friend-details">
                            <span className="friend-name">{searchUser.displayName || searchUser.username}</span>
                            <span className="friend-username">@{searchUser.username}</span>
                          </div>
                          <span className="streak-badge">{searchUser.globalDayStreak} days</span>
                        </Link>
                        <div className="friend-actions">
                          {searchUser.friendshipStatus === null && (
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => handleSendRequest(searchUser.id)}
                            >
                              {t('friends.addFriend')}
                            </button>
                          )}
                          {searchUser.friendshipStatus === 'SENT' && (
                            <span className="badge">{t('friends.requestSent')}</span>
                          )}
                          {searchUser.friendshipStatus === 'ACCEPTED' && (
                            <span className="badge badge-success">{t('friends.alreadyFriends')}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Friends Tabs */}
              <div className="tabs">
                <button
                  className={`tab ${friendsTab === 'friends' ? 'active' : ''}`}
                  onClick={() => setFriendsTab('friends')}
                >
                  {t('friends.myFriends')} ({friends.length})
                </button>
                <button
                  className={`tab ${friendsTab === 'pending' ? 'active' : ''}`}
                  onClick={() => setFriendsTab('pending')}
                >
                  {t('friends.pending')} ({pendingRequests.length})
                </button>
                <button
                  className={`tab ${friendsTab === 'sent' ? 'active' : ''}`}
                  onClick={() => setFriendsTab('sent')}
                >
                  {t('friends.sent')} ({sentRequests.length})
                </button>
              </div>

              {/* Friends List */}
              {friendsTab === 'friends' && (
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
              {friendsTab === 'pending' && (
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
              {friendsTab === 'sent' && (
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
            </>
          )}
        </>
      )}

      {/* Groups Section */}
      {activeSection === 'groups' && (
        <>
          {groupsLoading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  {t('groups.createGroup')}
                </button>
                <button className="btn btn-outline" onClick={() => setShowJoinModal(true)}>
                  {t('groups.joinGroup')}
                </button>
              </div>

              {groups.length > 0 ? (
                <div className="grid grid-2">
                  {groups.map((group) => (
                    <div key={group.id} className="group-card">
                      <div className="group-header">
                        <h3>{group.name}</h3>
                        <div className="invite-code">
                          {t('groups.inviteCode')}: {group.inviteCode}
                          <button
                            onClick={() => copyInviteCode(group.inviteCode)}
                            style={{
                              marginLeft: '0.5rem',
                              background: 'none',
                              border: 'none',
                              color: 'white',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            {t('groups.copy')}
                          </button>
                        </div>
                      </div>
                      <div className="group-members">
                        <div style={{ marginBottom: '0.5rem', fontWeight: '500' }}>
                          {t('groups.members')} ({group.members.length})
                        </div>
                        <div className="member-list">
                          {group.members.map((member) => (
                            <span
                              key={member.id}
                              className={`member-badge ${
                                member.username === group.ownerUsername ? 'owner' : ''
                              }`}
                            >
                              {member.displayName || member.username}
                              {member.username === group.ownerUsername && ` (${t('groups.owner')})`}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                        <button
                          className="btn btn-small btn-outline"
                          onClick={() => fetchGroupScores(group.id)}
                          style={{ marginRight: '0.5rem' }}
                        >
                          {t('groups.viewScores')}
                        </button>
                        {group.ownerUsername === user?.username ? (
                          <button
                            className="btn btn-small btn-danger"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            {t('common.delete')}
                          </button>
                        ) : (
                          <button
                            className="btn btn-small btn-secondary"
                            onClick={() => handleLeaveGroup(group.id)}
                          >
                            {t('groups.leave')}
                          </button>
                        )}
                      </div>
                      {selectedGroupScores[group.id] && (
                        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                          <h4 style={{ marginBottom: '0.5rem' }}>{t('groups.todaysScores')}</h4>
                          {selectedGroupScores[group.id].length > 0 ? (
                            selectedGroupScores[group.id].map((score) => (
                              <div key={score.id} className="leaderboard-item">
                                <div className="leaderboard-user">
                                  <div className="name">{score.displayName}</div>
                                  <div className="game">{score.gameDisplayName}</div>
                                </div>
                                <div className="leaderboard-score">
                                  {score.solved !== null && (
                                    <span
                                      style={{
                                        color: score.solved
                                          ? 'var(--success-color)'
                                          : 'var(--danger-color)'
                                      }}
                                    >
                                      {score.solved ? t('dashboard.solved') : t('dashboard.failed')}
                                    </span>
                                  )}
                                  {score.attempts && <span> ({score.attempts})</span>}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p style={{ color: 'var(--text-secondary)' }}>{t('groups.noScoresToday')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state card">
                  <h3>{t('groups.noGroups')}</h3>
                  <p>{t('groups.createFirst')}</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('groups.createNew')}</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateGroup}>
                <div className="form-group">
                  <label className="form-label" htmlFor="groupName">
                    {t('groups.groupName')}
                  </label>
                  <input
                    type="text"
                    id="groupName"
                    className="form-input"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    required
                    maxLength={50}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn btn-primary">
                    {t('common.create')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('groups.joinGroup')}</h2>
              <button className="modal-close" onClick={() => setShowJoinModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleJoinGroup}>
                <div className="form-group">
                  <label className="form-label" htmlFor="inviteCode">
                    {t('groups.inviteCode')}
                  </label>
                  <input
                    type="text"
                    id="inviteCode"
                    className="form-input"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder={t('groups.enterCode')}
                    required
                    maxLength={8}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn btn-primary">
                    {t('groups.join')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowJoinModal(false)}
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Social
