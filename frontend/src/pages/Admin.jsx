import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import api from '../services/api'

function Admin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuth()
  const [stats, setStats] = useState(null)
  const [historicalStats, setHistoricalStats] = useState(null)
  const [admins, setAdmins] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState({ users: [], total: 0, page: 0 })

  useEffect(() => {
    if (!isAdmin) {
      navigate('/')
      return
    }
    fetchData()
  }, [isAdmin, navigate])

  const fetchData = async () => {
    try {
      const [statsRes, historicalRes, adminsRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/stats/historical?days=30'),
        api.get('/api/admin/admins')
      ])
      setStats(statsRes.data)
      setHistoricalStats(historicalRes.data)
      setAdmins(adminsRes.data)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
      if (error.response?.status === 403) {
        navigate('/')
      }
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    if (userSearch.length < 2) return
    try {
      const response = await api.get(`/api/admin/users/search?query=${encodeURIComponent(userSearch)}`)
      setSearchResults(response.data)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const addAdmin = async (userId) => {
    try {
      await api.post(`/api/admin/admins/${userId}`)
      fetchData()
      setSearchResults([])
      setUserSearch('')
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add admin')
    }
  }

  const removeAdmin = async (userId) => {
    if (!confirm('Are you sure you want to remove this admin?')) return
    try {
      await api.delete(`/api/admin/admins/${userId}`)
      fetchData()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to remove admin')
    }
  }

  const fetchUsers = async (page = 0) => {
    try {
      const response = await api.get(`/api/admin/users?page=${page}&size=50`)
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
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
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>{t('admin.title')}</h1>
        <p>{t('admin.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['overview', 'charts', 'admins', 'users'].map(tab => (
          <button
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setActiveTab(tab)
              if (tab === 'users' && users.users.length === 0) fetchUsers()
            }}
          >
            {t(`admin.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <>
          <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
            <div className="card stat-card">
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">{t('admin.totalUsers')}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.activeToday}</div>
              <div className="stat-label">{t('admin.activeToday')}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.totalPlays}</div>
              <div className="stat-label">{t('admin.totalPlays')}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{stats.todayPlays}</div>
              <div className="stat-label">{t('admin.todayPlays')}</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>{t('admin.gameStats')}</h3>
            <div className="game-stats-grid">
              {Object.entries(stats.gameStats).map(([gameType, data]) => (
                <div key={gameType} className="game-stat-item">
                  <div className="game-stat-header">
                    <span className="game-stat-name">{data.displayName}</span>
                  </div>
                  <div className="game-stat-bars">
                    <div className="game-stat-bar-container">
                      <div
                        className="game-stat-bar total"
                        style={{ width: `${(data.totalPlays / stats.maxPlays) * 100}%` }}
                      />
                      <span className="game-stat-count">{data.totalPlays} {t('admin.totalPlays').toLowerCase()}</span>
                    </div>
                    <div className="game-stat-bar-container">
                      <div
                        className="game-stat-bar today"
                        style={{ width: `${(data.todayPlays / stats.maxTodayPlays) * 100}%` }}
                      />
                      <span className="game-stat-count">{data.todayPlays} {t('admin.todayPlays').toLowerCase()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && historicalStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>{t('admin.charts.dailyUsers')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalStats.dailyUsers}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                  stroke="var(--text-secondary)"
                  fontSize={12}
                />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card-background)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="var(--primary-color)"
                  strokeWidth={2}
                  dot={false}
                  name={t('admin.charts.dailyUsers')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>{t('admin.charts.gamesPlayed')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalStats.dailyGames}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                  stroke="var(--text-secondary)"
                  fontSize={12}
                />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card-background)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Line
                  type="monotone"
                  dataKey="gamesPlayed"
                  stroke="var(--success-color)"
                  strokeWidth={2}
                  dot={false}
                  name={t('admin.charts.gamesPlayed')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: '1rem' }}>{t('admin.charts.userGrowth')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalStats.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                  stroke="var(--text-secondary)"
                  fontSize={12}
                />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card-background)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Line
                  type="monotone"
                  dataKey="totalUsers"
                  stroke="var(--info-color, #3b82f6)"
                  strokeWidth={2}
                  dot={false}
                  name={t('admin.charts.userGrowth')}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>{t('admin.manageAdmins')}</h3>

          {/* Search to add admin */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder={t('admin.searchUserPlaceholder')}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={searchUsers}>
                {t('common.search')}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {searchResults.map(u => (
                  <div key={u.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    <span>{u.displayName || u.username} (@{u.username})</span>
                    {u.isAdmin ? (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: 'var(--primary-color)',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {t('admin.alreadyAdmin')}
                      </span>
                    ) : (
                      <button
                        className="btn btn-small btn-primary"
                        onClick={() => addAdmin(u.id)}
                      >
                        {t('admin.makeAdmin')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current admins list */}
          <h4 style={{ marginBottom: '0.75rem' }}>{t('admin.currentAdmins')}</h4>
          <div>
            {admins.map(admin => (
              <div key={admin.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                borderBottom: '1px solid var(--border-color)'
              }}>
                <div>
                  <strong>{admin.displayName || admin.username}</strong>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                    @{admin.username}
                  </span>
                  {admin.isPrimaryAdmin && (
                    <span style={{
                      marginLeft: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      background: 'var(--warning-color, #f59e0b)',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      {t('admin.primaryAdmin')}
                    </span>
                  )}
                </div>
                {!admin.isPrimaryAdmin && (
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => removeAdmin(admin.id)}
                  >
                    {t('admin.removeAdmin')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>
            {t('admin.allUsers')} ({users.total})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>User</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem' }}>Email</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>Streak</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>Last Active</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem' }}>Admin</th>
                </tr>
              </thead>
              <tbody>
                {users.users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <strong>{u.displayName || u.username}</strong>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                        @{u.username}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ textAlign: 'center', padding: '0.75rem' }}>{u.globalDayStreak}</td>
                    <td style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-secondary)' }}>
                      {u.lastActiveDate || '-'}
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                      {u.isAdmin ? '✓' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
            <button
              className="btn btn-outline btn-small"
              disabled={users.page === 0}
              onClick={() => fetchUsers(users.page - 1)}
            >
              Previous
            </button>
            <span style={{ padding: '0.5rem' }}>
              Page {users.page + 1} of {Math.max(1, Math.ceil(users.total / 50))}
            </span>
            <button
              className="btn btn-outline btn-small"
              disabled={(users.page + 1) * 50 >= users.total}
              onClick={() => fetchUsers(users.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
