import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../contexts/AuthContext'
import { userApi, type MyPageData, type RiceTransaction, type DailyBonusStatus } from '../api/client'
import './MyPage.css'

// 오행 색상
const ELEMENT_COLORS: Record<string, string> = {
  목: '#22c55e', 화: '#ef4444', 토: '#a16207', 금: '#eab308', 수: '#3b82f6',
  wood: '#22c55e', fire: '#ef4444', earth: '#a16207', metal: '#eab308', water: '#3b82f6',
}

// 오행 한글 변환
const ELEMENT_NAMES: Record<string, string> = {
  wood: '목', fire: '화', earth: '토', metal: '금', water: '수',
}

type TabType = 'overview' | 'battles' | 'rice'

export default function MyPage() {
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<MyPageData | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [riceTransactions, setRiceTransactions] = useState<RiceTransaction[]>([])
  const [riceLoading, setRiceLoading] = useState(false)
  const [showAllActivities, setShowAllActivities] = useState(false)
  const [dailyBonus, setDailyBonus] = useState<DailyBonusStatus | null>(null)
  const [claimingBonus, setClaimingBonus] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    if (!token) return

    const fetchData = async () => {
      try {
        const [myPageData, bonusStatus] = await Promise.all([
          userApi.getMyPage(token),
          userApi.getDailyBonus(token),
        ])
        setData(myPageData)
        setDailyBonus(bonusStatus)
      } catch (error) {
        console.error('마이페이지 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  const loadRiceTransactions = async () => {
    if (!token || riceTransactions.length > 0) return
    setRiceLoading(true)
    try {
      const res = await userApi.getRiceTransactions(token)
      setRiceTransactions(res.transactions)
    } catch (error) {
      console.error('쌀 내역 로드 실패:', error)
    } finally {
      setRiceLoading(false)
    }
  }

  const claimLoginBonus = async () => {
    if (!token || claimingBonus || dailyBonus?.loginBonus.claimed) return
    setClaimingBonus(true)
    try {
      const result = await userApi.claimLoginBonus(token)
      if (result.success) {
        // 보너스 상태 업데이트
        setDailyBonus(prev => prev ? {
          ...prev,
          loginBonus: { ...prev.loginBonus, claimed: true }
        } : null)
        // 쌀 잔액 업데이트
        setData(prev => prev ? {
          ...prev,
          user: { ...prev.user, rice: result.balance }
        } : null)
        alert(`🍚 ${result.amount}쌀을 받았습니다!`)
      }
    } catch (error) {
      console.error('로그인 보너스 수령 실패:', error)
      alert('보너스 수령에 실패했습니다')
    } finally {
      setClaimingBonus(false)
    }
  }

  const handleWithdraw = async () => {
    if (!token || withdrawing) return

    const confirmed = window.confirm(
      '정말 탈퇴하시겠습니까?\n\n' +
      '탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.\n' +
      '- 사주 분석 기록\n' +
      '- 대결 기록\n' +
      '- 운세 기록\n' +
      '- 보유 쌀'
    )

    if (!confirmed) return

    const doubleConfirm = window.confirm('정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
    if (!doubleConfirm) return

    setWithdrawing(true)
    try {
      await userApi.withdraw(token)
      alert('회원 탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.')
      logout()
      navigate('/')
    } catch (error) {
      console.error('회원 탈퇴 실패:', error)
      alert('회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setWithdrawing(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'rice') {
      loadRiceTransactions()
    }
  }, [activeTab])

  if (loading) {
    return (
      <div className="mypage-screen">
        <div className="loading-center">
          <Spin size="large" />
          <p>마이페이지 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mypage-screen">
        <div className="error-state">
          <span>❌</span>
          <p>데이터를 불러올 수 없습니다</p>
          <button className="primary-btn" onClick={() => navigate('/')}>
            홈으로
          </button>
        </div>
      </div>
    )
  }

  const elementLabel = data.saju?.dayMasterElement
    ? ELEMENT_NAMES[data.saju.dayMasterElement] || data.saju.dayMasterElement
    : null
  const elementColor = elementLabel ? ELEMENT_COLORS[elementLabel] : '#888'

  const winRate = data.battleStats.total > 0
    ? Math.round((data.battleStats.wins / data.battleStats.total) * 100)
    : 0

  return (
    <div className="mypage-screen">
      {/* 프로필 헤더 */}
      <div className="mypage-header">
        <button className="logout-mini-btn" onClick={() => { logout(); navigate('/'); }}>
          로그아웃
        </button>
        <div className="profile-avatar" style={{ borderColor: elementColor }}>
          {data.user.profileImage ? (
            <img src={data.user.profileImage} alt="프로필" />
          ) : (
            <span className="avatar-emoji">🐼</span>
          )}
        </div>
        <div className="profile-info">
          <h1 className="profile-nickname">{data.user.nickname}</h1>
          {data.saju && (
            <div className="profile-saju">
              <span className="day-master" style={{ color: elementColor }}>
                {data.saju.dayMaster}일간
              </span>
              <span className="element-badge" style={{ backgroundColor: elementColor + '22', color: elementColor }}>
                {elementLabel}오행
              </span>
            </div>
          )}
          <div className="profile-meta">
            {data.user.provider !== 'local' && (
              <span className="provider-badge">{data.user.provider}</span>
            )}
            <span className="join-date">
              가입: {new Date(data.user.createdAt).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      </div>

      {/* 쌀 잔액 카드 */}
      <div className="rice-card">
        <div className="rice-info">
          <span className="rice-icon">🍚</span>
          <div className="rice-details">
            <span className="rice-label">내 쌀</span>
            <span className="rice-amount">{data.user.rice.toLocaleString()}</span>
          </div>
        </div>
        <button className="charge-btn" onClick={() => navigate('/shop')}>
          충전하기
        </button>
      </div>

      {/* 일일 보너스 카드 */}
      {dailyBonus && (
        <div className="daily-bonus-card">
          <h3 className="bonus-title">🎁 일일 무료 쌀</h3>
          <div className="bonus-list">
            <div className={`bonus-item ${dailyBonus.loginBonus.claimed ? 'claimed' : ''}`}>
              <div className="bonus-info">
                <span className="bonus-icon">📅</span>
                <div className="bonus-text">
                  <span className="bonus-name">로그인 보너스</span>
                  <span className="bonus-amount">+{dailyBonus.loginBonus.amount}쌀</span>
                </div>
              </div>
              {dailyBonus.loginBonus.claimed ? (
                <span className="bonus-claimed">✓ 수령완료</span>
              ) : (
                <button
                  className="bonus-claim-btn"
                  onClick={claimLoginBonus}
                  disabled={claimingBonus}
                >
                  {claimingBonus ? '...' : '받기'}
                </button>
              )}
            </div>
            <div className={`bonus-item ${dailyBonus.fortuneBonus.claimed ? 'claimed' : ''}`}>
              <div className="bonus-info">
                <span className="bonus-icon">🌅</span>
                <div className="bonus-text">
                  <span className="bonus-name">오늘의 운세</span>
                  <span className="bonus-amount">+{dailyBonus.fortuneBonus.amount}쌀</span>
                </div>
              </div>
              {dailyBonus.fortuneBonus.claimed ? (
                <span className="bonus-claimed">✓ 수령완료</span>
              ) : (
                <button
                  className="bonus-claim-btn fortune"
                  onClick={() => navigate('/fortune/input')}
                >
                  운세보기
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 대결 통계 */}
      <div className="stats-card">
        <h2 className="section-title">⚔️ 대결 전적</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-value">{data.battleStats.total}</span>
            <span className="stat-label">총 대결</span>
          </div>
          <div className="stat-item win">
            <span className="stat-value">{data.battleStats.wins}</span>
            <span className="stat-label">승리</span>
          </div>
          <div className="stat-item lose">
            <span className="stat-value">{data.battleStats.losses}</span>
            <span className="stat-label">패배</span>
          </div>
          <div className="stat-item draw">
            <span className="stat-value">{data.battleStats.draws}</span>
            <span className="stat-label">무승부</span>
          </div>
        </div>
        {data.battleStats.total > 0 && (
          <div className="win-rate">
            <span className="win-rate-label">승률</span>
            <div className="win-rate-bar">
              <div className="win-rate-fill" style={{ width: `${winRate}%` }} />
            </div>
            <span className="win-rate-value">{winRate}%</span>
          </div>
        )}
      </div>

      {/* 탭 네비게이션 */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 개요
        </button>
        <button
          className={`tab-btn ${activeTab === 'battles' ? 'active' : ''}`}
          onClick={() => setActiveTab('battles')}
        >
          ⚔️ 대결기록
        </button>
        <button
          className={`tab-btn ${activeTab === 'rice' ? 'active' : ''}`}
          onClick={() => setActiveTab('rice')}
        >
          🍚 쌀 내역
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* 내 사주 정보 */}
            {data.saju ? (
              <div className="saju-card">
                <h3 className="card-title">📜 내 사주</h3>
                {data.saju.pillars ? (
                  <div className="saju-pillars">
                    {['year', 'month', 'day', 'hour'].map((key) => {
                      const pillars = data.saju?.pillars
                      const pillar = pillars ? pillars[key as keyof typeof pillars] : null
                      if (!pillar) return (
                        <div key={key} className="pillar unknown">
                          <span className="pillar-label">{key === 'year' ? '년' : key === 'month' ? '월' : key === 'day' ? '일' : '시'}</span>
                          <span className="pillar-stem">?</span>
                          <span className="pillar-branch">?</span>
                        </div>
                      )
                      return (
                        <div key={key} className="pillar">
                          <span className="pillar-label">{key === 'year' ? '년' : key === 'month' ? '월' : key === 'day' ? '일' : '시'}</span>
                          <span className="pillar-stem">{pillar.heavenlyStem}</span>
                          <span className="pillar-branch">{pillar.earthlyBranch}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="empty-text">사주 정보를 불러올 수 없습니다</p>
                )}
                {data.saju.pillars?.day && data.saju.basicAnalysis && (
                  <div className="saju-summary">
                    <p>
                      <strong>일주:</strong> {data.saju.pillars.day.heavenlyStem}{data.saju.pillars.day.earthlyBranch}
                    </p>
                    {data.saju.basicAnalysis.geukGuk && (
                      <p>
                        <strong>격국:</strong> {data.saju.basicAnalysis.geukGuk}
                      </p>
                    )}
                    {data.saju.basicAnalysis.balance && (
                      <p>
                        <strong>신강/신약:</strong> {data.saju.basicAnalysis.balance === 'strong' ? '신강' : data.saju.basicAnalysis.balance === 'weak' ? '신약' : '중화'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="saju-card empty">
                <h3 className="card-title">📜 내 사주</h3>
                <p className="empty-text">아직 사주 분석을 하지 않았습니다</p>
                <button className="primary-btn" onClick={() => navigate('/battle')}>
                  사주 분석하기
                </button>
              </div>
            )}

            {/* 최근 이용 서비스 */}
            <div className="recent-activities">
              <h3 className="card-title">📋 최근 이용 서비스</h3>
              {data.recentActivities && data.recentActivities.length > 0 ? (
                <>
                  <div className="activity-list">
                    {(showAllActivities ? data.recentActivities : data.recentActivities.slice(0, 4)).map((activity) => {
                      const handleClick = () => {
                        if (activity.serviceType === 'battle') {
                          navigate(`/battle/result/${activity.id}`)
                        } else if (activity.serviceType === 'fortune') {
                          navigate(`/fortune/record/${activity.id}`)
                        } else if (activity.serviceType === 'saju') {
                          navigate('/battle/report')
                        }
                      }

                      return (
                        <div
                          key={`${activity.serviceType}-${activity.id}`}
                          className="activity-item"
                          onClick={handleClick}
                        >
                          <span className="activity-icon">{activity.serviceIcon}</span>
                          <div className="activity-info">
                            <span className="activity-name">{activity.serviceName}</span>
                            <span className="activity-detail">{activity.detail}</span>
                          </div>
                          <span className="activity-date">
                            {new Date(activity.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {data.recentActivities.length > 4 && (
                    <button
                      className="show-more-btn"
                      onClick={() => setShowAllActivities(!showAllActivities)}
                    >
                      {showAllActivities ? '접기 ▲' : `더보기 (${data.recentActivities.length - 4}개) ▼`}
                    </button>
                  )}
                </>
              ) : (
                <p className="empty-text">아직 이용한 서비스가 없습니다</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'battles' && (
          <div className="battles-tab">
            <div className="battle-list full">
              {data.recentBattles.length > 0 ? (
                data.recentBattles.map((battle) => {
                  const isWin = battle.winnerId === data.user.id
                  const isLose = battle.winnerId && battle.winnerId !== data.user.id
                  const statusClass = battle.status === 'pending' ? 'pending' : isWin ? 'win' : isLose ? 'lose' : 'draw'

                  return (
                    <div
                      key={battle.id}
                      className={`battle-item ${statusClass}`}
                      onClick={() => battle.status === 'completed' && navigate(`/battle/result/${battle.id}`)}
                    >
                      <div className="battle-main">
                        <div className="battle-players">
                          <div className="player-info">
                            <span className="player-name">{battle.challenger.nickname}</span>
                            <span className="player-element" style={{ color: ELEMENT_COLORS[battle.challenger.element] }}>
                              {ELEMENT_NAMES[battle.challenger.element] || battle.challenger.element}
                            </span>
                          </div>
                          <span className="vs">VS</span>
                          <div className="player-info">
                            <span className="player-name">{battle.opponent?.nickname || '???'}</span>
                            {battle.opponent && (
                              <span className="player-element" style={{ color: ELEMENT_COLORS[battle.opponent.element] }}>
                                {ELEMENT_NAMES[battle.opponent.element] || battle.opponent.element}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="battle-meta">
                          <span className="battle-date">
                            {new Date(battle.createdAt).toLocaleDateString('ko-KR')}
                          </span>
                          {battle.status === 'pending' ? (
                            <span className="status-badge pending">대기중</span>
                          ) : isWin ? (
                            <span className="status-badge win">승리</span>
                          ) : isLose ? (
                            <span className="status-badge lose">패배</span>
                          ) : (
                            <span className="status-badge draw">무승부</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="empty-state">
                  <span>⚔️</span>
                  <p>아직 대결 기록이 없습니다</p>
                  <button className="primary-btn" onClick={() => navigate('/battle')}>
                    첫 대결 시작하기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rice' && (
          <div className="rice-tab">
            {riceLoading ? (
              <div className="loading-center">
                <Spin />
              </div>
            ) : riceTransactions.length > 0 ? (
              <div className="transaction-list">
                {riceTransactions.map((tx) => (
                  <div key={tx.id} className={`transaction-item ${tx.amount > 0 ? 'plus' : 'minus'}`}>
                    <div className="tx-info">
                      <span className="tx-desc">{tx.description}</span>
                      <span className="tx-date">
                        {new Date(tx.createdAt).toLocaleDateString('ko-KR')} {new Date(tx.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="tx-amount">
                      <span className={tx.amount > 0 ? 'plus' : 'minus'}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                      <span className="tx-balance">잔액: {tx.balanceAfter}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span>🍚</span>
                <p>아직 쌀 거래 내역이 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 회원 탈퇴 */}
      <div className="withdraw-section">
        <button
          className="withdraw-btn"
          onClick={handleWithdraw}
          disabled={withdrawing}
        >
          {withdrawing ? '처리 중...' : '회원 탈퇴'}
        </button>
      </div>

      {/* 법적 정보 링크 */}
      <div className="legal-links">
        <a href="/terms" onClick={(e) => { e.preventDefault(); navigate('/terms') }}>이용약관</a>
        <span className="divider">|</span>
        <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate('/privacy') }}>개인정보처리방침</a>
        <span className="divider">|</span>
        <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about') }}>회사소개</a>
      </div>

    </div>
  )
}
