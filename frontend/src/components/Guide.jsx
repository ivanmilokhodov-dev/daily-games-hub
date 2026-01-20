import { useTranslation } from 'react-i18next'
import { useGuide } from '../context/GuideContext'

function Guide() {
  const { t } = useTranslation()
  const { showGuide, closeGuide } = useGuide()

  if (!showGuide) return null

  const games = [
    'Wordle', 'Connections', 'Spotle', 'Bandle', 'Travle', 'Countryle',
    'Minute Cryptic', 'Contexto', 'Semantle', 'Horse'
  ]

  return (
    <div className="modal-overlay" onClick={closeGuide}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('guide.title')}</h2>
          <button className="modal-close" onClick={closeGuide}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="guide-step">
            <div className="guide-step-number">1</div>
            <div className="guide-step-content">
              <h3>{t('guide.step1Title')}</h3>
              <p>{t('guide.step1Desc')}</p>
              <div className="guide-games-list">
                {games.map(game => (
                  <span key={game} className="guide-game-tag">{game}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="guide-step">
            <div className="guide-step-number">2</div>
            <div className="guide-step-content">
              <h3>{t('guide.step2Title')}</h3>
              <p>{t('guide.step2Desc')}</p>
            </div>
          </div>

          <div className="guide-step">
            <div className="guide-step-number">3</div>
            <div className="guide-step-content">
              <h3>{t('guide.step3Title')}</h3>
              <p>{t('guide.step3Desc')}</p>
            </div>
          </div>

          <div className="guide-step">
            <div className="guide-step-number">4</div>
            <div className="guide-step-content">
              <h3>{t('guide.step4Title')}</h3>
              <p>{t('guide.step4Desc')}</p>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={closeGuide}>
            {t('guide.gotIt')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Guide
