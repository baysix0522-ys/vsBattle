import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculateTodayFortune, type FortuneResult } from '../utils/fortune'
import { useAuth } from '../contexts/AuthContext'
import { fortuneApi } from '../api/client'
import type { BirthInfo } from '../utils/saju'

type StoredBirthInfo = BirthInfo & {
  gender: 'male' | 'female'
  hourKnown: boolean
}

// 일간 심볼
const DAY_MASTER_SYMBOLS: Record<string, string> = {
  갑: '🌲', 을: '🌿', 병: '☀️', 정: '🕯️', 무: '⛰️',
  기: '🌾', 경: '⚔️', 신: '💎', 임: '🌊', 계: '💧',
}

// 12운성 심볼
const TWELVE_STAGE_SYMBOLS: Record<string, string> = {
  장생: '🌱', 목욕: '🛁', 관대: '👔', 건록: '📈', 제왕: '👑',
  쇠: '📉', 병: '🏥', 사: '💀', 묘: '⚰️', 절: '🔄', 태: '🤰', 양: '👶',
}

// 신살 심볼
const SPIRIT_STAR_SYMBOLS: Record<string, string> = {
  천을귀인: '🌟', 문창귀인: '📚', 학당귀인: '🎓', 태극귀인: '☯',
  천덕귀인: '🙏', 월덕귀인: '🌙', 삼기귀인: '✨', 복성귀인: '🍀',
  역마살: '🐎', 화개살: '🎨', 도화살: '🌸', 장성살: '⭐',
  겁살: '⚠️', 망신살: '😰', 백호대살: '🐯', 천라지망: '🕸️',
}

// 카테고리 아이콘
const CATEGORY_ICONS: Record<string, string> = {
  love: '💕', money: '💰', health: '💪', work: '💼',
}

const CATEGORY_LABELS: Record<string, string> = {
  love: '연애운', money: '금전운', health: '건강운', work: '직장운',
}

export default function TodayFortune() {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [fortune, setFortune] = useState<FortuneResult | null>(null)
  const [birthInfo, setBirthInfo] = useState<StoredBirthInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  useEffect(() => {
    const loadFortune = async () => {
      try {
        if (token && user && !user.isGuest) {
          const todayRecord = await fortuneApi.getTodayRecord(token)
          if (todayRecord.record) {
            setBirthInfo(todayRecord.record.birthInfo as StoredBirthInfo)
            setFortune(todayRecord.record.fortuneResult as FortuneResult)
            setSaved(true)
          } else {
            navigate('/fortune/input')
            return
          }
        } else {
          const stored = localStorage.getItem('saju_birth_info')
          if (!stored) {
            navigate('/fortune/input')
            return
          }
          const info = JSON.parse(stored) as StoredBirthInfo
          setBirthInfo(info)
          const result = calculateTodayFortune(info)
          setFortune(result)
        }
      } catch (err) {
        console.error('운세 로드 실패:', err)
        navigate('/fortune/input')
      } finally {
        setLoading(false)
      }
    }
    loadFortune()
  }, [navigate, token, user])

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner">☯</div>
        <p>명리학 분석 중...</p>
      </div>
    )
  }

  if (!fortune || !birthInfo) return null

  // 이전 형식 데이터 호환성 체크
  const isNewFormat = !!fortune.todayEnergy && !!fortune.sajuAnalysis

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'normal'
    return 'low'
  }

  const getGradeEmoji = (grade: string) => {
    const emojis: Record<string, string> = {
      대길: '🌟', 길: '✨', 중길: '☀️', 소길: '🌤️', 평: '☁️', 주의: '⚠️',
    }
    return emojis[grade] || '☀️'
  }

  const getEnergyBars = (energy: number) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} className={`energy-bar ${i < energy ? 'filled' : ''}`} />
    ))
  }

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section)
  }

  return (
    <div className="fortune-page-v2">
      {/* 헤더 */}
      <header className="fortune-header-v2">
        <button className="back-btn" onClick={() => navigate('/')}>←</button>
        <h1>오늘의 운세</h1>
        <button className="share-btn">📤</button>
      </header>

      <div className="fortune-content-v2">
        {/* 날짜 & 상태 */}
        <div className="fortune-date-bar">
          <span className="date-text">{fortune.date}</span>
          {saved && <span className="saved-badge">✓ 저장됨</span>}
        </div>

        {/* 게스트 안내 */}
        {user?.isGuest && (
          <div className="guest-banner">
            <span>💡</span>
            <p>로그인하면 운세 기록이 저장됩니다</p>
            <button onClick={() => navigate('/login')}>로그인</button>
          </div>
        )}

        {/* ===== 메인 점수 카드 ===== */}
        <section className="main-score-section">
          <div className="saju-badge-row">
            <span className="saju-badge day-master">
              {DAY_MASTER_SYMBOLS[fortune.dayMaster]} 일간 {fortune.dayMaster} ({fortune.dayMasterElement})
            </span>
            <span className="saju-badge today-energy">
              오늘: {isNewFormat ? `${fortune.todayStem}${fortune.todayBranch}` : ''} ({fortune.todayElement})
            </span>
          </div>

          <div className={`score-display ${getScoreClass(fortune.overall.score)}`}>
            <div className="score-ring">
              <span className="score-value">{fortune.overall.score}</span>
              <span className="score-unit">점</span>
            </div>
            <div className="grade-info">
              <span className="grade-emoji">{getGradeEmoji(fortune.overall.grade)}</span>
              <span className="grade-text">{fortune.overall.grade}</span>
            </div>
          </div>

          {isNewFormat && fortune.overall.gradeDescription && (
            <p className="grade-description">{fortune.overall.gradeDescription}</p>
          )}
          <p className="fortune-summary">{fortune.overall.summary}</p>
        </section>

        {/* ===== 오늘의 기운 분석 ===== */}
        {isNewFormat && fortune.todayEnergy && (
          <section className="energy-analysis-section">
            <h2 className="section-title">⚡ 오늘의 기운</h2>

            <div className="energy-cards">
              {/* 십신 */}
              <div className="energy-card ten-god">
                <div className="card-header">
                  <span className="card-label">십신</span>
                  <span className="card-value">{fortune.todayEnergy.tenGod}</span>
                </div>
                <p className="card-keyword">#{fortune.todayEnergy.tenGodKeyword}</p>
                <p className="card-desc">{fortune.todayEnergy.tenGodDescription}</p>
              </div>

              {/* 12운성 */}
              <div className="energy-card twelve-stage">
                <div className="card-header">
                  <span className="card-label">12운성</span>
                  <span className="card-value">
                    {TWELVE_STAGE_SYMBOLS[fortune.todayEnergy.twelveStage]} {fortune.todayEnergy.twelveStage}
                  </span>
                </div>
                <div className="energy-level">
                  <span className="energy-label">기운</span>
                  <div className="energy-bars">{getEnergyBars(fortune.todayEnergy.twelveStageEnergy)}</div>
                </div>
                <p className="card-desc">{fortune.todayEnergy.twelveStageDescription}</p>
              </div>
            </div>

            {/* 오행 관계 */}
            <div className="element-relation-box">
              <span className="relation-icon">☯</span>
              <p>{fortune.todayEnergy.elementRelation}</p>
            </div>
          </section>
        )}

        {/* ===== 카테고리별 운세 ===== */}
        <section className="categories-section">
          <h2 className="section-title">📊 세부 운세</h2>

          <div className="category-cards-v2">
            {(Object.entries(fortune.categories) as [string, any][]).map(([key, cat]) => {
              // 이전 형식 호환: message -> mainMessage
              const mainMsg = cat.mainMessage || cat.message || '좋은 하루 되세요'
              const detailMsgs = cat.detailMessages || []
              const catGrade = cat.grade || ''
              const catTip = cat.tip || ''

              return (
                <div key={key} className={`category-card-v2 ${getScoreClass(cat.score)}`}>
                  <div className="cat-header">
                    <span className="cat-icon">{CATEGORY_ICONS[key]}</span>
                    <span className="cat-name">{CATEGORY_LABELS[key]}</span>
                    {catGrade && <span className="cat-grade">{catGrade}</span>}
                  </div>

                  <div className="cat-score-bar">
                    <div className="score-fill" style={{ width: `${cat.score}%` }} />
                    <span className="score-text">{cat.score}점</span>
                  </div>

                  <p className="cat-main-msg">{mainMsg}</p>

                  {detailMsgs.length > 1 && (
                    <div className="cat-details">
                      {detailMsgs.slice(1).map((msg: string, i: number) => (
                        <p key={i} className="detail-msg">• {msg}</p>
                      ))}
                    </div>
                  )}

                  {catTip && (
                    <div className="cat-tip">
                      <span className="tip-label">TIP</span>
                      <span className="tip-text">{catTip}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ===== 합충형파해 & 신살 ===== */}
        {isNewFormat && fortune.branchAnalysis && fortune.spiritStars && (fortune.branchAnalysis.hasRelation || fortune.spiritStars.active.length > 0) && (
          <section className="special-analysis-section">
            <h2 className="section-title">🔮 특수 분석</h2>

            {/* 합충형파해 */}
            {fortune.branchAnalysis.hasRelation && (
              <div className="analysis-box branch-analysis">
                <div className="box-header" onClick={() => toggleSection('branch')}>
                  <span className="box-icon">⚡</span>
                  <span className="box-title">지지 관계 (합충형파해)</span>
                  <span className="toggle-icon">{activeSection === 'branch' ? '▲' : '▼'}</span>
                </div>
                {activeSection === 'branch' && (
                  <div className="box-content">
                    {fortune.branchAnalysis.relations.map((rel, i) => (
                      <div key={i} className={`relation-item ${rel.effect}`}>
                        <span className="rel-type">{rel.type}</span>
                        <span className="rel-pillars">{rel.pillars}과 오늘</span>
                        <p className="rel-desc">{rel.description}</p>
                      </div>
                    ))}
                    <p className="analysis-summary">{fortune.branchAnalysis.summary}</p>
                  </div>
                )}
              </div>
            )}

            {/* 신살 */}
            {fortune.spiritStars.active.length > 0 && (
              <div className="analysis-box spirit-analysis">
                <div className="box-header" onClick={() => toggleSection('spirit')}>
                  <span className="box-icon">✨</span>
                  <span className="box-title">발동 신살</span>
                  <span className="toggle-icon">{activeSection === 'spirit' ? '▲' : '▼'}</span>
                </div>
                {activeSection === 'spirit' && (
                  <div className="box-content">
                    <div className="spirit-badges">
                      {fortune.spiritStars.active.map((star, i) => (
                        <span key={i} className="spirit-badge">
                          {SPIRIT_STAR_SYMBOLS[star] || '✦'} {star}
                        </span>
                      ))}
                    </div>
                    <p className="spirit-interpretation">{fortune.spiritStars.interpretation}</p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ===== 오늘의 행운 ===== */}
        <section className="lucky-section-v2">
          <h2 className="section-title">🍀 오늘의 행운</h2>

          <div className="lucky-grid-v2">
            <div className="lucky-card">
              <div className="lucky-icon">🎨</div>
              <div className="lucky-info">
                <span className="lucky-label">행운의 색</span>
                <span className="lucky-value">{fortune.lucky.color}</span>
                {isNewFormat && fortune.lucky.colorReason && (
                  <span className="lucky-reason">{fortune.lucky.colorReason}</span>
                )}
              </div>
            </div>

            <div className="lucky-card">
              <div className="lucky-icon">🔢</div>
              <div className="lucky-info">
                <span className="lucky-label">행운의 숫자</span>
                <span className="lucky-value">{fortune.lucky.number}</span>
                {isNewFormat && fortune.lucky.numberReason && (
                  <span className="lucky-reason">{fortune.lucky.numberReason}</span>
                )}
              </div>
            </div>

            <div className="lucky-card">
              <div className="lucky-icon">🧭</div>
              <div className="lucky-info">
                <span className="lucky-label">행운의 방향</span>
                <span className="lucky-value">{fortune.lucky.direction}</span>
                {isNewFormat && fortune.lucky.directionReason && (
                  <span className="lucky-reason">{fortune.lucky.directionReason}</span>
                )}
              </div>
            </div>

            <div className="lucky-card">
              <div className="lucky-icon">⏰</div>
              <div className="lucky-info">
                <span className="lucky-label">행운의 시간</span>
                <span className="lucky-value">{fortune.lucky.time}</span>
                {isNewFormat && fortune.lucky.timeReason && (
                  <span className="lucky-reason">{fortune.lucky.timeReason}</span>
                )}
              </div>
            </div>

            {isNewFormat && fortune.lucky.item && (
              <div className="lucky-card wide">
                <div className="lucky-icon">🎁</div>
                <div className="lucky-info">
                  <span className="lucky-label">행운의 아이템</span>
                  <span className="lucky-value">{fortune.lucky.item}</span>
                </div>
              </div>
            )}

            {isNewFormat && fortune.lucky.activity && (
              <div className="lucky-card wide">
                <div className="lucky-icon">🎯</div>
                <div className="lucky-info">
                  <span className="lucky-label">추천 활동</span>
                  <span className="lucky-value">{fortune.lucky.activity}</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ===== 오늘의 조언 ===== */}
        <section className="advice-section-v2">
          <h2 className="section-title">💡 오늘의 조언</h2>

          <div className="main-advice-card">
            <p className="main-advice-text">
              {isNewFormat && fortune.advice.main
                ? fortune.advice.main
                : typeof fortune.advice === 'string'
                  ? fortune.advice
                  : '오늘 하루도 긍정적인 마음으로 보내세요!'}
            </p>
          </div>

          {isNewFormat && fortune.advice.dos && fortune.advice.donts && (
            <div className="dos-donts-grid">
              {fortune.advice.dos.length > 0 && (
                <div className="advice-list dos">
                  <h4>✅ 하면 좋은 것</h4>
                  <ul>
                    {fortune.advice.dos.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {fortune.advice.donts.length > 0 && (
                <div className="advice-list donts">
                  <h4>❌ 피해야 할 것</h4>
                  <ul>
                    {fortune.advice.donts.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {isNewFormat && fortune.advice.mindset && (
            <div className="mindset-card">
              <span className="mindset-icon">🧠</span>
              <div className="mindset-content">
                <span className="mindset-label">오늘의 마인드셋</span>
                <p className="mindset-text">{fortune.advice.mindset}</p>
              </div>
            </div>
          )}
        </section>

        {/* ===== 상세 운세 (펼치기) ===== */}
        <section className="detailed-reading-section">
          <div
            className="detailed-toggle"
            onClick={() => toggleSection('detailed')}
          >
            <span>📜 {isNewFormat ? '명리학 상세 해석' : '상세 운세'}</span>
            <span className="toggle-arrow">{activeSection === 'detailed' ? '▲' : '▼'}</span>
          </div>

          {activeSection === 'detailed' && (
            <div className="detailed-content">
              {isNewFormat && fortune.sajuAnalysis && (
                <div className="saju-profile">
                  <h4>{DAY_MASTER_SYMBOLS[fortune.dayMaster]} 나의 사주 프로필</h4>
                  <p className="profile-desc">{fortune.sajuAnalysis.dayMasterDescription}</p>
                  <div className="profile-tags">
                    <span className="tag">성격: {fortune.sajuAnalysis.dayMasterPersonality}</span>
                    <span className="tag">강점: {fortune.sajuAnalysis.dayMasterStrength}</span>
                  </div>
                  <div className="balance-info">
                    <span className="balance-label">
                      신강/신약: {fortune.sajuAnalysis.balance === 'strong' ? '신강' : fortune.sajuAnalysis.balance === 'weak' ? '신약' : '중화'}
                    </span>
                    <p className="balance-desc">{fortune.sajuAnalysis.balanceDescription}</p>
                  </div>
                </div>
              )}

              <div className="full-reading">
                <h4>📖 오늘의 상세 풀이</h4>
                <p className="reading-text">
                  {fortune.overall.detailedReading || (fortune.overall as any).detail || '상세 풀이 정보가 없습니다.'}
                </p>
              </div>
            </div>
          )}
        </section>

        {/* 하단 버튼 */}
        <div className="fortune-actions-v2">
          <button className="action-btn secondary" onClick={() => navigate('/fortune/input')}>
            정보 수정
          </button>
          <button className="action-btn primary" onClick={() => navigate('/')}>
            홈으로
          </button>
        </div>
      </div>
    </div>
  )
}
