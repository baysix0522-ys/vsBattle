import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { DatePicker, Select, Radio, Button, ConfigProvider, theme, App, Spin } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import koKR from 'antd/locale/ko_KR'
import { useAuth } from '../contexts/AuthContext'
import { battleApi, type BattleBirthInfo } from '../api/client'

dayjs.locale('ko')

type Gender = 'male' | 'female'

// 일간 심볼
const DAY_MASTER_SYMBOLS: Record<string, string> = {
  갑: '🌲', 을: '🌿', 병: '☀️', 정: '🕯️', 무: '⛰️',
  기: '🌾', 경: '⚔️', 신: '💎', 임: '🌊', 계: '💧',
}

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

  const [birthDate, setBirthDate] = useState<Dayjs | null>(null)
  const [hour, setHour] = useState<string>('unknown')
  const [gender, setGender] = useState<Gender | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!shareCode || !token) return

    const fetchBattle = async () => {
      try {
        const res = await battleApi.getBattleByCode(token, shareCode)
        setChallenger(res.challenger)
      } catch (err) {
        console.error('대결 조회 실패:', err)
        setError(err instanceof Error ? err.message : '대결을 찾을 수 없습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchBattle()
  }, [shareCode, token])

  // 비로그인 상태
  if (!user || !token) {
    return (
      <div className="battle-page">
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
        <header className="battle-header">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <h1>대결 참가</h1>
          <div style={{ width: 40 }} />
        </header>
        <div className="battle-content">
          <div className="guest-block">
            <span className="block-icon">🔒</span>
            <h3>유료 서비스입니다</h3>
            <p>회원 가입 후 대결에 참가할 수 있습니다</p>
            <Button type="primary" size="large" onClick={() => navigate('/login')}>
              회원가입하기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    setFormError(null)

    if (!birthDate) {
      setFormError('생년월일을 선택해주세요.')
      return
    }

    if (!gender) {
      setFormError('성별을 선택해주세요.')
      return
    }

    if (!shareCode) {
      setFormError('대결 코드가 없습니다.')
      return
    }

    const birthInfo: BattleBirthInfo = {
      birthDate: birthDate.format('YYYY-MM-DD'),
      isTimeUnknown: hour === 'unknown',
      gender,
      ...(hour !== 'unknown' ? { birthTime: hour } : {}),
    }

    setIsSubmitting(true)
    try {
      // 먼저 내 사주 분석
      const analyzeRes = await battleApi.analyze(token, birthInfo)

      // 대결 참가
      const joinRes = await battleApi.joinBattle(token, shareCode, analyzeRes.reportId)

      // 대결 결과 페이지로 이동
      navigate(`/battle/result/${joinRes.battleId}`)
    } catch (err) {
      console.error('대결 참가 실패:', err)
      setFormError(err instanceof Error ? err.message : '대결 참가에 실패했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ConfigProvider
      locale={koKR}
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
                  <div className="opponent-placeholder">
                    <span className="placeholder-icon">❓</span>
                    <span className="placeholder-text">당신의 사주는?</span>
                  </div>
                </div>

                {formError && <div className="error-message">{formError}</div>}

                <div className="battle-form">
                  <h3 className="form-title">내 정보 입력</h3>

                  <div className="form-section">
                    <label className="section-label">생년월일 (양력)</label>
                    <DatePicker
                      value={birthDate}
                      onChange={setBirthDate}
                      placeholder="생년월일 선택"
                      size="large"
                      style={{ width: '100%' }}
                      disabledDate={(current) => current && current > dayjs().endOf('day')}
                      showToday={false}
                      defaultPickerValue={dayjs().subtract(25, 'year')}
                    />
                  </div>

                  <div className="form-section">
                    <label className="section-label">태어난 시간</label>
                    <Select
                      value={hour}
                      onChange={setHour}
                      options={hourOptions}
                      size="large"
                      style={{ width: '100%' }}
                      popupMatchSelectWidth={false}
                    />
                  </div>

                  <div className="form-section">
                    <label className="section-label">성별</label>
                    <Radio.Group
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      size="large"
                      style={{ width: '100%' }}
                      optionType="button"
                      buttonStyle="solid"
                    >
                      <Radio.Button value="male" style={{ width: '50%', textAlign: 'center' }}>
                        👨 남성
                      </Radio.Button>
                      <Radio.Button value="female" style={{ width: '50%', textAlign: 'center' }}>
                        👩 여성
                      </Radio.Button>
                    </Radio.Group>
                  </div>

                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    style={{
                      height: 56,
                      fontSize: 18,
                      fontWeight: 700,
                      marginTop: 16,
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    }}
                  >
                    {isSubmitting ? '대결 진행 중...' : '⚔️ 대결 시작!'}
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </App>
    </ConfigProvider>
  )
}
