import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Groups() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showManageModal, setShowManageModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [groupScores, setGroupScores] = useState([])
  const [scoresLoading, setScoresLoading] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [renameValue, setRenameValue] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [currentInviteCode, setCurrentInviteCode] = useState('')
  const [selectedScore, setSelectedScore] = useState(null)
  const [showMembers, setShowMembers] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [error, setError] = useState('')

  const fetchGroups = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const response = await api.get('/api/groups')
      setGroups(response.data || [])
      // Update selected group if it exists
      if (selectedGroup) {
        const updated = response.data?.find(g => g.id === selectedGroup.id)
        if (updated) setSelectedGroup(updated)
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error)
      if (!silent) setGroups([])
    } finally {
      if (!silent) setLoading(false)
    }
  }, [selectedGroup])

  const fetchGroupScores = useCallback(async (groupId, date, silent = false) => {
    try {
      if (!silent) setScoresLoading(true)
      const response = await api.get(`/api/scores/group/${groupId}?date=${date}`)
      setGroupScores(response.data || [])
    } catch (error) {
      console.error('Failed to fetch group scores:', error)
      if (!silent) setGroupScores([])
    } finally {
      if (!silent) setScoresLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupScores(selectedGroup.id, selectedDate)
    }
  }, [selectedGroup, selectedDate])

  // Polling - update every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGroups(true)
      if (selectedGroup) {
        fetchGroupScores(selectedGroup.id, selectedDate, true)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchGroups, fetchGroupScores, selectedGroup, selectedDate])

  const getBestScoresPerGame = () => {
    const gameScores = {}
    groupScores.forEach(score => {
      const gameType = score.gameType
      if (!gameScores[gameType]) {
        gameScores[gameType] = { gameName: score.gameDisplayName, scores: [], gameType }
      }
      gameScores[gameType].scores.push(score)
    })
    Object.values(gameScores).forEach(game => {
      game.scores.sort((a, b) => {
        // Special sorting for Horse game - sort by score (higher is better)
        if (game.gameType === 'HORSE') {
          if (a.score !== null && b.score !== null) return b.score - a.score
          if (a.score !== null) return -1
          if (b.score !== null) return 1
          return 0
        }
        // For other games
        if (a.solved !== b.solved) return a.solved ? -1 : 1
        if (a.attempts && b.attempts) return a.attempts - b.attempts
        if (a.score && b.score) return b.score - a.score
        return 0
      })
    })
    return gameScores
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    setError('')
    setActionLoading(true)
    try {
      await api.post('/api/groups', { name: newGroupName })
      await fetchGroups()
      setShowCreateModal(false)
      setNewGroupName('')
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleJoinGroup = async (e) => {
    e.preventDefault()
    setError('')
    setActionLoading(true)
    try {
      await api.post(`/api/groups/join/${inviteCode}`)
      await fetchGroups()
      setShowJoinModal(false)
      setInviteCode('')
    } catch (err) {
      setError(err.response?.data?.message || t('groups.invalidCode'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleLeaveGroup = async (groupId) => {
    if (!confirm(t('groups.confirmLeave'))) return
    setActionLoading(true)
    try {
      await api.delete(`/api/groups/${groupId}/leave`)
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
      if (selectedGroup?.id === groupId) setSelectedGroup(null)
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteGroup = async (groupId) => {
    if (!confirm(t('groups.confirmDelete'))) return
    setActionLoading(true)
    try {
      await api.delete(`/api/groups/${groupId}`)
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
      if (selectedGroup?.id === groupId) setSelectedGroup(null)
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleRenameGroup = async (e) => {
    e.preventDefault()
    setError('')
    setActionLoading(true)
    try {
      const response = await api.put(`/api/groups/${selectedGroup.id}/rename`, { name: renameValue })
      setGroups((prev) => prev.map((g) => g.id === selectedGroup.id ? response.data : g))
      setSelectedGroup(response.data)
      setShowRenameModal(false)
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!confirm(t('groups.confirmRemoveMember'))) return
    setActionLoading(true)
    try {
      const response = await api.delete(`/api/groups/${selectedGroup.id}/members/${memberId}`)
      setGroups((prev) => prev.map((g) => g.id === selectedGroup.id ? response.data : g))
      setSelectedGroup(response.data)
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setActionLoading(false)
    }
  }

  const openInviteModal = (code, e) => {
    if (e) e.stopPropagation()
    setCurrentInviteCode(code)
    setCopySuccess(false)
    setShowInviteModal(true)
  }

  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(currentInviteCode)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const openScoreModal = (score) => {
    setSelectedScore(score)
    setShowScoreModal(true)
  }

  const isOwner = selectedGroup?.ownerUsername === user?.username

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>
  }

  const bestScores = selectedGroup ? getBestScoresPerGame() : {}

  const renderScoreDisplay = (score, game, index) => {
    const isHorse = game.gameType === 'HORSE'

    return (
      <div
        key={score.id}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.5rem 0',
          borderTop: index > 0 ? '1px solid var(--border-color)' : undefined,
          cursor: 'pointer'
        }}
        onClick={() => openScoreModal(score)}
        title="Click to view submitted score"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: index === 0 ? '700' : '400', color: index === 0 ? 'var(--primary-color)' : 'inherit' }}>
            #{index + 1}
          </span>
          <span>{score.displayName}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          {isHorse ? (
            <span style={{ color: 'var(--primary-color)', fontWeight: '600' }}>
              {score.score !== null ? `${score.score}%` : '-'}
            </span>
          ) : (
            <>
              {score.solved !== null && (
                <span style={{ color: score.solved ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: '600' }}>
                  {score.solved ? t('dashboard.solved') : t('dashboard.failed')}
                </span>
              )}
              {score.attempts && (
                <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                  {score.attempts} tries
                </span>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t('groups.title')}</h1>
        <p>{t('groups.subtitle')}</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)} disabled={actionLoading}>
          {t('groups.createGroup')}
        </button>
        <button className="btn btn-outline" onClick={() => setShowJoinModal(true)} disabled={actionLoading}>
          {t('groups.joinGroup')}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="groups-layout" style={{ display: 'grid', gridTemplateColumns: selectedGroup ? '1fr 2fr' : '1fr', gap: '1.5rem' }}>
        <div>
          {groups.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="card"
                  style={{ cursor: 'pointer', border: selectedGroup?.id === group.id ? '2px solid var(--primary-color)' : undefined }}
                  onClick={() => setSelectedGroup(selectedGroup?.id === group.id ? null : group)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ margin: 0 }}>{group.name}</h3>
                      <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {group.memberCount || group.members?.length || 0} {t('groups.members').toLowerCase()}
                        {group.groupStreak > 0 && (
                          <span style={{ marginLeft: '0.75rem', color: 'var(--primary-color)' }}>
                            {group.groupStreak} day streak
                          </span>
                        )}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-small btn-outline"
                        onClick={(e) => openInviteModal(group.inviteCode, e)}
                        disabled={actionLoading}
                      >
                        Invite
                      </button>
                      {group.ownerUsername === user?.username ? (
                        <button
                          className="btn btn-small btn-danger"
                          onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id) }}
                          disabled={actionLoading}
                        >
                          {t('common.delete')}
                        </button>
                      ) : (
                        <button
                          className="btn btn-small btn-secondary"
                          onClick={(e) => { e.stopPropagation(); handleLeaveGroup(group.id) }}
                          disabled={actionLoading}
                        >
                          {t('groups.leave')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state card">
              <h3>{t('groups.noGroups')}</h3>
              <p>{t('groups.createFirst')}</p>
            </div>
          )}
        </div>

        {selectedGroup && (
          <div className="card group-details-panel">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  className="btn btn-small btn-outline mobile-only-close"
                  onClick={() => setSelectedGroup(null)}
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  ←
                </button>
                <div>
                  <h2 className="card-title" style={{ margin: 0 }}>{selectedGroup.name}</h2>
                  {selectedGroup.groupStreak > 0 && (
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--primary-color)' }}>
                      {selectedGroup.groupStreak} day group streak (best: {selectedGroup.longestGroupStreak})
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {isOwner && (
                  <>
                    <button
                      className="btn btn-small btn-outline"
                      onClick={() => { setRenameValue(selectedGroup.name); setShowRenameModal(true) }}
                    >
                      Rename
                    </button>
                    <button
                      className="btn btn-small btn-outline"
                      onClick={() => setShowManageModal(true)}
                    >
                      Manage
                    </button>
                  </>
                )}
                <input
                  type="date"
                  className="form-input"
                  style={{ width: 'auto' }}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Fun Facts Section */}
            {selectedGroup.stats && (selectedGroup.stats.mostActiveToday || selectedGroup.stats.longestStreak || selectedGroup.stats.returningPlayer) && (
              <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem',
                padding: '0.75rem',
                background: 'var(--hover-background)',
                borderRadius: '0.5rem',
                flexWrap: 'wrap'
              }}>
                {selectedGroup.stats.mostActiveToday && (
                  <div style={{ flex: '1', minWidth: '150px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Most Active Today</div>
                    <div style={{ fontWeight: '600' }}>{selectedGroup.stats.mostActiveToday}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--primary-color)' }}>{selectedGroup.stats.mostActiveTodayGames} games</div>
                  </div>
                )}
                {selectedGroup.stats.longestStreak && (
                  <div style={{ flex: '1', minWidth: '150px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Longest Streak</div>
                    <div style={{ fontWeight: '600' }}>{selectedGroup.stats.longestStreak}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--primary-color)' }}>{selectedGroup.stats.longestStreakDays} days</div>
                  </div>
                )}
                {selectedGroup.stats.returningPlayer && (
                  <div style={{ flex: '1', minWidth: '150px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Welcome Back</div>
                    <div style={{ fontWeight: '600' }}>{selectedGroup.stats.returningPlayer}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--success-color)' }}>Returned today!</div>
                  </div>
                )}
                {selectedGroup.stats.totalGamesToday > 0 && (
                  <div style={{ flex: '1', minWidth: '150px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Games Today</div>
                    <div style={{ fontWeight: '600', fontSize: '1.25rem', color: 'var(--primary-color)' }}>{selectedGroup.stats.totalGamesToday}</div>
                  </div>
                )}
              </div>
            )}

            {/* Members Section - Hidden by default */}
            <div style={{ marginBottom: '1rem' }}>
              <button
                className="btn btn-small btn-outline"
                onClick={() => setShowMembers(!showMembers)}
                style={{ marginBottom: showMembers ? '0.5rem' : 0 }}
              >
                {showMembers ? 'Hide Members' : `Show Members (${selectedGroup.members?.length || 0})`}
              </button>
              {showMembers && (
                <div style={{ padding: '0.75rem', background: 'var(--hover-background)', borderRadius: '0.5rem', marginTop: '0.5rem' }}>
                  {selectedGroup.members?.map((m, i) => (
                    <span key={m.id}>
                      <Link
                        to={`/profile/${m.username}`}
                        style={{ color: 'var(--primary-color)', textDecoration: 'none' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {m.displayName || m.username}
                      </Link>
                      {m.username === selectedGroup.ownerUsername && ` (${t('groups.owner')})`}
                      {m.globalDayStreak > 0 && ` [${m.globalDayStreak}d]`}
                      {i < selectedGroup.members.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <h3 style={{ marginBottom: '1rem' }}>
              {selectedDate === new Date().toISOString().split('T')[0]
                ? t('groups.todaysScores')
                : `Scores for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`
              }
            </h3>

            {scoresLoading ? (
              <div className="loading"><div className="spinner"></div></div>
            ) : Object.keys(bestScores).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(bestScores).map(([gameType, game]) => (
                  <div key={gameType} style={{ padding: '1rem', background: 'var(--hover-background)', borderRadius: '0.5rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem', color: 'var(--primary-color)' }}>{game.gameName}</h4>
                    {game.scores.map((score, index) => renderScoreDisplay(score, game, index))}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>{t('groups.noScoresToday')}</p>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('groups.createNew')}</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)} disabled={actionLoading}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreateGroup}>
                <div className="form-group">
                  <label className="form-label" htmlFor="groupName">{t('groups.groupName')}</label>
                  <input type="text" id="groupName" className="form-input" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} required maxLength={50} disabled={actionLoading} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>{actionLoading ? t('common.loading') : t('common.create')}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} disabled={actionLoading}>{t('common.cancel')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowJoinModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('groups.joinGroup')}</h2>
              <button className="modal-close" onClick={() => setShowJoinModal(false)} disabled={actionLoading}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleJoinGroup}>
                <div className="form-group">
                  <label className="form-label" htmlFor="inviteCode">{t('groups.inviteCode')}</label>
                  <input type="text" id="inviteCode" className="form-input" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder={t('groups.enterCode')} required maxLength={8} disabled={actionLoading} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>{actionLoading ? t('common.loading') : t('groups.join')}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowJoinModal(false)} disabled={actionLoading}>{t('common.cancel')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowRenameModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rename Group</h2>
              <button className="modal-close" onClick={() => setShowRenameModal(false)} disabled={actionLoading}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleRenameGroup}>
                <div className="form-group">
                  <label className="form-label" htmlFor="renameName">New Name</label>
                  <input type="text" id="renameName" className="form-input" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} required maxLength={50} disabled={actionLoading} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>{actionLoading ? t('common.loading') : 'Rename'}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRenameModal(false)} disabled={actionLoading}>{t('common.cancel')}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {showManageModal && selectedGroup && (
        <div className="modal-overlay" onClick={() => !actionLoading && setShowManageModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Members</h2>
              <button className="modal-close" onClick={() => setShowManageModal(false)} disabled={actionLoading}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedGroup.members?.map((member) => (
                  <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--hover-background)', borderRadius: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: '500' }}>{member.displayName || member.username}</span>
                      {member.username === selectedGroup.ownerUsername && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--primary-color)' }}>Owner</span>
                      )}
                    </div>
                    {member.username !== selectedGroup.ownerUsername && (
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={actionLoading}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invite Code</h2>
              <button className="modal-close" onClick={() => setShowInviteModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Share this code with friends to invite them to the group:
              </p>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                fontFamily: 'monospace',
                padding: '1rem',
                background: 'var(--hover-background)',
                borderRadius: '0.5rem',
                letterSpacing: '0.25rem',
                marginBottom: '1.5rem'
              }}>
                {currentInviteCode}
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  className="btn btn-primary"
                  onClick={copyInviteCode}
                >
                  {copySuccess ? 'Copied!' : 'Copy Code'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowInviteModal(false)}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score Details Modal */}
      {showScoreModal && selectedScore && (
        <div className="modal-overlay" onClick={() => setShowScoreModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedScore.displayName}'s Score</h2>
              <button className="modal-close" onClick={() => setShowScoreModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary-color)' }}>{selectedScore.gameDisplayName}</h4>
              <div className="score-raw-display">
                {selectedScore.rawResult || 'No raw result available'}
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowScoreModal(false)}
                >
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

export default Groups
