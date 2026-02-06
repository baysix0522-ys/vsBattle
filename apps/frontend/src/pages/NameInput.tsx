import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, ConfigProvider, theme, Spin } from 'antd'
import { useAuth } from '../contexts/AuthContext'
import { nameApi, type SelectedHanja } from '../api/client'
import './NameAnalysis.css'

export default function NameInput() {
  const navigate = useNavigate()
  const { token } = useAuth()

  // 입력 상태
  const [koreanName, setKoreanName] = useState('')
  const [hanjaName, setHanjaName] = useState('')

  // 로딩/에러
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 분석 실행
  const handleAnalyze = async () => {
    setError(null)

    if (!koreanName.trim()) {
      setError('한글 이름을 입력해주세요')
      return
    }

    if (!hanjaName.trim()) {
      setError('한자 이름을 입력해주세요')
      return
    }

    if (!/^[가-힣]+$/.test(koreanName.trim())) {
      setError('한글 이름은 한글만 입력 가능합니다')
      return
    }

    // 한자 유효성 검사 (CJK 통합 한자 범위)
    const hanjaRegex = /^[\u4E00-\u9FFF\u3400-\u4DBF]+$/
    if (!hanjaRegex.test(hanjaName.trim())) {
      setError('한자 이름은 한자만 입력 가능합니다')
      return
    }

    // 글자 수 일치 확인
    if (koreanName.trim().length !== hanjaName.trim().length) {
      setError('한글과 한자 글자 수가 일치해야 합니다')
      return
    }

    setAnalyzing(true)

    // 한글-한자 매핑 생성
    const chars = koreanName.trim().split('')
    const hanjaChars = hanjaName.trim().split('')
    const selectedHanja: SelectedHanja[] = chars.map((korean, idx) => ({
      korean,
      hanja: hanjaChars[idx] || korean,
    }))

    // 첫 글자를 성으로 처리
    const surname = chars[0] || ''
    const surnameHanja = hanjaChars[0] || ''
    const givenName = chars.slice(1).join('')
    const givenHanjaArray = selectedHanja.slice(1)

    try {
      const res = await nameApi.analyze(
        surname,
        surnameHanja,
        givenName,
        givenHanjaArray,
        token
      )

      navigate('/name/result', {
        state: {
          recordId: res.recordId,
          result: res.result,
          surname,
          surnameHanja,
          givenName,
          selectedHanja: givenHanjaArray,
        },
      })
    } catch (err) {
      console.error('이름 분석 실패:', err)
      setError('이름 분석에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setAnalyzing(false)
    }
  }

  // 뒤로가기
  const handleBack = () => {
    navigate('/')
  }

  return (
    <ConfigProvider
      locale={{ locale: 'ko' }}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#8b5cf6',
          borderRadius: 12,
        },
      }}
    >
      <div className="name-page">
        <header className="name-header">
          <button className="back-btn" onClick={handleBack}>←</button>
          <h1>이름 풀이</h1>
          <div style={{ width: 40 }} />
        </header>

        <div className="name-content">
          <div className="input-section">
            <div className="section-title">
              <span className="title-icon">✍️</span>
              <span>이름을 입력해주세요</span>
            </div>

            {/* 한글 이름 입력 */}
            <div className="input-group">
              <label>한글 이름</label>
              <Input
                size="large"
                placeholder="예: 박영식"
                value={koreanName}
                onChange={e => setKoreanName(e.target.value)}
                maxLength={10}
              />
            </div>

            {/* 한자 이름 입력 */}
            <div className="input-group">
              <label>한자 이름</label>
              <Input
                size="large"
                placeholder="예: 朴榮植"
                value={hanjaName}
                onChange={e => setHanjaName(e.target.value)}
                maxLength={10}
              />
              <p className="input-hint">
                Windows: 한글 입력 후 한자 키 / Mac: Option + Enter
              </p>
            </div>

            {/* 미리보기 */}
            {koreanName.trim() && hanjaName.trim() && (
              <div className="hanja-preview">
                <span className="preview-label">입력된 이름:</span>
                <span className="preview-name">{hanjaName}</span>
                <span className="preview-korean">({koreanName})</span>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {analyzing ? (
              <div className="analyzing-state">
                <Spin size="large" />
                <p>이름을 분석하고 있습니다...</p>
              </div>
            ) : (
              <Button
                type="primary"
                size="large"
                block
                onClick={handleAnalyze}
                disabled={!koreanName.trim() || !hanjaName.trim()}
              >
                🔮 이름 분석 시작
              </Button>
            )}
          </div>
        </div>
      </div>
    </ConfigProvider>
  )
}
