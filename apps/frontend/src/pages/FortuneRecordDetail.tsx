import { useLocation, useNavigate } from 'react-router-dom'
import type { FortuneResult } from '../utils/fortune'

type LocationState = {
  record: {
    id: string
    date: string
    fortuneResult: FortuneResult
  }
}

export default function FortuneRecordDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  if (!state?.record) {
    navigate('/fortune/history')
    return null
  }

  const { record } = state
  const fortune = record.fortuneResult

  // 이전 형식 데이터 호환성 체크
  const isNewFormat = !!fortune.todayEnergy && !!fortune.sajuAnalysis

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'score-excellent'
    if (score >= 60) return 'score-good'
    if (score >= 40) return 'score-normal'
    return 'score-low'
  }

  return (
    <div className="today-fortune-page">
      <div className="fortune-container">
        <header className="fortune-header">
          <button className="back-btn" onClick={() => navigate('/fortune/history')}>←</button>
          <h1>운세 기록</h1>
          <button className="share-btn">📤</button>
        </header>

        <div className="fortune-date">
          <span>{fortune.date}</span>
        </div>

        {/* 메인 점수 카드 */}
        <div className="main-score-card">
          <div className="saju-info">
            <span className="day-master-badge">
              일간 {fortune.dayMaster} ({fortune.dayMasterElement})
            </span>
            <span className="today-energy">
              오늘의 기운: {fortune.todayElement}
            </span>
          </div>

          <div className="score-circle">
            <span className="score-number">{fortune.overall.score}</span>
            <span className="score-label">점</span>
          </div>

          <div className="grade-badge">
            <span className="grade-emoji">
              {fortune.overall.grade === '대길' ? '🌟' :
               fortune.overall.grade === '길' ? '✨' :
               fortune.overall.grade === '중길' ? '☀️' :
               fortune.overall.grade === '소길' ? '🌤️' : '☁️'}
            </span>
            <span className="grade-text">{fortune.overall.grade}</span>
          </div>

          <p className="fortune-summary">{fortune.overall.summary}</p>
        </div>

        {/* 상세 운세 */}
        <div className="fortune-detail-card">
          <h3>📖 오늘의 운세 풀이</h3>
          <p>{fortune.overall.detailedReading || (fortune.overall as any).detail || '상세 풀이 정보가 없습니다.'}</p>
        </div>

        {/* 카테고리별 운세 */}
        <div className="category-section">
          <h3>📊 분야별 운세</h3>
          <div className="category-grid">
            <div className="category-card">
              <div className="category-header">
                <span className="category-icon">💕</span>
                <span className="category-name">연애운</span>
              </div>
              <div className={`category-score ${getScoreColor(fortune.categories.love.score)}`}>
                {fortune.categories.love.score}점
              </div>
              <p className="category-message">{fortune.categories.love.mainMessage || (fortune.categories.love as any).message || ''}</p>
            </div>

            <div className="category-card">
              <div className="category-header">
                <span className="category-icon">💰</span>
                <span className="category-name">금전운</span>
              </div>
              <div className={`category-score ${getScoreColor(fortune.categories.money.score)}`}>
                {fortune.categories.money.score}점
              </div>
              <p className="category-message">{fortune.categories.money.mainMessage || (fortune.categories.money as any).message || ''}</p>
            </div>

            <div className="category-card">
              <div className="category-header">
                <span className="category-icon">💪</span>
                <span className="category-name">건강운</span>
              </div>
              <div className={`category-score ${getScoreColor(fortune.categories.health.score)}`}>
                {fortune.categories.health.score}점
              </div>
              <p className="category-message">{fortune.categories.health.mainMessage || (fortune.categories.health as any).message || ''}</p>
            </div>

            <div className="category-card">
              <div className="category-header">
                <span className="category-icon">💼</span>
                <span className="category-name">직장/학업운</span>
              </div>
              <div className={`category-score ${getScoreColor(fortune.categories.work.score)}`}>
                {fortune.categories.work.score}점
              </div>
              <p className="category-message">{fortune.categories.work.mainMessage || (fortune.categories.work as any).message || ''}</p>
            </div>
          </div>
        </div>

        {/* 행운 정보 */}
        <div className="lucky-section">
          <h3>🍀 오늘의 행운</h3>
          <div className="lucky-grid">
            <div className="lucky-item">
              <span className="lucky-icon">🎨</span>
              <span className="lucky-label">행운의 색</span>
              <span className="lucky-value">{fortune.lucky.color}</span>
            </div>
            <div className="lucky-item">
              <span className="lucky-icon">🔢</span>
              <span className="lucky-label">행운의 숫자</span>
              <span className="lucky-value">{fortune.lucky.number}</span>
            </div>
            <div className="lucky-item">
              <span className="lucky-icon">🧭</span>
              <span className="lucky-label">행운의 방향</span>
              <span className="lucky-value">{fortune.lucky.direction}</span>
            </div>
            <div className="lucky-item">
              <span className="lucky-icon">⏰</span>
              <span className="lucky-label">행운의 시간</span>
              <span className="lucky-value">{fortune.lucky.time}</span>
            </div>
          </div>
        </div>

        {/* 조언 */}
        <div className="advice-card">
          <h3>💡 오늘의 조언</h3>
          <p>
            {isNewFormat && fortune.advice.main
              ? fortune.advice.main
              : typeof fortune.advice === 'string'
                ? fortune.advice
                : '오늘 하루도 긍정적인 마음으로 보내세요!'}
          </p>
          {isNewFormat && fortune.advice.dos && fortune.advice.dos.length > 0 && (
            <div className="advice-dos">
              <h4>✅ 하면 좋은 것</h4>
              <ul>
                {fortune.advice.dos.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {isNewFormat && fortune.advice.donts && fortune.advice.donts.length > 0 && (
            <div className="advice-donts">
              <h4>❌ 피해야 할 것</h4>
              <ul>
                {fortune.advice.donts.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="fortune-actions">
          <button className="action-btn secondary" onClick={() => navigate('/fortune/history')}>
            목록으로
          </button>
          <button className="action-btn primary" onClick={() => navigate('/')}>
            홈으로
          </button>
        </div>
      </div>
    </div>
  )
}
