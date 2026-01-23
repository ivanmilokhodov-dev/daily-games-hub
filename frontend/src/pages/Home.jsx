import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { getTodayAmsterdam } from '../utils/dateUtils'

function Home() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const [games, setGames] = useState([])
  const [todayScores, setTodayScores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [isAuthenticated])

  const fetchData = async () => {
    try {
      const gamesResponse = await api.get('/api/games')
      setGames(gamesResponse.data)

      // Fetch today's scores if authenticated
      if (isAuthenticated) {
        const scoresResponse = await api.get('/api/scores/my')
        const today = getTodayAmsterdam()
        const todayOnly = scoresResponse.data.filter(s => s.gameDate === today)
        setTodayScores(todayOnly)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get list of game types played today
  const gamesPlayedToday = todayScores.map(s => s.gameType)

  return (
    <div>
      <div className="page-header" style={{ textAlign: 'center', padding: '3rem 0' }}>
        <h1>{t('home.welcome')}</h1>
        <p style={{ fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
          {t('home.subtitle')}
        </p>
        {!isAuthenticated && (
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/register" className="btn btn-primary">
              {t('home.getStarted')}
            </Link>
            <Link to="/login" className="btn btn-outline">
              {t('home.signIn')}
            </Link>
          </div>
        )}
      </div>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>{t('home.popularGames')}</h2>
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="games-grid-centered">
            {games.map((game) => {
              const isPlayed = gamesPlayedToday.includes(game.id)
              return (
                <div key={game.id} className="game-card" style={{ position: 'relative' }}>
                  {isAuthenticated && isPlayed && (
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      background: 'var(--success-color)',
                      color: 'white',
                      borderRadius: '9999px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      ✓ Played
                    </div>
                  )}
                  <h3>{game.name}</h3>
                  <p>{game.description}</p>
                  <a href={game.url} target="_blank" rel="noopener noreferrer">
                    {t('home.playNow')} &rarr;
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>{t('home.howItWorks')}</h2>
        <div className="grid grid-3" style={{ marginTop: '2rem' }}>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>1</div>
            <h3>{t('home.step1Title')}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('home.step1Desc')}
            </p>
          </div>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>2</div>
            <h3>{t('home.step2Title')}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('home.step2Desc')}
            </p>
          </div>
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>3</div>
            <h3>{t('home.step3Title')}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('home.step3Desc')}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
