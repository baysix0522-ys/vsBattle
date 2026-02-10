import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DatePicker, Select, Radio, Button, ConfigProvider, theme, App } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import koKR from 'antd/locale/ko_KR'
import { useAuth } from '../contexts/AuthContext'
import { battleApi, type BattleBirthInfo } from '../api/client'
import SEO from '../components/SEO'

dayjs.locale('ko')

type Gender = 'male' | 'female'

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

export default function BattleInput() {
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [birthDate, setBirthDate] = useState<Dayjs | null>(null)
  const [hour, setHour] = useState<string>('unknown')
  const [gender, setGender] = useState<Gender | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 게스트는 이용 불가
  if (user?.isGuest) {
    return (
      <div className="battle-page">
        <header className="battle-header">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <h1>사주 대결</h1>
          <div style={{ width: 40 }} />
        </header>
        <div className="battle-content">
          <div className="guest-block">
            <span className="block-icon">🔒</span>
            <h3>유료 서비스입니다</h3>
            <p>사주 대결은 회원 전용 서비스입니다.<br />로그인 후 이용해주세요!</p>
            <Button type="primary" size="large" onClick={() => navigate('/login')}>
              로그인하기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async () => {
    setError(null)

    if (!birthDate) {
      setError('생년월일을 선택해주세요.')
      return
    }

    if (!gender) {
      setError('성별을 선택해주세요.')
      return
    }

    if (!token) {
      setError('로그인이 필요합니다.')
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
      const res = await battleApi.analyze(token, birthInfo)
      // 분석 결과와 함께 리포트 페이지로 이동
      navigate('/battle/report', {
        state: {
          reportId: res.reportId,
          result: res.result,
          isExisting: res.isExisting,
        },
      })
    } catch (err) {
      console.error('사주 분석 실패:', err)
      setError(err instanceof Error ? err.message : '사주 분석 중 오류가 발생했습니다.')
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
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
        },
      }}
    >
      <App>
        <div className="battle-page">
          <SEO title="사주 대결" description="친구와 사주 운세를 비교하고 대결해보세요! 링크를 공유하고 누가 더 운이 좋은지 겨뤄보세요." path="/battle" />
          <header className="battle-header">
            <button className="back-btn" onClick={() => navigate('/')}>←</button>
            <h1>⚔️ 사주 대결</h1>
            <div style={{ width: 40 }} />
          </header>

          <div className="battle-content">
            <div className="battle-intro">
              <div className="intro-icon">🏆</div>
              <h2>친구와 운세 대결!</h2>
              <p>
                AI가 분석한 사주로<br />
                누가 더 운이 좋은지 겨뤄보세요
              </p>
            </div>

            <div className="battle-steps">
              <div className="step active">
                <span className="step-num">1</span>
                <span className="step-text">내 사주 분석</span>
              </div>
              <div className="step-arrow">→</div>
              <div className="step">
                <span className="step-num">2</span>
                <span className="step-text">대결 링크 공유</span>
              </div>
              <div className="step-arrow">→</div>
              <div className="step">
                <span className="step-num">3</span>
                <span className="step-text">대결 결과 확인!</span>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="battle-form">
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
                <p className="helper-text">시간을 모르면 "모름"을 선택해주세요</p>
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
                {isSubmitting ? 'AI가 분석 중...' : '🔮 내 사주 분석하기'}
              </Button>
            </div>

            <p className="battle-note">
              💡 분석된 사주는 저장되어 다음 대결에도 사용할 수 있어요
            </p>
          </div>
        </div>
      </App>
    </ConfigProvider>
  )
}
