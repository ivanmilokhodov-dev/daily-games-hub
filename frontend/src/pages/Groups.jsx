import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Groups() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [selectedGroupScores, setSelectedGroupScores] = useState({})

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await api.get('/api/groups')
      setGroups(response.data)
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    } finally {
      setLoading(false)
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
        <h1>{t('groups.title')}</h1>
        <p>{t('groups.subtitle')}</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          {t('groups.createGroup')}
        </button>
        <button className="btn btn-outline" onClick={() => setShowJoinModal(true)}>
          {t('groups.joinGroup')}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

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

      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="card"
            style={{ width: '400px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '1rem' }}>{t('groups.createNew')}</h2>
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
      )}

      {showJoinModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowJoinModal(false)}
        >
          <div
            className="card"
            style={{ width: '400px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '1rem' }}>{t('groups.joinGroup')}</h2>
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
      )}
    </div>
  )
}

export default Groups
