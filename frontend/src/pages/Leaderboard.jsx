import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

function Leaderboard() {
  const { t } = useTranslation()
  const [scores, setScores] = useState([])
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
  }, [])

  useEffect(() => {
    fetchScores()
  }, [selectedGroup, selectedDate])

  const fetchGroups = async () => {
    try {
      const response = await api.get('/api/groups')
      setGroups(response.data)
    } catch (error) {
      console.error('Failed to fetch groups:', error)
    }
  }

  const fetchScores = async () => {
    setLoading(true)
    try {
      let response
      if (selectedGroup) {
        response = await api.get(`/api/scores/group/${selectedGroup}?date=${selectedDate}`)
      } else {
        response = await api.get(`/api/scores/date/${selectedDate}`)
      }
      setScores(response.data)
    } catch (error) {
      console.error('Failed to fetch scores:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupScoresByGame = (scores) => {
    const grouped = {}
    scores.forEach((score) => {
      if (!grouped[score.gameType]) {
        grouped[score.gameType] = {
          name: score.gameDisplayName,
          scores: []
        }
      }
      grouped[score.gameType].scores.push(score)
    })

    Object.values(grouped).forEach((game) => {
      game.scores.sort((a, b) => {
        if (a.solved !== b.solved) return a.solved ? -1 : 1
        if (a.attempts && b.attempts) return a.attempts - b.attempts
        if (a.score && b.score) return b.score - a.score
        return 0
      })
    })

    return grouped
  }

  const groupedScores = groupScoresByGame(scores)

  return (
    <div>
      <div className="page-header">
        <h1>{t('leaderboard.title')}</h1>
        <p>{t('leaderboard.subtitle')}</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="date">
              {t('leaderboard.date')}
            </label>
            <input
              type="date"
              id="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="group">
              {t('leaderboard.group')}
            </label>
            <select
              id="group"
              className="form-select"
              value={selectedGroup || ''}
              onChange={(e) => setSelectedGroup(e.target.value || null)}
            >
              <option value="">{t('leaderboard.allUsers')}</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : Object.keys(groupedScores).length > 0 ? (
        <div className="grid grid-2">
          {Object.entries(groupedScores).map(([gameType, game]) => (
            <div key={gameType} className="card">
              <div className="card-header">
                <h2 className="card-title">{game.name}</h2>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {game.scores.length} {game.scores.length === 1 ? t('leaderboard.players') : t('leaderboard.players_plural')}
                </span>
              </div>
              <div>
                {game.scores.map((score, index) => (
                  <div key={score.id} className="leaderboard-item">
                    <div className="leaderboard-rank">#{index + 1}</div>
                    <div className="leaderboard-user">
                      <div className="name">{score.displayName}</div>
                      <div className="game">@{score.username}</div>
                    </div>
                    <div className="leaderboard-score">
                      {score.solved !== null && (
                        <span
                          style={{
                            color: score.solved
                              ? 'var(--success-color)'
                              : 'var(--danger-color)',
                            fontWeight: '600'
                          }}
                        >
                          {score.solved ? t('dashboard.solved') : t('dashboard.failed')}
                        </span>
                      )}
                      {score.attempts && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {score.attempts} {t('leaderboard.attempts')}
                        </div>
                      )}
                      {score.score && (
                        <div style={{ fontWeight: '600' }}>{score.score} pts</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state card">
          <h3>{t('leaderboard.noScores')}</h3>
          <p>
            {selectedGroup
              ? t('leaderboard.noScoresGroup')
              : t('leaderboard.noScoresAll')}
          </p>
        </div>
      )}
    </div>
  )
}

export default Leaderboard
