import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Button, ConfigProvider, theme, App, Spin } from 'antd'
import { useAuth } from '../contexts/AuthContext'
import { battleApi, sajuApi, type SajuProfile } from '../api/client'
import SEO from '../components/SEO'

// 일간 심볼
const DAY_MASTER_SYMBOLS: Record<string, string> = {
  갑: '🌲', 을: '🌿', 병: '☀️', 정: '🕯️', 무: '⛰️',
  기: '🌾', 경: '⚔️', 신: '💎', 임: '🌊', 계: '💧',
}

const ELEMENT_COLORS: Record<string, string> = {
  목: '#22c55e', 화: '#ef4444', 토: '#a16207', 금: '#eab308', 수: '#3b82f6',
}

const STAT_LABELS: Record<string, { icon: string; name: string }> = {
  money: { icon: '💰', name: '금전운' },
  love: { icon: '💕', name: '연애운' },
  children: { icon: '👶', name: '자식운' },
  career: { icon: '💼', name: '직장운' },
  study: { icon: '📚', name: '학업운' },
  health: { icon: '💪', name: '건강운' },
}

export default function BattleJoin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { shareCode } = useParams<{ shareCode: string }>()
  const { user, token } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [challenger, setChallenger] = useState<{
    nickname: string
    dayMaster: string
    dayMasterElement: string
    ilju: string
  } | null>(null)

  const [myProfile, setMyProfile] = useState<SajuProfile | null>(null)
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  useEffect(() => {
    if (!shareCode || !token) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        // 병렬: 대결 정보 + 내 프로필
        const [battleRes, profileRes] = await Promise.all([
          battleApi.getBattleByCode(token, shareCode),
          sajuApi.getProfile(token),
        ])
        setChallenger(battleRes.challenger)
        setHasProfile(profileRes.hasProfile)
        setMyProfile(profileRes.profile)
      } catch (err) {
        console.error('데이터 조회 실패:', err)
        setError(err instanceof Error ? err.message : '대결을 찾을 수 없습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [shareCode, token])

  // 비로그인 상태
  if (!user || !token) {
    return (
      <div className="battle-page">
        <SEO title="대결 참가" description="사주 대결에 참가하세요" />
        <header className="battle-header">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <h1>대결 참가</h1>
          <div style={{ width: 40 }} />
        </header>
        <div className="battle-content">
          <div className="guest-block">
            <span className="block-icon">⚔️</span>
            <h3>대결에 도전하세요!</h3>
            <p>참가하려면 로그인이 필요합니다</p>
            <Button type="primary" size="large" onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}>
              로그인하기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 게스트 불가
  if (user.isGuest) {
    return (
      <div className="battle-page">
        <SEO title="대결 참가" description="사주 대결에 참가하세요" />
        <header className="battle-header">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <h1>대결 참가</h1>
          <div style={{ width: 40 }} />
        </header>
        <div className="battle-content">
          <div className="guest-block">
            <span className="block-icon">🔒</span>
            <h3>회원 전용 서비스입니다</h3>
            <p>회원 가입 후 대결에 참가할 수 있습니다</p>
            <Button type="primary" size="large" onClick={() => navigate('/login')}>
              회원가입하기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleJoin = async () => {
    if (!shareCode || !token) return
    setJoinError(null)
    setIsSubmitting(true)

    try {
      const joinRes = await battleApi.joinBattle(token, shareCode)
      navigate(`/battle/result/${joinRes.battleId}`)
    } catch (err) {
      console.error('대결 참가 실패:', err)
      setJoinError(err instanceof Error ? err.message : '대결 참가에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#f97316',
          borderRadius: 12,
        },
      }}
    >
      <App>
        <div className="battle-page">
          <SEO title="대결 참가" description="사주 대결에 참가하세요" />
          <header className="battle-header">
            <button className="back-btn" onClick={() => navigate('/')}>←</button>
            <h1>⚔️ 대결 참가</h1>
            <div style={{ width: 40 }} />
          </header>

          <div className="battle-content">
            {loading ? (
              <div className="loading-state">
                <Spin size="large" />
                <p>대결 정보를 불러오는 중...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <span>❌</span>
                <p>{error}</p>
                <Button onClick={() => navigate('/')}>홈으로</Button>
              </div>
            ) : challenger ? (
              <>
                {/* 도전자 정보 */}
                <div className="challenger-card">
                  <div className="challenger-badge">도전자</div>
                  <div className="challenger-avatar">
                    {DAY_MASTER_SYMBOLS[challenger.dayMaster] || '☯'}
                  </div>
                  <div className="challenger-info">
                    <span className="challenger-name">{challenger.nickname}</span>
                    <span className="challenger-saju">
                      {challenger.ilju} · {challenger.dayMaster}일간
                    </span>
                  </div>
                  <div className="vs-badge">VS</div>

                  {/* 내 프로필 또는 프로필 없음 */}
                  {hasProfile && myProfile ? (
                    <div className="opponent-placeholder" style={{ opacity: 1 }}>
                      <span className="placeholder-icon">
                        {DAY_MASTER_SYMBOLS[myProfile.dayMaster] || '☯'}
                      </span>
                      <span className="placeholder-text" style={{ color: ELEMENT_COLORS[myProfile.dayMasterElement] || '#fff' }}>
                        {myProfile.pillars.day.heavenlyStem}{myProfile.pillars.day.earthlyBranch} · {myProfile.dayMaster}일간
                      </span>
                    </div>
                  ) : (
                    <div className="opponent-placeholder">
                      <span className="placeholder-icon">❓</span>
                      <span className="placeholder-text">사주 분석 필요</span>
                    </div>
                  )}
                </div>

                {/* 프로필 없으면 분석 안내 */}
                {hasProfile === false && (
                  <div style={{
                    background: 'rgba(249, 115, 22, 0.1)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: 12,
                    padding: 20,
                    textAlign: 'center',
                    margin: '16px 0',
                  }}>
                    <p style={{ fontSize: 16, marginBottom: 12, color: '#f97316' }}>
                      대결에 참가하려면 먼저 사주 분석이 필요합니다
                    </p>
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => navigate(`/saju?returnTo=${encodeURIComponent(location.pathname)}`)}
                      style={{
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      }}
                    >
                      사주 분석하러 가기
                    </Button>
                  </div>
                )}

                {/* 프로필 있으면 내 스탯 미리보기 + 참가 버튼 */}
                {hasProfile && myProfile && (
                  <>
                    <div style={{
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 12,
                      padding: 16,
                      margin: '16px 0',
                    }}>
                      <h3 style={{ fontSize: 14, color: '#999', marginBottom: 12 }}>내 배틀 스탯</h3>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 8,
                      }}>
                        {Object.entries(STAT_LABELS).map(([key, { icon, name }]) => {
                          const stat = myProfile.battleStats[key as keyof typeof myProfile.battleStats]
                          return (
                            <div key={key} style={{
                              background: 'rgba(255,255,255,0.05)',
                              borderRadius: 8,
                              padding: '8px 4px',
                              textAlign: 'center',
                            }}>
                              <div style={{ fontSize: 12, color: '#999' }}>{icon} {name}</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: '#f97316' }}>{stat.score}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {joinError && <div className="error-message">{joinError}</div>}

                    <Button
                      type="primary"
                      size="large"
                      block
                      onClick={handleJoin}
                      loading={isSubmitting}
                      disabled={isSubmitting}
                      style={{
                        height: 56,
                        fontSize: 18,
                        fontWeight: 700,
                        marginTop: 8,
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      }}
                    >
                      {isSubmitting ? '대결 진행 중...' : '⚔️ 대결 시작!'}
                    </Button>
                  </>
                )}
              </>
            ) : null}
          </div>
        </div>
      </App>
    </ConfigProvider>
  )
}
