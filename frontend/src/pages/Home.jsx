import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function Home() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGames()
  }, [])

  const fetchGames = async () => {
    try {
      const response = await api.get('/api/games')
      setGames(response.data)
    } catch (error) {
      console.error('Failed to fetch games:', error)
    } finally {
      setLoading(false)
    }
  }

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
          <div className="grid grid-4">
            {games.map((game) => (
              <div key={game.id} className="game-card">
                <h3>{game.name}</h3>
                <p>{game.description}</p>
                <a href={game.url} target="_blank" rel="noopener noreferrer">
                  {t('home.playNow')} &rarr;
                </a>
              </div>
            ))}
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
