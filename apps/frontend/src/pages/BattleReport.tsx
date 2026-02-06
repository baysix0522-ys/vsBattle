import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button, message, ConfigProvider, theme, App } from 'antd'
import { useAuth } from '../contexts/AuthContext'
import { battleApi, type BattleStats, type SajuBasicAnalysis, type SajuDetailedReport, type SajuAdvice, type SajuPillars } from '../api/client'

// 일간 심볼
const DAY_MASTER_SYMBOLS: Record<string, string> = {
  갑: '🌲', 을: '🌿', 병: '☀️', 정: '🕯️', 무: '⛰️',
  기: '🌾', 경: '⚔️', 신: '💎', 임: '🌊', 계: '💧',
}

// 오행 색상
const ELEMENT_COLORS: Record<string, string> = {
  목: '#22c55e', 화: '#ef4444', 토: '#a16207', 금: '#eab308', 수: '#3b82f6',
}

// 배틀 스탯 아이콘
const STAT_ICONS: Record<string, string> = {
  money: '💰', love: '💕', children: '👶',
  career: '💼', study: '📚', health: '💪',
}

const STAT_NAMES: Record<string, string> = {
  money: '금전운', love: '연애운', children: '자식운',
  career: '직장운', study: '학업운', health: '건강운',
}

type LocationState = {
  reportId: string
  result: {
    pillars: SajuPillars
    basic: SajuBasicAnalysis
    battleStats: BattleStats
    report: SajuDetailedReport
    advice: SajuAdvice
  }
  isExisting: boolean
}

export default function BattleReport() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useAuth()
  const [messageApi, contextHolder] = message.useMessage()
  const [isCreating, setIsCreating] = useState(false)
  const [shareCode, setShareCode] = useState<string | null>(null)

  const state = location.state as LocationState | null

  if (!state) {
    return (
      <div className="battle-page">
        <header className="battle-header">
          <button className="back-btn" onClick={() => navigate('/battle')}>←</button>
          <h1>사주 분석 결과</h1>
          <div style={{ width: 40 }} />
        </header>
        <div className="battle-content">
          <div className="error-state">
            <span>❌</span>
            <p>분석 결과를 찾을 수 없습니다</p>
            <Button onClick={() => navigate('/battle')}>다시 분석하기</Button>
          </div>
        </div>
      </div>
    )
  }

  const { reportId, result } = state
  const { basic, battleStats, report, advice, pillars } = result

  const handleCreateBattle = async () => {
    if (!token) {
      messageApi.error('로그인이 필요합니다')
      return
    }

    setIsCreating(true)
    try {
      const res = await battleApi.createBattle(token, reportId)
      setShareCode(res.shareCode)
      messageApi.success('대결이 생성되었습니다!')
    } catch (err) {
      console.error('대결 생성 실패:', err)
      messageApi.error('대결 생성에 실패했습니다')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/battle/join/${shareCode}`
    navigator.clipboard.writeText(link)
    messageApi.success('링크가 복사되었습니다!')
  }

  const handleShare = async () => {
    const link = `${window.location.origin}/battle/join/${shareCode}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: '사주 대결에 도전하세요!',
          text: `${basic.dayMaster}일간이 도전장을 보냈습니다! 누가 더 운이 좋을까요?`,
          url: link,
        })
      } catch {
        handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    if (score >= 40) return 'normal'
    return 'low'
  }

  // 일주 표현
  const ilju = `${pillars.day.heavenlyStem}${pillars.day.earthlyBranch}`

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
        {contextHolder}
        <div className="battle-page">
          <header className="battle-header">
            <button className="back-btn" onClick={() => navigate('/battle')}>←</button>
            <h1>내 사주 분석</h1>
            <div style={{ width: 40 }} />
          </header>

          <div className="battle-content">
            {/* 스텝 인디케이터 */}
            <div className="battle-steps">
              <div className="step done">
                <span className="step-num">✓</span>
                <span className="step-text">내 사주 분석</span>
              </div>
              <div className="step-arrow">→</div>
              <div className="step active">
                <span className="step-num">2</span>
                <span className="step-text">대결 링크 공유</span>
              </div>
              <div className="step-arrow">→</div>
              <div className="step">
                <span className="step-num">3</span>
                <span className="step-text">대결 결과 확인!</span>
              </div>
            </div>

            {/* 프로필 카드 */}
            <div className="saju-profile-card">
              <div className="profile-symbol">
                {DAY_MASTER_SYMBOLS[basic.dayMaster] || '☯'}
              </div>
              <div className="profile-info">
                <div className="profile-ilju">{ilju}</div>
                <div className="profile-element" style={{ color: ELEMENT_COLORS[basic.dayMasterElement] }}>
                  {basic.dayMaster}일간 · {basic.dayMasterElement}오행
                </div>
                <div className="profile-balance">
                  {basic.balance === 'strong' ? '신강' : basic.balance === 'weak' ? '신약' : '중화'} · {basic.geukGuk}
                </div>
              </div>
            </div>

            {/* 배틀 스탯 */}
            <div className="battle-stats-section">
              <h3 className="section-title">⚔️ 배틀 스탯</h3>
              <div className="stats-grid">
                {(Object.keys(battleStats) as (keyof BattleStats)[]).map((key) => {
                  const stat = battleStats[key]
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

            {/* 요약 */}
            <div className="report-summary">
              <h3 className="section-title">📜 사주 요약</h3>
              <p>{report.summary}</p>
            </div>

            {/* 성격 */}
            <div className="report-section">
              <h4>🎭 성격</h4>
              <p>{report.personality}</p>
            </div>

            {/* 조언 */}
            <div className="advice-card">
              <h4>💡 인생 조언</h4>
              <p className="main-advice">{advice.mainAdvice}</p>
              <div className="lucky-items">
                <span>🎨 {advice.luckyColor}</span>
                <span>🔢 {advice.luckyNumber}</span>
                <span>🧭 {advice.luckyDirection}</span>
              </div>
            </div>

            {/* 대결 생성/공유 버튼 */}
            {!shareCode ? (
              <Button
                type="primary"
                size="large"
                block
                onClick={handleCreateBattle}
                loading={isCreating}
                style={{
                  height: 56,
                  fontSize: 18,
                  fontWeight: 700,
                  marginTop: 24,
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                }}
              >
                {isCreating ? '대결 생성 중...' : '⚔️ 대결 신청하기'}
              </Button>
            ) : (
              <div className="share-section">
                <div className="share-code-box">
                  <span className="share-label">대결 코드</span>
                  <span className="share-code">{shareCode}</span>
                </div>
                <div className="share-buttons">
                  <Button type="primary" size="large" onClick={handleShare} style={{ flex: 1 }}>
                    📤 공유하기
                  </Button>
                  <Button size="large" onClick={handleCopyLink} style={{ flex: 1 }}>
                    📋 링크 복사
                  </Button>
                </div>
                <p className="share-note">
                  친구에게 링크를 공유하면 대결이 시작됩니다!
                </p>
              </div>
            )}
          </div>
        </div>
      </App>
    </ConfigProvider>
  )
}
