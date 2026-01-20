import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

function Admin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const hasAccess = localStorage.getItem('adminAccess') === 'true'
    if (!hasAccess) {
      navigate('/settings')
      return
    }

    fetchStats()
  }, [navigate])

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminAccess')
    navigate('/settings')
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>{t('admin.title')}</h1>
            <p>{t('admin.subtitle')}</p>
          </div>
          <button className="btn btn-outline" onClick={handleLogout}>
            Exit Admin
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)' }}>
            {stats?.totalUsers || 0}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>{t('admin.totalUsers')}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)' }}>
            {stats?.activeToday || 0}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>{t('admin.activeToday')}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)' }}>
            {stats?.totalPlays || 0}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>{t('admin.totalPlays')}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)' }}>
            {stats?.todayPlays || 0}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>{t('admin.todayPlays')}</div>
        </div>
      </div>

      {/* Game Statistics */}
      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>{t('admin.gameStats')}</h2>
        <div className="admin-game-stats">
          {stats?.gameStats && Object.entries(stats.gameStats).map(([game, data]) => (
            <div key={game} className="admin-game-row">
              <div className="admin-game-name">{data.displayName}</div>
              <div className="admin-game-bars">
                <div className="admin-stat-item">
                  <span className="admin-stat-label">{t('admin.totalPlays')}</span>
                  <div className="admin-bar-container">
                    <div
                      className="admin-bar admin-bar-total"
                      style={{
                        width: `${Math.min((data.totalPlays / (stats.maxPlays || 1)) * 100, 100)}%`
                      }}
                    />
                    <span className="admin-bar-value">{data.totalPlays}</span>
                  </div>
                </div>
                <div className="admin-stat-item">
                  <span className="admin-stat-label">{t('admin.todayPlays')}</span>
                  <div className="admin-bar-container">
                    <div
                      className="admin-bar admin-bar-today"
                      style={{
                        width: `${Math.min((data.todayPlays / (stats.maxTodayPlays || 1)) * 100, 100)}%`
                      }}
                    />
                    <span className="admin-bar-value">{data.todayPlays}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Admin
