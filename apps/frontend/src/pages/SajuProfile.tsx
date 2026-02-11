import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { DatePicker, Select, Radio, Button, Spin, ConfigProvider, theme, App, message } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import koKR from 'antd/locale/ko_KR'
import { useAuth } from '../contexts/AuthContext'
import {
  sajuApi,
  type SajuProfile as SajuProfileType,
  type BattleBirthInfo,
  type BattleStats,
  type PremiumAnalysis,
  ApiError,
} from '../api/client'
import SEO from '../components/SEO'

dayjs.locale('ko')

type Gender = 'male' | 'female'

// ============================================
// 매핑 상수
// ============================================

const DAY_MASTER_SYMBOLS: Record<string, string> = {
  갑: '🌲', 을: '🌿', 병: '☀️', 정: '🕯️', 무: '⛰️',
  기: '🌾', 경: '⚔️', 신: '💎', 임: '🌊', 계: '💧',
}

const STEM_HANJA: Record<string, string> = {
  갑: '甲', 을: '乙', 병: '丙', 정: '丁', 무: '戊',
  기: '己', 경: '庚', 신: '辛', 임: '壬', 계: '癸',
}

const BRANCH_HANJA: Record<string, string> = {
  자: '子', 축: '丑', 인: '寅', 묘: '卯', 진: '辰', 사: '巳',
  오: '午', 미: '未', 신: '申', 유: '酉', 술: '戌', 해: '亥',
}

const STEM_ELEMENT: Record<string, string> = {
  갑: '목', 을: '목', 병: '화', 정: '화', 무: '토',
  기: '토', 경: '금', 신: '금', 임: '수', 계: '수',
}

const BRANCH_ELEMENT: Record<string, string> = {
  자: '수', 축: '토', 인: '목', 묘: '목', 진: '토', 사: '화',
  오: '화', 미: '토', 신: '금', 유: '금', 술: '토', 해: '수',
}

const STEM_YINYANG: Record<string, string> = {
  갑: '양', 을: '음', 병: '양', 정: '음', 무: '양',
  기: '음', 경: '양', 신: '음', 임: '양', 계: '음',
}

const ELEMENT_COLORS: Record<string, string> = {
  목: '#22c55e', 화: '#ef4444', 토: '#ca8a04', 금: '#a1a1aa', 수: '#3b82f6',
}

const ELEMENT_BG_COLORS: Record<string, string> = {
  목: 'rgba(34, 197, 94, 0.15)', 화: 'rgba(239, 68, 68, 0.15)',
  토: 'rgba(202, 138, 4, 0.15)', 금: 'rgba(161, 161, 170, 0.15)',
  수: 'rgba(59, 130, 246, 0.15)',
}

const ELEMENT_HANJA: Record<string, string> = {
  목: '木', 화: '火', 토: '土', 금: '金', 수: '水',
}

const BALANCE_LABELS = ['극약', '태약', '신약', '중화', '신강', '태강', '극왕']

const STAT_ICONS: Record<string, string> = {
  money: '💰', love: '💕', children: '👶',
  career: '💼', study: '📚', health: '💪',
}

const STAT_NAMES: Record<string, string> = {
  money: '금전운', love: '연애운', children: '자식운',
  career: '직장운', study: '학업운', health: '건강운',
}

// 분석 중 로딩 메시지
const ANALYSIS_STEPS = [
  { icon: '☯️', text: '사주 원국을 세우고 있습니다...' },
  { icon: '🔮', text: '천간과 지지를 분석하고 있습니다...' },
  { icon: '⚖️', text: '오행의 균형을 살피고 있습니다...' },
  { icon: '📊', text: '십신 관계를 파악하고 있습니다...' },
  { icon: '🔄', text: '대운의 흐름을 계산하고 있습니다...' },
  { icon: '⭐', text: '신살과 귀인을 판별하고 있습니다...' },
  { icon: '💪', text: '신강신약을 판단하고 있습니다...' },
  { icon: '📝', text: '종합 분석을 정리하고 있습니다...' },
]

const PREMIUM_STEPS = [
  { icon: '💕', text: '운명의 짝을 분석하고 있습니다...' },
  { icon: '💰', text: '시기별 재산운을 살피고 있습니다...' },
  { icon: '⚠️', text: '운명의 고비를 분석하고 있습니다...' },
  { icon: '📝', text: '심층 분석을 정리하고 있습니다...' },
]

const hourOptions = [
  { value: 'unknown', label: '모름' },
  { value: '00:00', label: '자시 (23:30~01:29)' },
  { value: '02:00', label: '축시 (01:30~03:29)' },
  { value: '04:00', label: '인시 (03:30~05:29)' },
  { value: '06:00', label: '묘시 (05:30~07:29)' },
  { value: '08:00', label: '진시 (07:30~09:29)' },
  { value: '10:00', label: '사시 (09:30~11:29)' },
  { value: '12:00', label: '오시 (11:30~13:29)' },
  { value: '14:00', label: '미시 (13:30~15:29)' },
  { value: '16:00', label: '신시 (15:30~17:29)' },
  { value: '18:00', label: '유시 (17:30~19:29)' },
  { value: '20:00', label: '술시 (19:30~21:29)' },
  { value: '22:00', label: '해시 (21:30~23:29)' },
]

function getScoreClass(score: number): string {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'normal'
  return 'low'
}

function getElementStatus(pct: number): string {
  if (pct === 0) return '부재'
  if (pct <= 15) return '적정'
  if (pct <= 25) return '발달'
  return '과다'
}

// ============================================
// 스타일 객체
// ============================================
const S = {
  section: {
    background: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: '20px 16px',
    marginBottom: 20,
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#e4e4e7',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } as React.CSSProperties,
  tableCell: {
    textAlign: 'center' as const,
    padding: '6px 4px',
    fontSize: 12,
    color: '#a1a1aa',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  } as React.CSSProperties,
  tableCellBold: {
    textAlign: 'center' as const,
    padding: '8px 4px',
    fontSize: 18,
    fontWeight: 700,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  } as React.CSSProperties,
  label: {
    fontSize: 11,
    color: '#71717a',
    textAlign: 'center' as const,
    padding: '4px',
  } as React.CSSProperties,
}

// ============================================
// 컴포넌트
// ============================================

export default function SajuProfile() {
  const navigate = useNavigate()
  const { user, token, isLoading: authLoading, updateRice } = useAuth()
  const [messageApi, contextHolder] = message.useMessage()

  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const [profile, setProfile] = useState<SajuProfileType | null>(null)

  const [birthDate, setBirthDate] = useState<Dayjs | null>(null)
  const [hour, setHour] = useState<string>('unknown')
  const [gender, setGender] = useState<Gender | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReanalyzing, setIsReanalyzing] = useState(false)

  // 생년월일 수정 모드
  const [showEditForm, setShowEditForm] = useState(false)

  // Premium
  const [premiumLoading, setPremiumLoading] = useState(false)
  const [expandedCrisis, setExpandedCrisis] = useState<number | null>(null)

  // 분석 진행 단계 표시
  const [analysisStep, setAnalysisStep] = useState(0)
  const isAnalyzing = isSubmitting || isReanalyzing

  useEffect(() => {
    if (!isAnalyzing && !premiumLoading) {
      setAnalysisStep(0)
      return
    }
    const steps = premiumLoading ? PREMIUM_STEPS : ANALYSIS_STEPS
    const interval = setInterval(() => {
      setAnalysisStep(prev => (prev + 1) % steps.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [isAnalyzing, premiumLoading])

  const fetchProfile = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await sajuApi.getProfile(token)
      setHasProfile(res.hasProfile)
      setProfile(res.profile)
    } catch (err) {
      console.error('사주 프로필 로드 실패:', err)
      messageApi.error('프로필을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [token, messageApi])

  useEffect(() => {
    if (!authLoading && token) {
      fetchProfile()
    } else if (!authLoading && !token) {
      setLoading(false)
    }
  }, [authLoading, token, fetchProfile])

  const handleSubmit = async () => {
    setFormError(null)
    if (!birthDate) { setFormError('생년월일을 선택해주세요.'); return }
    if (!gender) { setFormError('성별을 선택해주세요.'); return }
    if (!token) { setFormError('로그인이 필요합니다.'); return }

    const birthInfo: BattleBirthInfo = {
      birthDate: birthDate.format('YYYY-MM-DD'),
      isTimeUnknown: hour === 'unknown',
      gender,
      ...(hour !== 'unknown' ? { birthTime: hour } : {}),
    }

    setIsSubmitting(true)
    try {
      const res = await sajuApi.analyze(token, birthInfo)
      updateRice(res.riceBalance)
      messageApi.success('사주 분석이 완료되었습니다!')
      await fetchProfile()
    } catch (err) {
      console.error('사주 분석 실패:', err)
      if (err instanceof ApiError && err.message.includes('쌀')) {
        setFormError('쌀이 부족합니다. 쌀을 충전한 후 다시 시도해주세요.')
      } else {
        setFormError(err instanceof Error ? err.message : '사주 분석 중 오류가 발생했습니다.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // 생년월일 수정 폼 열 때 기존 프로필 데이터로 초기화
  const handleOpenEditForm = () => {
    if (profile) {
      setBirthDate(dayjs(profile.birthDate))
      setHour(profile.isTimeUnknown ? 'unknown' : (profile.birthTime ?? 'unknown'))
      setGender(profile.gender as Gender)
    }
    setShowEditForm(true)
  }

  const handleEditSubmit = async () => {
    setFormError(null)
    if (!birthDate) { setFormError('생년월일을 선택해주세요.'); return }
    if (!gender) { setFormError('성별을 선택해주세요.'); return }
    if (!token) { setFormError('로그인이 필요합니다.'); return }

    const birthInfo: BattleBirthInfo = {
      birthDate: birthDate.format('YYYY-MM-DD'),
      isTimeUnknown: hour === 'unknown',
      gender,
      ...(hour !== 'unknown' ? { birthTime: hour } : {}),
    }

    setIsReanalyzing(true)
    try {
      const res = await sajuApi.analyze(token, birthInfo)
      updateRice(res.riceBalance)
      messageApi.success('사주 분석이 완료되었습니다!')
      setShowEditForm(false)
      await fetchProfile()
    } catch (err) {
      console.error('재분석 실패:', err)
      if (err instanceof ApiError && err.message.includes('쌀')) {
        messageApi.error({
          content: (
            <span>
              쌀이 부족합니다.{' '}
              <a onClick={() => navigate('/shop')} style={{ color: '#f97316', textDecoration: 'underline', cursor: 'pointer' }}>
                충전하러 가기
              </a>
            </span>
          ),
          duration: 5,
        })
      } else {
        setFormError(err instanceof Error ? err.message : '사주 분석 중 오류가 발생했습니다.')
      }
    } finally {
      setIsReanalyzing(false)
    }
  }

  const handleUnlockPremium = async () => {
    if (!token) return
    setPremiumLoading(true)
    try {
      const res = await sajuApi.getPremium(token)
      if (res.riceBalance !== undefined) {
        updateRice(res.riceBalance)
      }
      // Refresh profile to include premium data
      await fetchProfile()
      messageApi.success('프리미엄 분석이 완료되었습니다!')
    } catch (err) {
      console.error('프리미엄 분석 실패:', err)
      if (err instanceof ApiError && err.message.includes('쌀')) {
        messageApi.error({
          content: (
            <span>
              쌀이 부족합니다.{' '}
              <a onClick={() => navigate('/shop')} style={{ color: '#f97316', textDecoration: 'underline', cursor: 'pointer' }}>
                충전하러 가기
              </a>
            </span>
          ),
          duration: 5,
        })
      } else {
        messageApi.error(err instanceof Error ? err.message : '프리미엄 분석 중 오류가 발생했습니다.')
      }
    } finally {
      setPremiumLoading(false)
    }
  }

  const themeConfig = {
    algorithm: theme.darkAlgorithm,
    token: {
      colorPrimary: '#f97316',
      borderRadius: 12,
      fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
    },
  }

  // --- Guest / not logged in ---
  if (!authLoading && (!user || !token || user.isGuest)) {
    return (
      <ConfigProvider locale={koKR} theme={themeConfig}>
        <App>
          <div className="battle-page">
            <SEO title="내 사주 프로필" description="나만의 사주 프로필을 만들고 운세를 확인해보세요." path="/saju" />
            <header className="battle-header">
              <button className="back-btn" onClick={() => navigate('/')}>←</button>
              <h1>내 사주 프로필</h1>
              <div style={{ width: 40 }} />
            </header>
            <div className="battle-content">
              <div className="guest-block">
                <span className="block-icon">🔒</span>
                <h3>회원 전용 서비스입니다</h3>
                <p>사주 프로필은 회원만 이용할 수 있습니다.<br />로그인하고 나만의 사주 분석을 받아보세요!</p>
                <Button type="primary" size="large" onClick={() => navigate('/login?redirect=/saju')}
                  style={{ height: 48, fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
                  로그인하기
                </Button>
              </div>
            </div>
          </div>
        </App>
      </ConfigProvider>
    )
  }

  // --- Loading ---
  if (authLoading || loading) {
    return (
      <ConfigProvider locale={koKR} theme={themeConfig}>
        <App>
          <div className="battle-page">
            <SEO title="내 사주 프로필" description="나만의 사주 프로필을 만들고 운세를 확인해보세요." path="/saju" />
            <div className="loading-center" style={{ minHeight: '100vh' }}>
              <Spin size="large" />
              <p style={{ color: '#a1a1aa', marginTop: 12 }}>프로필을 불러오는 중...</p>
            </div>
          </div>
        </App>
      </ConfigProvider>
    )
  }

  // --- No profile: show form ---
  if (!hasProfile || !profile) {
    return (
      <ConfigProvider locale={koKR} theme={themeConfig}>
        <App>
          {contextHolder}
          {/* 분석 중 오버레이 */}
          {isSubmitting && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.88)', zIndex: 1000,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
            }}>
              <div style={{ fontSize: 48, transition: 'opacity 0.3s', animation: 'sajuPulse 2s ease-in-out infinite' }}>
                {ANALYSIS_STEPS[analysisStep]?.icon}
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 16, color: '#e4e4e7', fontWeight: 600, marginBottom: 8, transition: 'opacity 0.3s' }}>
                  {ANALYSIS_STEPS[analysisStep]?.text}
                </p>
                <p style={{ fontSize: 12, color: '#71717a' }}>
                  AI가 사주를 정밀 분석하고 있습니다
                </p>
              </div>
              <div style={{ width: 200, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f97316, #ea580c)',
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <p style={{ fontSize: 11, color: '#52525b' }}>약 15~20초 소요됩니다</p>
              <style>{`@keyframes sajuPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.8; } }`}</style>
            </div>
          )}
          <div className="battle-page">
            <SEO title="내 사주 프로필" description="생년월일시와 성별을 입력하고 AI 사주 분석을 받아보세요." path="/saju" />
            <header className="battle-header">
              <button className="back-btn" onClick={() => navigate('/')}>←</button>
              <h1>내 사주 프로필</h1>
              <div style={{ width: 40 }} />
            </header>
            <div className="battle-content">
              <div className="battle-intro">
                <div className="intro-icon">☯️</div>
                <h2>나만의 사주 프로필</h2>
                <p>AI가 분석하는 정밀 사주 풀이<br />나의 타고난 운명을 확인해보세요</p>
              </div>
              {formError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#ef4444', fontSize: 14, textAlign: 'center' }}>
                  {formError}
                  {formError.includes('쌀이 부족') && (
                    <Button type="link" onClick={() => navigate('/shop')} style={{ color: '#f97316', padding: '4px 8px' }}>쌀 충전하러 가기</Button>
                  )}
                </div>
              )}
              <div className="battle-form">
                <div className="form-section">
                  <label className="section-label">생년월일 (양력)</label>
                  <DatePicker value={birthDate} onChange={setBirthDate} placeholder="생년월일 선택" size="large" style={{ width: '100%' }}
                    disabledDate={(current) => current && current > dayjs().endOf('day')} showToday={false} defaultPickerValue={dayjs().subtract(25, 'year')} />
                </div>
                <div className="form-section">
                  <label className="section-label">태어난 시간</label>
                  <Select value={hour} onChange={setHour} options={hourOptions} size="large" style={{ width: '100%' }} popupMatchSelectWidth={false} />
                  <p className="helper-text">시간을 모르면 &quot;모름&quot;을 선택해주세요</p>
                </div>
                <div className="form-section">
                  <label className="section-label">성별</label>
                  <Radio.Group value={gender} onChange={(e) => setGender(e.target.value)} size="large" style={{ width: '100%' }} optionType="button" buttonStyle="solid">
                    <Radio.Button value="male" style={{ width: '50%', textAlign: 'center' }}>👨 남성</Radio.Button>
                    <Radio.Button value="female" style={{ width: '50%', textAlign: 'center' }}>👩 여성</Radio.Button>
                  </Radio.Group>
                </div>
                <Button type="primary" size="large" block onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}
                  style={{ height: 56, fontSize: 18, fontWeight: 700, marginTop: 16, background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
                  {isSubmitting ? 'AI가 분석 중...' : '🔮 사주 분석하기 (50쌀)'}
                </Button>
              </div>
              <p className="battle-note">🍚 현재 보유 쌀: {user?.rice.toLocaleString() ?? 0}</p>
            </div>
          </div>
        </App>
      </ConfigProvider>
    )
  }

  // ============================================
  // 결과 표시
  // ============================================
  const { basic, battleStats, report, advice, pillars, twelveStages, specialStars, noblePeople, daewoonTable, balanceScore, premiumAnalysis } = profile
  const ilju = `${pillars.day.heavenlyStem}${pillars.day.earthlyBranch}`
  const elementColor = ELEMENT_COLORS[basic.dayMasterElement] || '#f97316'
  const nickname = user?.nickname || '회원'

  // 오행 분포 계산
  const dist = basic.elementDistribution || { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  const totalEl = dist.wood + dist.fire + dist.earth + dist.metal + dist.water || 1
  const elementBars = [
    { key: '목', hanja: '木', count: dist.wood, color: ELEMENT_COLORS['목']! },
    { key: '화', hanja: '火', count: dist.fire, color: ELEMENT_COLORS['화']! },
    { key: '토', hanja: '土', count: dist.earth, color: ELEMENT_COLORS['토']! },
    { key: '금', hanja: '金', count: dist.metal, color: ELEMENT_COLORS['금']! },
    { key: '수', hanja: '水', count: dist.water, color: ELEMENT_COLORS['수']! },
  ]

  // 현재 나이 계산 (대운 하이라이트용)
  const birthYear = parseInt(profile.birthDate.substring(0, 4))
  const currentAge = new Date().getFullYear() - birthYear

  // sipsin from basic (might be stored there)
  const sipsin = (basic as Record<string, unknown>).sipsin as { year?: { stem: string; branch: string }; month?: { stem: string; branch: string }; day?: { stem: string; branch: string }; hour?: { stem: string; branch: string } | null } | undefined

  const pillarKeys = ['hour', 'day', 'month', 'year'] as const
  const pillarLabels: Record<string, string> = { year: '年', month: '月', day: '日', hour: '時' }
  const pillarKorLabels: Record<string, string> = { year: '년주', month: '월주', day: '일주', hour: '시주' }

  const analysisCategories = [
    { key: 'moneyAnalysis', statKey: 'money', label: '금전운', icon: '💰' },
    { key: 'loveAnalysis', statKey: 'love', label: '연애운', icon: '💕' },
    { key: 'childrenAnalysis', statKey: 'children', label: '자식운', icon: '👶' },
    { key: 'careerAnalysis', statKey: 'career', label: '직장운', icon: '💼' },
    { key: 'studyAnalysis', statKey: 'study', label: '학업운', icon: '📚' },
    { key: 'healthAnalysis', statKey: 'health', label: '건강운', icon: '💪' },
  ] as const

  return (
    <ConfigProvider locale={koKR} theme={themeConfig}>
      <App>
        {contextHolder}
        {/* 재분석/프리미엄 분석 중 오버레이 */}
        {(isReanalyzing || premiumLoading) && (() => {
          const steps = premiumLoading ? PREMIUM_STEPS : ANALYSIS_STEPS
          const step = steps[analysisStep] ?? steps[0]!
          return (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0, 0, 0, 0.88)', zIndex: 1000,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
            }}>
              <div style={{ fontSize: 48, animation: 'sajuPulse 2s ease-in-out infinite' }}>
                {step.icon}
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 16, color: '#e4e4e7', fontWeight: 600, marginBottom: 8 }}>
                  {step.text}
                </p>
                <p style={{ fontSize: 12, color: '#71717a' }}>
                  {premiumLoading ? 'AI가 심층 분석을 진행하고 있습니다' : 'AI가 사주를 정밀 분석하고 있습니다'}
                </p>
              </div>
              <div style={{ width: 200, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  width: `${((analysisStep + 1) / steps.length) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f97316, #ea580c)',
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <p style={{ fontSize: 11, color: '#52525b' }}>
                {premiumLoading ? '약 10~15초 소요됩니다' : '약 15~20초 소요됩니다'}
              </p>
              <style>{`@keyframes sajuPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.8; } }`}</style>
            </div>
          )
        })()}
        <div className="battle-page">
          <SEO
            title="내 사주 프로필"
            description={`${basic.dayMaster}일간 ${basic.dayMasterElement}오행 사주 분석 결과. 금전운, 연애운, 직장운 등 상세 분석을 확인하세요.`}
            path="/saju"
          />
          <header className="battle-header">
            <button className="back-btn" onClick={() => navigate('/')}>←</button>
            <h1>내 사주 프로필</h1>
            <div style={{ width: 40 }} />
          </header>

          <div className="battle-content">
            {/* ====== A. 프로필 카드 ====== */}
            <div className="saju-profile-card">
              <div className="profile-symbol">{DAY_MASTER_SYMBOLS[basic.dayMaster] || '☯'}</div>
              <div className="profile-info">
                <div className="profile-ilju">{ilju}</div>
                <div className="profile-element" style={{ color: elementColor }}>
                  {basic.dayMaster}일간 · {basic.dayMasterElement}오행
                </div>
                <div className="profile-balance">
                  {basic.balance === 'strong' ? '신강' : basic.balance === 'weak' ? '신약' : '중화'} · {basic.geukGuk}
                </div>
              </div>
            </div>

            {/* ====== B. 사주 원국표 ====== */}
            <div style={S.section}>
              <h3 style={S.sectionTitle}>📜 사주 원국표</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <td style={{ ...S.label, width: 50 }}></td>
                      {pillarKeys.map(k => (
                        <th key={k} style={{
                          ...S.label,
                          fontWeight: 700,
                          color: k === 'day' ? elementColor : '#a1a1aa',
                          fontSize: 13,
                        }}>
                          {pillarLabels[k]} <span style={{ fontSize: 10, fontWeight: 400 }}>({pillarKorLabels[k]})</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* 십신 (천간) */}
                    <tr>
                      <td style={S.tableCell}>십신</td>
                      {pillarKeys.map(k => {
                        const p = pillars[k]
                        if (!p) return <td key={k} style={S.tableCell}>-</td>
                        const ss = sipsin?.[k]
                        return (
                          <td key={k} style={{ ...S.tableCell, color: '#d4d4d8', fontSize: 13, fontWeight: k === 'day' ? 600 : 400 }}>
                            {k === 'day' ? '일간' : (ss?.stem || '-')}
                          </td>
                        )
                      })}
                    </tr>
                    {/* 천간 */}
                    <tr>
                      <td style={S.tableCell}>천간</td>
                      {pillarKeys.map(k => {
                        const p = pillars[k]
                        if (!p) return <td key={k} style={{ ...S.tableCellBold, color: '#3f3f46' }}>?</td>
                        const el = STEM_ELEMENT[p.heavenlyStem] || '토'
                        const yy = STEM_YINYANG[p.heavenlyStem] || '양'
                        return (
                          <td key={k} style={{
                            ...S.tableCellBold,
                            color: '#fff',
                            background: k === 'day'
                              ? `linear-gradient(135deg, ${elementColor}33 0%, ${elementColor}11 100%)`
                              : ELEMENT_BG_COLORS[el],
                          }}>
                            <div style={{ fontSize: 22, lineHeight: 1.2 }}>{STEM_HANJA[p.heavenlyStem] || p.heavenlyStem}</div>
                            <div style={{ fontSize: 10, color: ELEMENT_COLORS[el], marginTop: 2 }}>
                              {p.heavenlyStem} · {el}/{yy}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                    {/* 지지 */}
                    <tr>
                      <td style={S.tableCell}>지지</td>
                      {pillarKeys.map(k => {
                        const p = pillars[k]
                        if (!p) return <td key={k} style={{ ...S.tableCellBold, color: '#3f3f46' }}>?</td>
                        const el = BRANCH_ELEMENT[p.earthlyBranch] || '토'
                        return (
                          <td key={k} style={{
                            ...S.tableCellBold,
                            color: '#d4d4d8',
                            background: k === 'day'
                              ? `linear-gradient(135deg, ${elementColor}22 0%, ${elementColor}08 100%)`
                              : ELEMENT_BG_COLORS[el],
                          }}>
                            <div style={{ fontSize: 22, lineHeight: 1.2 }}>{BRANCH_HANJA[p.earthlyBranch] || p.earthlyBranch}</div>
                            <div style={{ fontSize: 10, color: ELEMENT_COLORS[el], marginTop: 2 }}>
                              {p.earthlyBranch} · {el}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                    {/* 십신 (지지) */}
                    <tr>
                      <td style={S.tableCell}>지장간</td>
                      {pillarKeys.map(k => {
                        const p = pillars[k]
                        if (!p) return <td key={k} style={S.tableCell}>-</td>
                        const ss = sipsin?.[k]
                        return (
                          <td key={k} style={{ ...S.tableCell, color: '#a1a1aa', fontSize: 12 }}>
                            {ss?.branch || '-'}
                          </td>
                        )
                      })}
                    </tr>
                    {/* 12운성 */}
                    {twelveStages && (
                      <tr>
                        <td style={S.tableCell}>12운성</td>
                        {pillarKeys.map(k => {
                          const val = twelveStages[k]
                          return (
                            <td key={k} style={{ ...S.tableCell, color: '#d4d4d8', fontSize: 13 }}>
                              {val || '-'}
                            </td>
                          )
                        })}
                      </tr>
                    )}
                    {/* 신살 */}
                    {specialStars && (
                      <tr>
                        <td style={S.tableCell}>신살</td>
                        {pillarKeys.map(k => {
                          const arr = specialStars[k]
                          return (
                            <td key={k} style={{ ...S.tableCell, color: '#fbbf24', fontSize: 11, lineHeight: 1.4 }}>
                              {arr && arr.length > 0 ? arr.join('\n') : '-'}
                            </td>
                          )
                        })}
                      </tr>
                    )}
                    {/* 귀인 */}
                    {noblePeople && (
                      <tr>
                        <td style={{ ...S.tableCell, borderBottom: 'none' }}>귀인</td>
                        {pillarKeys.map(k => {
                          const arr = noblePeople[k]
                          return (
                            <td key={k} style={{ ...S.tableCell, color: '#a78bfa', fontSize: 11, lineHeight: 1.4, borderBottom: 'none' }}>
                              {arr && arr.length > 0 ? arr.join('\n') : '-'}
                            </td>
                          )
                        })}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ====== C. 대운표 ====== */}
            {daewoonTable && daewoonTable.length > 0 && (
              <div style={S.section}>
                <h3 style={S.sectionTitle}>🔄 {nickname}님의 대운표</h3>
                <p style={{ fontSize: 12, color: '#71717a', marginBottom: 12, marginTop: -8 }}>
                  대운 주기는 {daewoonTable[0]?.startAge}세부터 10년 주기
                </p>
                <div style={{ overflowX: 'auto', paddingTop: 12, paddingBottom: 4 }}>
                  <div style={{ display: 'flex', gap: 6, minWidth: 'max-content' }}>
                    {daewoonTable.map((dw, i) => {
                      const isCurrentDw = currentAge >= dw.startAge && currentAge <= dw.endAge
                      const dwEl = STEM_ELEMENT[dw.stem] || dw.element || '토'
                      const dwStartYear = birthYear + dw.startAge
                      return (
                        <div key={i} style={{
                          textAlign: 'center',
                          padding: '10px 8px',
                          borderRadius: 10,
                          minWidth: 64,
                          background: isCurrentDw
                            ? `linear-gradient(135deg, ${elementColor}44 0%, ${elementColor}22 100%)`
                            : 'rgba(255,255,255,0.03)',
                          border: isCurrentDw ? `2px solid ${elementColor}` : '1px solid rgba(255,255,255,0.06)',
                          position: 'relative',
                        }}>
                          {isCurrentDw && (
                            <div style={{
                              position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                              background: elementColor, color: '#fff', fontSize: 9, padding: '1px 6px',
                              borderRadius: 4, fontWeight: 700, whiteSpace: 'nowrap',
                            }}>현재</div>
                          )}
                          <div style={{ fontSize: 10, color: '#71717a' }}>{dwStartYear}</div>
                          <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 4 }}>{dw.startAge}세</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: ELEMENT_COLORS[dwEl] || '#fff' }}>
                            {STEM_HANJA[dw.stem] || dw.stem}
                          </div>
                          <div style={{ fontSize: 18, color: '#d4d4d8' }}>
                            {BRANCH_HANJA[dw.branch] || dw.branch}
                          </div>
                          <div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>{dwEl}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ====== D. 오행 분포 차트 ====== */}
            <div style={S.section}>
              <h3 style={S.sectionTitle}>🔥 오행 분포</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {elementBars.map(({ key, hanja, count, color }) => {
                  const pct = Math.round((count / totalEl) * 100)
                  const status = getElementStatus(pct)
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 36, textAlign: 'right', fontSize: 13, color, fontWeight: 600 }}>
                        {key} {hanja}
                      </div>
                      <div style={{ flex: 1, height: 20, background: 'rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                        <div style={{
                          width: `${Math.max(pct, 2)}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${color}cc 0%, ${color}88 100%)`,
                          borderRadius: 10,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <div style={{ width: 80, fontSize: 11, color: '#a1a1aa', textAlign: 'right' }}>
                        {pct}% · <span style={{ color: pct > 25 ? '#fbbf24' : pct === 0 ? '#ef4444' : '#71717a' }}>{status}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ====== E. 용신/희신/기신 ====== */}
            <div style={S.section}>
              <h3 style={S.sectionTitle}>⚖️ 용신 · 희신 · 기신</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                {[
                  { label: '용신', value: basic.yongShin, desc: '필요한 오행' },
                  { label: '희신', value: basic.heeShin, desc: '보조 오행' },
                  { label: '기신', value: basic.giShin, desc: '피해야 할 오행' },
                ].map(({ label, value, desc }) => {
                  const elColor = ELEMENT_COLORS[value] || '#71717a'
                  return (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${elColor}44 0%, ${elColor}22 100%)`,
                        border: `2px solid ${elColor}66`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 8px',
                      }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: elColor }}>
                          {ELEMENT_HANJA[value] || value}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7' }}>{label}</div>
                      <div style={{ fontSize: 10, color: '#71717a' }}>{value}({ELEMENT_HANJA[value] || ''}) · {desc}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ====== F. 신강신약 게이지 ====== */}
            {balanceScore !== null && balanceScore !== undefined && (
              <div style={S.section}>
                <h3 style={S.sectionTitle}>💪 신강신약 판단</h3>
                <div style={{ padding: '0 8px' }}>
                  {/* 라벨 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    {BALANCE_LABELS.map((label, i) => (
                      <span key={i} style={{
                        fontSize: 10,
                        color: Math.round(balanceScore) - 1 === i ? elementColor : '#52525b',
                        fontWeight: Math.round(balanceScore) - 1 === i ? 700 : 400,
                      }}>{label}</span>
                    ))}
                  </div>
                  {/* 게이지 바 */}
                  <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4 }}>
                    <div style={{
                      position: 'absolute',
                      left: `${((balanceScore - 1) / 6) * 100}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 20, height: 20, borderRadius: '50%',
                      background: elementColor,
                      border: '3px solid #18181b',
                      boxShadow: `0 0 8px ${elementColor}88`,
                    }} />
                    {/* 도트 */}
                    {BALANCE_LABELS.map((_, i) => (
                      <div key={i} style={{
                        position: 'absolute',
                        left: `${(i / 6) * 100}%`,
                        top: '50%', transform: 'translate(-50%, -50%)',
                        width: 6, height: 6, borderRadius: '50%',
                        background: Math.round(balanceScore) - 1 === i ? elementColor : 'rgba(255,255,255,0.15)',
                      }} />
                    ))}
                  </div>
                  {/* 설명 */}
                  <p style={{ fontSize: 12, color: '#a1a1aa', textAlign: 'center', marginTop: 12 }}>
                    일간 &apos;{basic.dayMaster}&apos;, &apos;{BALANCE_LABELS[Math.round(balanceScore) - 1]}&apos;한 사주입니다.
                  </p>
                </div>
              </div>
            )}

            {/* ====== G. 배틀 스탯 ====== */}
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

            {/* ====== H. 상세 풀이 ====== */}
            <div className="report-summary">
              <h3 className="section-title">📜 사주 요약</h3>
              <p>{report.summary}</p>
            </div>

            <div className="report-section">
              <h4>🎭 성격</h4>
              <p>{report.personality}</p>
            </div>

            {analysisCategories.map(({ key, statKey, label, icon }) => {
              const text = report[key]
              const stat = battleStats[statKey]
              if (!text) return null
              return (
                <div key={key} className="report-section">
                  <h4>{icon} {label} 분석 <span style={{ fontSize: 13, fontWeight: 500, color: stat.score >= 70 ? '#22c55e' : stat.score >= 55 ? '#eab308' : '#ef4444' }}>({stat.grade} · {stat.score}점)</span></h4>
                  {stat.reason && (
                    <div style={{
                      background: 'rgba(139,92,246,0.08)',
                      border: '1px solid rgba(139,92,246,0.2)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      marginBottom: 10,
                      fontSize: 13,
                      color: '#c4b5fd',
                      lineHeight: 1.6,
                    }}>
                      <span style={{ fontWeight: 700, marginRight: 6 }}>근거:</span>{stat.reason}
                    </div>
                  )}
                  <p>{text}</p>
                </div>
              )
            })}

            {/* ====== I. 프리미엄 잠금 섹션 ====== */}
            {!premiumAnalysis ? (
              <div style={{
                ...S.section,
                background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(234,88,12,0.04) 100%)',
                border: '1px solid rgba(249,115,22,0.2)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🔒</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f97316', marginBottom: 8 }}>
                  {nickname}님의 숨겨진 운명
                </h3>
                <p style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 16, lineHeight: 1.6 }}>
                  운명의 짝 · 시기별 재산운 · 운명의 고비<br />
                  사주 원국에서만 읽어낼 수 있는 심층 분석
                </p>

                {/* 미리보기 (블러) */}
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{ filter: 'blur(6px)', opacity: 0.4, pointerEvents: 'none' }}>
                    <p style={{ fontSize: 13, color: '#d4d4d8', marginBottom: 8 }}>💕 운명의 짝: 따뜻하고 배려심이 깊은...</p>
                    <p style={{ fontSize: 13, color: '#d4d4d8', marginBottom: 8 }}>💰 중년기 재산 레벨: ████ (8/10)</p>
                    <p style={{ fontSize: 13, color: '#d4d4d8' }}>⚠️ 30대 초반: 대인관계의 갈등이...</p>
                  </div>
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  loading={premiumLoading}
                  disabled={premiumLoading}
                  onClick={handleUnlockPremium}
                  style={{
                    height: 52,
                    fontSize: 16,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  }}
                >
                  {premiumLoading ? '분석 중...' : '🔓 30쌀로 잠금해제'}
                </Button>
                <p style={{ fontSize: 11, color: '#71717a', marginTop: 8 }}>
                  운명의 짝 + 시기별 재산 + 운명의 고비 모두 포함
                </p>
              </div>
            ) : (
              <PremiumContent
                premium={premiumAnalysis}
                nickname={nickname}
                elementColor={elementColor}
                expandedCrisis={expandedCrisis}
                setExpandedCrisis={setExpandedCrisis}
              />
            )}

            {/* ====== J. 인생 조언 ====== */}
            <div className="advice-card">
              <h4>💡 인생 조언</h4>
              <p className="main-advice">{advice.mainAdvice}</p>
              <div className="lucky-items">
                <span>🎨 행운 색: {advice.luckyColor}</span>
                <span>🔢 행운 숫자: {advice.luckyNumber}</span>
                <span>🧭 행운 방위: {advice.luckyDirection}</span>
              </div>
            </div>

            {/* 분석 정보 */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 16px', marginBottom: 24,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#71717a',
            }}>
              <span>분석일: {new Date(profile.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>🍚 보유 쌀: {user?.rice.toLocaleString() ?? 0}</span>
            </div>

            {/* 생년월일 수정 폼 */}
            {showEditForm ? (
              <div style={{
                ...S.section,
                border: '1px solid rgba(249,115,22,0.3)',
                background: 'rgba(249,115,22,0.04)',
              }}>
                <h3 style={{ ...S.sectionTitle, color: '#f97316' }}>✏️ 생년월일 수정 후 재분석</h3>
                {formError && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#ef4444', fontSize: 14, textAlign: 'center' }}>
                    {formError}
                    {formError.includes('쌀이 부족') && (
                      <Button type="link" onClick={() => navigate('/shop')} style={{ color: '#f97316', padding: '4px 8px' }}>쌀 충전하러 가기</Button>
                    )}
                  </div>
                )}
                <div className="battle-form" style={{ marginBottom: 0 }}>
                  <div className="form-section">
                    <label className="section-label">생년월일 (양력)</label>
                    <DatePicker value={birthDate} onChange={setBirthDate} placeholder="생년월일 선택" size="large" style={{ width: '100%' }}
                      disabledDate={(current) => current && current > dayjs().endOf('day')} showToday={false} />
                  </div>
                  <div className="form-section">
                    <label className="section-label">태어난 시간</label>
                    <Select value={hour} onChange={setHour} options={hourOptions} size="large" style={{ width: '100%' }} popupMatchSelectWidth={false} />
                  </div>
                  <div className="form-section">
                    <label className="section-label">성별</label>
                    <Radio.Group value={gender} onChange={(e) => setGender(e.target.value)} size="large" style={{ width: '100%' }} optionType="button" buttonStyle="solid">
                      <Radio.Button value="male" style={{ width: '50%', textAlign: 'center' }}>👨 남성</Radio.Button>
                      <Radio.Button value="female" style={{ width: '50%', textAlign: 'center' }}>👩 여성</Radio.Button>
                    </Radio.Group>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <Button size="large" block onClick={() => { setShowEditForm(false); setFormError(null) }}
                      style={{ height: 48, fontSize: 15, fontWeight: 600, flex: 1 }}>
                      취소
                    </Button>
                    <Button type="primary" size="large" block onClick={handleEditSubmit} loading={isReanalyzing} disabled={isReanalyzing}
                      style={{ height: 48, fontSize: 15, fontWeight: 700, flex: 2, background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
                      {isReanalyzing ? 'AI 분석 중...' : '🔮 재분석하기 (50쌀)'}
                    </Button>
                  </div>
                  <p style={{ fontSize: 11, color: '#71717a', textAlign: 'center', marginTop: 8 }}>
                    🍚 보유 쌀: {user?.rice.toLocaleString() ?? 0} · 이전 분석 결과가 새로 업데이트됩니다
                  </p>
                </div>
              </div>
            ) : null}

            {/* 액션 버튼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Button type="primary" size="large" block onClick={() => navigate('/battle')}
                style={{ height: 56, fontSize: 18, fontWeight: 700, background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
                ⚔️ 대결하러 가기
              </Button>
              {!showEditForm && (
                <Button size="large" block onClick={handleOpenEditForm}
                  style={{ height: 48, fontSize: 15, fontWeight: 600, background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)', color: '#a1a1aa' }}>
                  ✏️ 생년월일 수정 / 재분석 (50쌀)
                </Button>
              )}
            </div>

            <p className="battle-note" style={{ marginTop: 24, marginBottom: 40 }}>
              분석 결과는 대결 및 마이페이지에 자동 반영됩니다
            </p>
          </div>
        </div>
      </App>
    </ConfigProvider>
  )
}

// ============================================
// 프리미엄 콘텐츠 컴포넌트
// ============================================

function PremiumContent({
  premium,
  nickname,
  elementColor,
  expandedCrisis,
  setExpandedCrisis,
}: {
  premium: PremiumAnalysis
  nickname: string
  elementColor: string
  expandedCrisis: number | null
  setExpandedCrisis: (i: number | null) => void
}) {
  const { destinyPartner, wealthByPeriod, lifeCrises } = premium

  // 재산 차트 데이터
  const wealthPeriods = [
    { ...wealthByPeriod.youth, label: '초년기' },
    { ...wealthByPeriod.earlyAdult, label: '청년기' },
    { ...wealthByPeriod.midLife, label: '중년기' },
    { ...wealthByPeriod.lateLife, label: '말년기' },
  ]
  const maxLevel = 10

  return (
    <>
      {/* 운명의 짝 */}
      <div style={S.section}>
        <h3 style={S.sectionTitle}>💕 {nickname}님의 운명의 짝</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>성격</div>
            <p style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.6, margin: 0 }}>{destinyPartner.personality}</p>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>직업</div>
            <p style={{ fontSize: 14, color: '#d4d4d8', margin: 0 }}>{destinyPartner.occupation}</p>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#71717a', marginBottom: 4 }}>외모</div>
            <p style={{ fontSize: 14, color: '#d4d4d8', lineHeight: 1.6, margin: 0 }}>{destinyPartner.appearance}</p>
          </div>
          {/* 키워드 태그 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {destinyPartner.traits.map((trait, i) => (
              <span key={i} style={{
                background: 'rgba(249,115,22,0.15)',
                color: '#f97316',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
              }}>#{trait}</span>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 12, marginTop: 4 }}>
            <div style={{ fontSize: 11, color: '#a78bfa', marginBottom: 4 }}>궁합 근거</div>
            <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5, margin: 0 }}>{destinyPartner.compatibility}</p>
          </div>
        </div>
      </div>

      {/* 시기별 재산 */}
      <div style={S.section}>
        <h3 style={S.sectionTitle}>💰 {nickname}님의 시기별 재산운</h3>
        {/* 바 차트 */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, height: 140, marginBottom: 16, padding: '0 8px' }}>
          {wealthPeriods.map((wp, i) => {
            const heightPct = (wp.level / maxLevel) * 100
            const barColor = wp.level >= 7 ? '#22c55e' : wp.level >= 5 ? '#eab308' : wp.level >= 3 ? '#f97316' : '#ef4444'
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: barColor, marginBottom: 4 }}>{wp.level}</div>
                <div style={{
                  width: '100%',
                  maxWidth: 48,
                  height: `${heightPct}%`,
                  background: `linear-gradient(180deg, ${barColor}cc 0%, ${barColor}44 100%)`,
                  borderRadius: '6px 6px 0 0',
                  minHeight: 8,
                  transition: 'height 0.5s ease',
                }} />
                <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 6, textAlign: 'center' }}>{wp.label}</div>
              </div>
            )
          })}
        </div>
        {/* 시기별 설명 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {wealthPeriods.map((wp, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 12, color: '#f97316', fontWeight: 600, marginBottom: 4 }}>{wp.period}</div>
              <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5, margin: 0 }}>{wp.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 운명의 고비 */}
      <div style={S.section}>
        <h3 style={S.sectionTitle}>⚠️ {nickname}님의 운명의 고비</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lifeCrises.map((crisis, i) => (
            <div
              key={i}
              style={{
                background: expandedCrisis === i ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                borderRadius: 10,
                padding: '12px 14px',
                cursor: 'pointer',
                border: expandedCrisis === i ? `1px solid ${elementColor}33` : '1px solid transparent',
                transition: 'all 0.2s',
              }}
              onClick={() => setExpandedCrisis(expandedCrisis === i ? null : i)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#71717a', fontWeight: 600, width: 20 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: 14, color: '#e4e4e7', fontWeight: 600 }}>{crisis.title}</span>
                </div>
                <span style={{
                  background: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                }}>{crisis.period}</span>
              </div>
              {expandedCrisis === i && (
                <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, margin: '10px 0 0 28px' }}>
                  {crisis.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
