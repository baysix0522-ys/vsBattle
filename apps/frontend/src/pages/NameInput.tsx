import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, ConfigProvider, theme, Spin } from 'antd'
import { useAuth } from '../contexts/AuthContext'
import { nameApi, type SelectedHanja } from '../api/client'
import { loadHanjaDict, getHanjaCandidates, type HanjaDict, type HanjaDictEntry } from '../lib/hanja'
import SEO from '../components/SEO'
import './NameAnalysis.css'

type InputMode = 'select' | 'keyboard'

export default function NameInput() {
  const navigate = useNavigate()
  const { token, user } = useAuth()

  // 입력 모드
  const [inputMode, setInputMode] = useState<InputMode>('select')

  // 공통 상태
  const [koreanName, setKoreanName] = useState('')

  // 사전 선택 모드 상태
  const [hanjaDict, setHanjaDict] = useState<HanjaDict | null>(null)
  const [dictLoading, setDictLoading] = useState(false)
  const [candidatesPerChar, setCandidatesPerChar] = useState<
    Array<{ korean: string; candidates: HanjaDictEntry[] }>
  >([])
  const [selectedHanjaMap, setSelectedHanjaMap] = useState<Record<number, HanjaDictEntry | null>>({})

  // 키보드 직접 입력 모드 상태
  const [hanjaName, setHanjaName] = useState('')

  // 로딩/에러
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeStep, setAnalyzeStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!analyzing) {
      setAnalyzeStep(0)
      return
    }
    const timer = setTimeout(() => setAnalyzeStep(1), 2000)
    return () => clearTimeout(timer)
  }, [analyzing])

  // 사전 선택 모드: 한자 사전 로드 + 후보 조회
  useEffect(() => {
    if (inputMode !== 'select') return

    const trimmed = koreanName.trim()
    if (!trimmed || !/^[가-힣]+$/.test(trimmed)) {
      setCandidatesPerChar([])
      setSelectedHanjaMap({})
      return
    }

    let cancelled = false

    const loadAndLookup = async () => {
      let dict = hanjaDict
      if (!dict) {
        setDictLoading(true)
        try {
          dict = await loadHanjaDict()
          if (!cancelled) setHanjaDict(dict)
        } catch {
          if (!cancelled) setError('한자 사전을 불러오지 못했습니다. 새로고침 해주세요.')
          setDictLoading(false)
          return
        }
        setDictLoading(false)
      }

      if (cancelled) return
      const results = getHanjaCandidates(dict, trimmed)
      setCandidatesPerChar(results)
      setSelectedHanjaMap({})
    }

    const timer = setTimeout(loadAndLookup, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [koreanName, hanjaDict, inputMode])

  const handleHanjaSelect = useCallback((charIdx: number, entry: HanjaDictEntry) => {
    setSelectedHanjaMap(prev => ({
      ...prev,
      [charIdx]: prev[charIdx]?.h === entry.h ? null : entry,
    }))
  }, [])

  // 제출 가능 여부
  const selectModeReady =
    inputMode === 'select' &&
    candidatesPerChar.length > 0 &&
    candidatesPerChar.every((_, idx) => selectedHanjaMap[idx] != null)

  const keyboardModeReady =
    inputMode === 'keyboard' &&
    koreanName.trim().length > 0 &&
    hanjaName.trim().length > 0 &&
    koreanName.trim().length === hanjaName.trim().length

  const canSubmit = selectModeReady || keyboardModeReady

  // 미리보기
  const hanjaPreview =
    inputMode === 'select'
      ? candidatesPerChar.map((_, idx) => selectedHanjaMap[idx]?.h || '?').join('')
      : hanjaName.trim()

  // 분석 실행
  const handleAnalyze = async () => {
    setError(null)
    const trimmed = koreanName.trim()

    if (!trimmed || !/^[가-힣]+$/.test(trimmed)) {
      setError('한글 이름을 입력해주세요')
      return
    }

    if (inputMode === 'keyboard') {
      const hTrimmed = hanjaName.trim()
      if (!hTrimmed) {
        setError('한자 이름을 입력해주세요')
        return
      }
      if (!/^[\u4E00-\u9FFF\u3400-\u4DBF]+$/.test(hTrimmed)) {
        setError('한자 이름은 한자만 입력 가능합니다')
        return
      }
      if (trimmed.length !== hTrimmed.length) {
        setError('한글과 한자 글자 수가 일치해야 합니다')
        return
      }
    } else {
      if (!selectModeReady) {
        setError('모든 글자의 한자를 선택해주세요')
        return
      }
    }

    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }
    if (user.rice < 50) {
      setError('쌀이 부족합니다. 이름 풀이에는 50쌀이 필요합니다.')
      return
    }

    setAnalyzing(true)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // 한글-한자 매핑 생성
    let selectedHanja: SelectedHanja[]
    if (inputMode === 'select') {
      selectedHanja = candidatesPerChar.map((group, idx) => ({
        korean: group.korean,
        hanja: selectedHanjaMap[idx]!.h,
      }))
    } else {
      const chars = trimmed.split('')
      const hanjaChars = hanjaName.trim().split('')
      selectedHanja = chars.map((korean, idx) => ({
        korean,
        hanja: hanjaChars[idx] || korean,
      }))
    }

    const surname = trimmed[0] || ''
    const surnameHanja = selectedHanja[0]?.hanja || ''
    const givenName = trimmed.slice(1)
    const givenHanjaArray = selectedHanja.slice(1)

    try {
      const res = await nameApi.analyze(
        surname,
        surnameHanja,
        givenName,
        givenHanjaArray,
        token,
        controller.signal
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
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      console.error('이름 분석 실패:', err)
      if (err?.status === 402) {
        setError('쌀이 부족합니다. 이름 풀이에는 50쌀이 필요합니다.')
      } else if (err?.status === 401) {
        setError('로그인이 필요합니다.')
      } else {
        setError('이름 분석에 실패했습니다. 다시 시도해주세요.')
      }
    } finally {
      setAnalyzing(false)
    }
  }

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
        <SEO title="이름 풀이" description="내 이름에 숨겨진 의미를 알아보세요. 한자 분석과 AI 기반 이름 해석으로 이름의 뜻을 풀어드립니다." path="/name" />
        <div className="name-header">
          <button className="back-btn" onClick={handleBack}>←</button>
          <h1>이름 풀이</h1>
        </div>

        <div className="name-content">
          <div className="input-section">
            <div className="section-title">
              <span className="title-icon">✍️</span>
              <span>이름을 입력해주세요</span>
            </div>

            {/* 한글 이름 입력 */}
            <div className="input-group">
              <label>한글 이름 (성 포함)</label>
              <Input
                size="large"
                placeholder="예: 박영식"
                value={koreanName}
                onChange={e => setKoreanName(e.target.value)}
                maxLength={5}
              />
            </div>

            {/* 입력 모드 토글 */}
            <div className="hanja-mode-toggle">
              <button
                className={`mode-btn ${inputMode === 'select' ? 'active' : ''}`}
                onClick={() => setInputMode('select')}
              >
                사전에서 선택
              </button>
              <button
                className={`mode-btn ${inputMode === 'keyboard' ? 'active' : ''}`}
                onClick={() => setInputMode('keyboard')}
              >
                키보드 직접 입력
              </button>
            </div>

            {/* === 사전 선택 모드 === */}
            {inputMode === 'select' && (
              <>
                {dictLoading && (
                  <div className="inline-hanja-loading">
                    <Spin size="small" /> 한자 사전을 불러오는 중...
                  </div>
                )}

                {candidatesPerChar.length > 0 && !dictLoading && (
                  <div className="inline-hanja-section">
                    <div className="inline-hanja-header">
                      <span>글자별 한자를 선택해주세요</span>
                    </div>
                    <div className="inline-hanja-list">
                      {candidatesPerChar.map((group, idx) => (
                        <div key={`${group.korean}-${idx}`} className="inline-hanja-group">
                          <div className="inline-char-label">
                            <span className="korean-char">{group.korean}</span>
                            {selectedHanjaMap[idx] && (
                              <span className="selected-hanja">
                                → {selectedHanjaMap[idx]!.h} ({selectedHanjaMap[idx]!.m})
                              </span>
                            )}
                          </div>
                          {group.candidates.length > 0 ? (
                            <div className="hanja-list-options">
                              {group.candidates.map(entry => (
                                <button
                                  key={entry.h}
                                  className={`hanja-list-item ${
                                    selectedHanjaMap[idx]?.h === entry.h ? 'selected' : ''
                                  }`}
                                  onClick={() => handleHanjaSelect(idx, entry)}
                                >
                                  <span className="hanja-list-char">{entry.h}</span>
                                  <span className="hanja-list-meaning">{entry.m}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="inline-hanja-loading">
                              '{group.korean}'에 해당하는 인명용 한자가 없습니다
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* === 키보드 직접 입력 모드 === */}
            {inputMode === 'keyboard' && (
              <div className="input-group">
                <label>한자 이름</label>
                <Input
                  size="large"
                  placeholder="예: 朴榮植"
                  value={hanjaName}
                  onChange={e => setHanjaName(e.target.value)}
                  maxLength={5}
                />
                <p className="input-hint">
                  Windows: 한글 입력 후 한자 키 / Mac: Option + Enter
                </p>
              </div>
            )}

            {/* 미리보기 */}
            {canSubmit && (
              <div className="hanja-preview">
                <span className="preview-label">선택된 이름:</span>
                <span className="preview-name">{hanjaPreview}</span>
                <span className="preview-korean">({koreanName.trim()})</span>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {analyzing ? (
              <div className="analyzing-state">
                <Spin size="large" />
                <p>이름을 분석하고 있습니다...</p>
                {analyzeStep >= 1 && (
                  <p className="analyze-sub">AI 분석중입니다. 다소 시간이 소요됩니다.</p>
                )}
              </div>
            ) : (
              <Button
                type="primary"
                size="large"
                block
                onClick={handleAnalyze}
                disabled={!canSubmit}
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
