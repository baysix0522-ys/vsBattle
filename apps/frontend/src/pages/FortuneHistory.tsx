import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fortuneApi, battleApi, type FortuneRecord, type BattleListItem } from '../api/client'
import type { FortuneResult } from '../utils/fortune'

type ServiceType = 'today' | 'battle' | 'compatibility' | 'saju' | 'tarot' | 'yearly'

const SERVICE_TABS: { id: ServiceType; label: string; icon: string }[] = [
  { id: 'today', label: '오늘의 운세', icon: '🌅' },
  { id: 'battle', label: '사주 대결', icon: '⚔️' },
  { id: 'compatibility', label: '궁합', icon: '💕' },
  { id: 'saju', label: '사주 분석', icon: '📜' },
  { id: 'tarot', label: '타로', icon: '🃏' },
  { id: 'yearly', label: '신년운세', icon: '📅' },
]

// 일간 심볼
const DAY_MASTER_SYMBOLS: Record<string, string> = {
  갑: '🌲', 을: '🌿', 병: '☀️', 정: '🕯️', 무: '⛰️',
  기: '🌾', 경: '⚔️', 신: '💎', 임: '🌊', 계: '💧',
}

// 일간 → 오행 매핑 (명리학 전통 색상)
// 목=청/녹, 화=적, 토=황, 금=백, 수=흑
const DAY_MASTER_TO_ELEMENT: Record<string, { element: string; label: string; hanja: string; color: string }> = {
  갑: { element: 'wood', label: '목', hanja: '木', color: '#4ade80' },  // 청/녹색
  을: { element: 'wood', label: '목', hanja: '木', color: '#4ade80' },
  병: { element: 'fire', label: '화', hanja: '火', color: '#f87171' },  // 적색
  정: { element: 'fire', label: '화', hanja: '火', color: '#f87171' },
  무: { element: 'earth', label: '토', hanja: '土', color: '#fbbf24' }, // 황색
  기: { element: 'earth', label: '토', hanja: '土', color: '#fbbf24' },
  경: { element: 'metal', label: '금', hanja: '金', color: '#e4e4e7' }, // 백색
  신: { element: 'metal', label: '금', hanja: '金', color: '#e4e4e7' },
  임: { element: 'water', label: '수', hanja: '水', color: '#6b7280' }, // 흑색 (진한 회색)
  계: { element: 'water', label: '수', hanja: '水', color: '#6b7280' },
}

export default function FortuneHistory() {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [activeTab, setActiveTab] = useState<ServiceType>('today')
  const [records, setRecords] = useState<FortuneRecord[]>([])
  const [battles, setBattles] = useState<BattleListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const updateArrowVisibility = () => {
    const container = tabsContainerRef.current
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5)
    }
  }

  const scrollTabs = (direction: 'left' | 'right') => {
    const container = tabsContainerRef.current
    if (container) {
      const scrollAmount = 150
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    const container = tabsContainerRef.current
    if (container) {
      updateArrowVisibility()
      container.addEventListener('scroll', updateArrowVisibility)
      return () => container.removeEventListener('scroll', updateArrowVisibility)
    }
  }, [])

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    if (user?.isGuest) {
      setLoading(false)
      return
    }

    if (activeTab === 'today') {
      setLoading(true)
      fortuneApi.getRecords(token, 30)
        .then((res) => setRecords(res.records))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    } else if (activeTab === 'battle') {
      setLoading(true)
      battleApi.getMyBattles(token)
        .then((res) => setBattles(res.battles))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    } else {
      setRecords([])
      setBattles([])
      setLoading(false)
    }
  }, [token, user, navigate, activeTab])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['일', '월', '화', '수', '목', '금', '토']
    const weekday = weekdays[date.getDay()]
    return `${year}년 ${month}월 ${day}일 (${weekday})`
  }

  const getGradeEmoji = (grade: string) => {
    const emojis: Record<string, string> = {
      대길: '🌟', 길: '✨', 중길: '☀️', 소길: '🌤️', 평: '☁️', 주의: '⚠️',
    }
    return emojis[grade] || '☀️'
  }

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'normal'
    return 'low'
  }

  const isServiceAvailable = (service: ServiceType) => {
    return service === 'today' || service === 'battle'
  }

  // 게스트 사용자
  if (user?.isGuest) {
    return (
      <div className="fortune-page-v2">
        <header className="fortune-header-v2">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <h1>운세 기록</h1>
          <div style={{ width: 40 }} />
        </header>

        <div className="fortune-content-v2">
          <div className="empty-state-v2">
            <span className="empty-icon">🔒</span>
            <h3>게스트는 기록을 볼 수 없어요</h3>
            <p>회원가입하면 운세 기록을 저장하고<br />언제든 다시 볼 수 있어요!</p>
            <button onClick={() => navigate('/login')} className="action-btn primary">
              회원가입하기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fortune-page-v2">
      <header className="fortune-header-v2">
        <button className="back-btn" onClick={() => navigate('/')}>←</button>
        <h1>운세 기록</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="fortune-content-v2">
        {/* 서비스별 탭 */}
        <div className={`service-tabs-wrapper ${showLeftArrow ? 'show-left' : ''} ${showRightArrow ? 'show-right' : ''}`}>
          {showLeftArrow && (
            <button className="tab-arrow left" onClick={() => scrollTabs('left')}>
              ←
            </button>
          )}
          <div className="service-tabs" ref={tabsContainerRef}>
            {SERVICE_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`service-tab ${activeTab === tab.id ? 'active' : ''} ${!isServiceAvailable(tab.id) ? 'disabled' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </button>
            ))}
          </div>
          {showRightArrow && (
            <button className="tab-arrow right" onClick={() => scrollTabs('right')}>
              →
            </button>
          )}
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        {loading ? (
          <div className="loading-state-v2">
            <div className="loading-spinner">☯</div>
            <p>기록을 불러오는 중...</p>
          </div>
        ) : !isServiceAvailable(activeTab) ? (
          <div className="empty-state-v2">
            <span className="empty-icon">🚧</span>
            <h3>준비 중인 서비스입니다</h3>
            <p>곧 만나볼 수 있어요!</p>
          </div>
        ) : activeTab === 'battle' ? (
          battles.length === 0 ? (
            <div className="empty-state-v2">
              <span className="empty-icon">⚔️</span>
              <h3>아직 대결 기록이 없어요</h3>
              <p>친구와 사주 대결을 해보세요!</p>
              <button onClick={() => navigate('/battle')} className="action-btn primary">
                대결하러 가기
              </button>
            </div>
          ) : (
            <div className="record-list-v2">
              {battles.map((battle) => {
                const isChallenger = battle.challenger_id === user?.id
                const myName = isChallenger ? battle.challenger_nickname : battle.opponent_nickname
                const opName = isChallenger ? battle.opponent_nickname : battle.challenger_nickname
                const myDM = isChallenger ? battle.challenger_day_master : battle.opponent_day_master
                const opDM = isChallenger ? battle.opponent_day_master : battle.challenger_day_master
                const isPending = battle.status === 'pending'
                const isWinner = battle.winner_id === user?.id
                const isDraw = battle.status === 'completed' && !battle.winner_id

                return (
                  <div
                    key={battle.id}
                    className={`record-card-v2 battle-record ${isPending ? 'pending' : ''}`}
                    onClick={() => !isPending && navigate(`/battle/result/${battle.id}`)}
                    style={{ cursor: isPending ? 'default' : 'pointer' }}
                  >
                    <div className="record-header-v2">
                      <span className="record-date-v2">{formatDate(battle.created_at)}</span>
                      {isPending ? (
                        <span className="battle-status pending">대기 중</span>
                      ) : isWinner ? (
                        <span className="battle-status win">승리</span>
                      ) : isDraw ? (
                        <span className="battle-status draw">무승부</span>
                      ) : (
                        <span className="battle-status lose">패배</span>
                      )}
                    </div>

                    <div className="battle-record-vs">
                      <div className="battle-record-player">
                        <div
                          className="player-element-badge"
                          style={{
                            backgroundColor: myDM ? DAY_MASTER_TO_ELEMENT[myDM]?.color + '22' : '#66666622',
                            borderColor: myDM ? DAY_MASTER_TO_ELEMENT[myDM]?.color : '#666',
                          }}
                        >
                          <span className="element-hanja" style={{ color: myDM ? DAY_MASTER_TO_ELEMENT[myDM]?.color : '#666' }}>
                            {myDM ? DAY_MASTER_TO_ELEMENT[myDM]?.hanja : '?'}
                          </span>
                        </div>
                        <span className="player-name">{myName}</span>
                        {myDM && (
                          <span className="player-sub" style={{ color: DAY_MASTER_TO_ELEMENT[myDM]?.color }}>
                            {DAY_MASTER_TO_ELEMENT[myDM]?.label}({DAY_MASTER_TO_ELEMENT[myDM]?.hanja})
                          </span>
                        )}
                      </div>
                      <span className="battle-record-badge">VS</span>
                      <div className="battle-record-player">
                        {isPending ? (
                          <>
                            <div className="player-element-badge" style={{ backgroundColor: '#33333344', borderColor: '#555' }}>
                              <span className="element-hanja" style={{ color: '#888' }}>?</span>
                            </div>
                            <span className="player-name">대기 중</span>
                          </>
                        ) : (
                          <>
                            <div
                              className="player-element-badge"
                              style={{
                                backgroundColor: opDM ? DAY_MASTER_TO_ELEMENT[opDM]?.color + '22' : '#66666622',
                                borderColor: opDM ? DAY_MASTER_TO_ELEMENT[opDM]?.color : '#666',
                              }}
                            >
                              <span className="element-hanja" style={{ color: opDM ? DAY_MASTER_TO_ELEMENT[opDM]?.color : '#666' }}>
                                {opDM ? DAY_MASTER_TO_ELEMENT[opDM]?.hanja : '?'}
                              </span>
                            </div>
                            <span className="player-name">{opName}</span>
                            {opDM && (
                              <span className="player-sub" style={{ color: DAY_MASTER_TO_ELEMENT[opDM]?.color }}>
                                {DAY_MASTER_TO_ELEMENT[opDM]?.label}({DAY_MASTER_TO_ELEMENT[opDM]?.hanja})
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {battle.chemistry && (
                      <div className="battle-record-chemistry">
                        <span>
                          {battle.chemistry.type === '천생연분' ? '💕' : battle.chemistry.type === '숙명의라이벌' ? '⚡' : '🤝'}
                          {' '}{battle.chemistry.type}
                        </span>
                        <span className="chemistry-compat">{battle.chemistry.compatibility}%</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        ) : records.length === 0 ? (
          <div className="empty-state-v2">
            <span className="empty-icon">📭</span>
            <h3>아직 기록이 없어요</h3>
            <p>오늘의 운세를 확인하면<br />자동으로 기록됩니다!</p>
            <button onClick={() => navigate('/fortune/input')} className="action-btn primary">
              운세 보러가기
            </button>
          </div>
        ) : (
          <div className="record-list-v2">
            {records.map((record) => {
              // fortuneResult가 문자열인 경우 파싱
              let fortune: FortuneResult | null = null
              try {
                fortune = typeof record.fortuneResult === 'string'
                  ? JSON.parse(record.fortuneResult)
                  : record.fortuneResult as FortuneResult
              } catch {
                fortune = null
              }

              if (!fortune?.overall) {
                return (
                  <div key={record.id} className="record-card-v2 error">
                    <div className="record-date-v2">{formatDate(record.date)}</div>
                    <p className="error-text">기록을 불러올 수 없습니다</p>
                  </div>
                )
              }

              const handleClick = () => {
                navigate(`/fortune/record/${record.id}`, {
                  state: { record: { ...record, fortuneResult: fortune } }
                })
              }

              return (
                <div key={record.id} className="record-card-v2" onClick={handleClick}>
                  <div className="record-header-v2">
                    <span className="record-date-v2">{formatDate(record.date)}</span>
                    <span className="record-arrow">→</span>
                  </div>

                  <div className="record-main-v2">
                    <div className={`record-score-circle ${getScoreClass(fortune.overall.score)}`}>
                      <span className="score-num">{fortune.overall.score}</span>
                      <span className="score-unit">점</span>
                    </div>

                    <div className="record-info-v2">
                      <div className="record-grade-v2">
                        <span className="grade-emoji">{getGradeEmoji(fortune.overall.grade)}</span>
                        <span className="grade-text">{fortune.overall.grade}</span>
                      </div>
                      <div className="record-saju-v2">
                        <span className="day-master-symbol">{DAY_MASTER_SYMBOLS[fortune.dayMaster]}</span>
                        <span>{fortune.dayMaster}({fortune.dayMasterElement})</span>
                      </div>
                    </div>
                  </div>

                  <p className="record-summary-v2">{fortune.overall.summary}</p>

                  <div className="record-categories-v2">
                    <div className={`cat-chip ${getScoreClass(fortune.categories?.love?.score ?? 0)}`}>
                      <span>💕</span>
                      <span>{fortune.categories?.love?.score ?? '-'}</span>
                    </div>
                    <div className={`cat-chip ${getScoreClass(fortune.categories?.money?.score ?? 0)}`}>
                      <span>💰</span>
                      <span>{fortune.categories?.money?.score ?? '-'}</span>
                    </div>
                    <div className={`cat-chip ${getScoreClass(fortune.categories?.health?.score ?? 0)}`}>
                      <span>💪</span>
                      <span>{fortune.categories?.health?.score ?? '-'}</span>
                    </div>
                    <div className={`cat-chip ${getScoreClass(fortune.categories?.work?.score ?? 0)}`}>
                      <span>💼</span>
                      <span>{fortune.categories?.work?.score ?? '-'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
