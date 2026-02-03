import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DatePicker, Select, Radio, Button, ConfigProvider, theme, App } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import koKR from 'antd/locale/ko_KR'

dayjs.locale('ko')

type Gender = 'male' | 'female'

const hourOptions = [
  { value: 'unknown', label: '모름' },
  { value: '0', label: '자시 (23:30~01:29)' },
  { value: '1', label: '축시 (01:30~03:29)' },
  { value: '3', label: '인시 (03:30~05:29)' },
  { value: '5', label: '묘시 (05:30~07:29)' },
  { value: '7', label: '진시 (07:30~09:29)' },
  { value: '9', label: '사시 (09:30~11:29)' },
  { value: '11', label: '오시 (11:30~13:29)' },
  { value: '13', label: '미시 (13:30~15:29)' },
  { value: '15', label: '신시 (15:30~17:29)' },
  { value: '17', label: '유시 (17:30~19:29)' },
  { value: '19', label: '술시 (19:30~21:29)' },
  { value: '21', label: '해시 (21:30~23:29)' },
]

export default function BirthInput() {
  const navigate = useNavigate()
  const [birthDate, setBirthDate] = useState<Dayjs | null>(null)
  const [hour, setHour] = useState<string>('unknown')
  const [gender, setGender] = useState<Gender | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    setError(null)

    if (!birthDate) {
      setError('생년월일을 선택해주세요.')
      return
    }

    if (!gender) {
      setError('성별을 선택해주세요.')
      return
    }

    const birthInfo = {
      year: birthDate.year(),
      month: birthDate.month() + 1,
      day: birthDate.date(),
      hour: hour === 'unknown' ? 12 : Number(hour),
      minute: 0,
      gender,
      hourKnown: hour !== 'unknown',
    }

    localStorage.setItem('saju_birth_info', JSON.stringify(birthInfo))
    navigate('/fortune/today')
  }

  return (
    <ConfigProvider
      locale={koKR}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 12,
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
        },
      }}
    >
      <App>
        <div className="birth-input-page">
          <div className="birth-input-container">
            <div className="page-header">
              <button className="back-btn" onClick={() => navigate('/')}>
                ← 뒤로
              </button>
              <h1>오늘의 운세</h1>
            </div>

            <div className="input-description">
              <div className="icon">🔮</div>
              <p>정확한 운세를 위해<br />생년월일시를 입력해주세요</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="birth-form">
              {/* 생년월일 */}
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

              {/* 태어난 시간 */}
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

              {/* 성별 */}
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
                style={{ height: 52, fontSize: 16, fontWeight: 700, marginTop: 8 }}
              >
                운세 확인하기
              </Button>
            </div>

            <p className="privacy-note">
              입력한 정보는 기기에만 저장되며 외부로 전송되지 않습니다.
            </p>
          </div>
        </div>
      </App>
    </ConfigProvider>
  )
}
