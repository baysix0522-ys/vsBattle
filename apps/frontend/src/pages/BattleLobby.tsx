import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Spin, message, Modal, ConfigProvider, theme, App } from 'antd'
import { useAuth } from '../contexts/AuthContext'
import { sajuApi, battleApi, ApiError, type SajuProfile, type BattleStats } from '../api/client'
import SEO from '../components/SEO'

const DAY_MASTER_SYMBOLS: Record<string, string> = {
  갑: '🌲', 을: '🌿', 병: '☀️', 정: '🕯️', 무: '⛰️',
  기: '🌾', 경: '⚔️', 신: '💎', 임: '🌊', 계: '💧',
}

const ELEMENT_COLORS: Record<string, string> = {
  목: '#22c55e', 화: '#ef4444', 토: '#a16207', 금: '#eab308', 수: '#3b82f6',
}

const STAT_ICONS: Record<string, string> = {
  money: '💰', love: '💕', children: '👶',
  career: '💼', study: '📚', health: '💪',
}

const STAT_NAMES: Record<string, string> = {
  money: '금전운', love: '연애운', children: '자식운',
  career: '직장운', study: '학업운', health: '건강운',
}

export default function BattleLobby() {
  const navigate = useNavigate()
  const { user, token, updateRice } = useAuth()
  const [messageApi, contextHolder] = message.useMessage()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<SajuProfile | null>(null)
  const [hasProfile, setHasProfile] = useState(false)

  const [isCreating, setIsCreating] = useState(false)
  const [shareCode, setShareCode] = useState<string | null>(null)

  // 프로필 로드
  const loadProfile = useCallback(async () => {
    if (!token || user?.isGuest) {
      setLoading(false)
      return
    }

    try {
      const res = await sajuApi.getProfile(token)
      setHasProfile(res.hasProfile)
      setProfile(res.profile)
    } catch (err) {
      console.error('프로필 조회 실패:', err)
    } finally {
      setLoading(false)
    }
  }, [token, user?.isGuest])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // 대결 생성
  const handleCreateBattle = async () => {
    if (!token) {
      messageApi.error('로그인이 필요합니다')
      return
    }

    setIsCreating(true)
    try {
      const res = await battleApi.createBattle(token)
      setShareCode(res.shareCode)
      updateRice(res.riceBalance)
      messageApi.success('대결이 생성되었습니다!')
    } catch (err) {
      console.error('대결 생성 실패:', err)

      if (err instanceof ApiError && err.message.includes('쌀')) {
        Modal.confirm({
          title: '쌀이 부족합니다',
          content: '대결 생성에는 20쌀이 필요합니다. 쌀을 충전하시겠습니까?',
          okText: '충전하러 가기',
          cancelText: '취소',
          onOk: () => navigate('/shop'),
        })
      } else {
        messageApi.error(err instanceof Error ? err.message : '대결 생성에 실패했습니다')
      }
    } finally {
      setIsCreating(false)
    }
  }

  // 링크 복사
  const handleCopyLink = async () => {
    if (!shareCode) return
    const link = `${window.location.origin}/battle/join/${shareCode}`
    try {
      await navigator.clipboard.writeText(link)
      messageApi.success('링크가 복사되었습니다!')
    } catch {
      messageApi.error('링크 복사에 실패했습니다')
    }
  }

  // 공유하기
  const handleShare = async () => {
    if (!shareCode) return
    const link = `${window.location.origin}/battle/join/${shareCode}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: '사주 대결에 도전하세요!',
          text: profile
            ? `${profile.dayMaster}일간이 도전장을 보냈습니다! 누가 더 운이 좋을까요?`
            : '사주 대결에 도전하세요! 누가 더 운이 좋을까요?',
          url: link,
        })
      } catch {
        // 사용자가 공유를 취소한 경우 무시
      }
    } else {
      handleCopyLink()
    }
  }

  // 스탯 점수 등급 클래스
  const getScoreClass = (score: number) => {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'normal'
    return 'low'
  }

  // 게스트 사용자
  if (user?.isGuest) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#f97316',
            borderRadius: 12,
            fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
          },
        }}
      >
        <App>
          <div className="battle-page">
            <SEO
              title="사주 대결"
              description="친구와 사주 운세를 비교하고 대결해보세요!"
              path="/battle"
            />
            <header className="battle-header">
              <button className="back-btn" onClick={() => navigate('/')}>←</button>
              <h1>사주 대결</h1>
              <div style={{ width: 40 }} />
            </header>
            <div className="battle-content">
              <div className="guest-block">
                <span className="block-icon">🔒</span>
                <h3>회원 전용 서비스입니다</h3>
                <p>사주 대결은 회원 전용 서비스입니다.<br />로그인 후 이용해주세요!</p>
                <Button type="primary" size="large" onClick={() => navigate('/login')}>
                  로그인하기
                </Button>
              </div>
            </div>
          </div>
        </App>
      </ConfigProvider>
    )
  }

  // 로딩 상태
  if (loading) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#f97316',
            borderRadius: 12,
            fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
          },
        }}
      >
        <App>
          <div className="battle-page">
            <SEO
              title="사주 대결"
              description="친구와 사주 운세를 비교하고 대결해보세요!"
              path="/battle"
            />
            <header className="battle-header">
              <button className="back-btn" onClick={() => navigate('/')}>←</button>
              <h1>사주 대결</h1>
              <div style={{ width: 40 }} />
            </header>
            <div className="battle-content">
              <div className="loading-state">
                <Spin size="large" />
                <p style={{ color: '#a1a1aa', marginTop: 16 }}>프로필을 불러오는 중...</p>
              </div>
            </div>
          </div>
        </App>
      </ConfigProvider>
    )
  }

  // 일주 계산
  const ilju = profile
    ? `${profile.pillars.day.heavenlyStem}${profile.pillars.day.earthlyBranch}`
    : ''

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#f97316',
          borderRadius: 12,
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
        },
      }}
    >
      <App>
        {contextHolder}
        <div className="battle-page">
          <SEO
            title="사주 대결"
            description="친구와 사주 운세를 비교하고 대결해보세요! 링크를 공유하고 누가 더 운이 좋은지 겨뤄보세요."
            path="/battle"
          />
          <header className="battle-header">
            <button className="back-btn" onClick={() => navigate('/')}>←</button>
            <h1>⚔️ 사주 대결</h1>
            <div style={{ width: 40 }} />
          </header>

          <div className="battle-content">
            {/* 인트로 */}
            <div className="battle-intro">
              <div className="intro-icon">🏆</div>
              <h2>친구와 운세 대결!</h2>
              <p>
                AI가 분석한 사주로<br />
                누가 더 운이 좋은지 겨뤄보세요
              </p>
            </div>

            {/* 프로필 없는 경우 */}
            {!hasProfile && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 16,
                padding: 32,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔮</div>
                <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                  사주 분석이 필요합니다
                </h3>
                <p style={{ color: '#a1a1aa', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                  대결을 시작하려면 먼저 사주 분석을 완료해주세요.<br />
                  분석된 사주 프로필이 대결에 사용됩니다.
                </p>
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate('/saju')}
                  style={{
                    height: 48,
                    fontSize: 16,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  }}
                >
                  🔮 사주 분석하러 가기
                </Button>
              </div>
            )}

            {/* 프로필 있는 경우 */}
            {hasProfile && profile && !shareCode && (
              <>
                {/* 프로필 요약 카드 */}
                <div className="saju-profile-card">
                  <div className="profile-symbol">
                    {DAY_MASTER_SYMBOLS[profile.dayMaster] || '☯'}
                  </div>
                  <div className="profile-info">
                    <div className="profile-ilju">{ilju}</div>
                    <div className="profile-element" style={{ color: ELEMENT_COLORS[profile.dayMasterElement] }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 8,
                          backgroundColor: `${ELEMENT_COLORS[profile.dayMasterElement]}22`,
                          color: ELEMENT_COLORS[profile.dayMasterElement],
                          fontSize: 12,
                          fontWeight: 600,
                          marginRight: 6,
                        }}
                      >
                        {profile.dayMasterElement}
                      </span>
                      {profile.dayMaster}일간
                    </div>
                  </div>
                </div>

                {/* 배틀 스탯 미리보기 */}
                <div className="battle-stats-section">
                  <h3 className="section-title">⚔️ 배틀 스탯</h3>
                  <div className="stats-grid">
                    {(Object.keys(profile.battleStats) as (keyof BattleStats)[]).map((key) => {
                      const stat = profile.battleStats[key]
                      return (
                        <div key={key} className={`stat-card ${getScoreClass(stat.score)}`}>
                          <span className="stat-icon">{STAT_ICONS[key]}</span>
                          <span className="stat-name">{STAT_NAMES[key]}</span>
                          <span className="stat-score">{stat.score}</span>
                          <span className="stat-grade">{stat.grade}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 대결 생성 버튼 */}
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleCreateBattle}
                  loading={isCreating}
                  disabled={isCreating}
                  style={{
                    height: 56,
                    fontSize: 18,
                    fontWeight: 700,
                    marginTop: 16,
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  }}
                >
                  {isCreating ? '대결 생성 중...' : '⚔️ 대결 생성하기 (20쌀)'}
                </Button>

                <p className="battle-note">
                  💡 대결 링크를 친구에게 공유하면 대결이 시작됩니다
                </p>
              </>
            )}

            {/* 대결 생성 완료 - 공유 화면 */}
            {shareCode && (
              <div className="share-section">
                <div style={{
                  textAlign: 'center',
                  marginBottom: 24,
                }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                    대결이 생성되었습니다!
                  </h3>
                  <p style={{ color: '#a1a1aa', fontSize: 14 }}>
                    아래 코드나 링크를 친구에게 공유하세요
                  </p>
                </div>

                <div className="share-code-box">
                  <span className="share-label">대결 코드</span>
                  <span className="share-code">{shareCode}</span>
                </div>

                <div className="share-buttons">
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleShare}
                    style={{ flex: 1 }}
                  >
                    📤 공유하기
                  </Button>
                  <Button
                    size="large"
                    onClick={handleCopyLink}
                    style={{ flex: 1 }}
                  >
                    📋 링크 복사
                  </Button>
                </div>

                <p className="share-note">
                  친구에게 링크를 공유하면 대결이 시작됩니다!
                </p>

                <Button
                  type="default"
                  size="large"
                  block
                  onClick={() => navigate('/mypage')}
                  style={{ marginTop: 16 }}
                >
                  내 대결 목록 보기
                </Button>
              </div>
            )}
          </div>
        </div>
      </App>
    </ConfigProvider>
  )
}
