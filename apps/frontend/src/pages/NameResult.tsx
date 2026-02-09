import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { Button } from 'antd'
import { nameApi } from '../api/client'
import type { NameAnalysisResult, SelectedHanja } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import './NameAnalysis.css'

type LocationState = {
  recordId: string
  result: NameAnalysisResult
  surname: string
  surnameHanja: string
  givenName: string
  selectedHanja: SelectedHanja[]
}

export default function NameResult() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id } = useParams<{ id: string }>()
  const { token } = useAuth()
  const state = location.state as LocationState

  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [loadedData, setLoadedData] = useState<{
    result: NameAnalysisResult
    surname: string
    surnameHanja: string
    givenName: string
    selectedHanja: SelectedHanja[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)

  // URL 파라미터(id)로 접근했고 state가 없으면 API에서 로드
  useEffect(() => {
    if (state?.result || !id) return

    setLoading(true)
    nameApi.getRecord(id, token)
      .then((res) => {
        // result가 문자열이면 JSON 파싱
        const parsedResult: NameAnalysisResult = typeof res.result === 'string'
          ? JSON.parse(res.result)
          : res.result

        // selectedHanja를 파싱 (DB에는 "慧彬" 같은 문자열로 저장)
        // characters에서 korean 매핑
        const hanjaChars = res.selectedHanja || ''
        const koreanChars = res.koreanName.split('')
        const parsedHanja: SelectedHanja[] = hanjaChars.split('').map((h, i) => ({
          korean: koreanChars[i] || '',
          hanja: h,
        }))

        setLoadedData({
          result: parsedResult,
          surname: res.surname,
          surnameHanja: res.surnameHanja,
          givenName: res.koreanName,
          selectedHanja: parsedHanja,
        })
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [id, state, token])

  // 데이터 소스: state 우선, 없으면 API 로드 결과
  const data = state || loadedData

  if (loading) {
    return (
      <div className="name-page">
        <div className="name-header">
          <button className="back-btn" onClick={() => navigate(-1 as any)}>←</button>
          <h1>이름 풀이</h1>
        </div>
        <div className="name-content">
          <div className="loading-state" style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="loading-spinner" style={{ fontSize: 40, marginBottom: 16 }}>☯</div>
            <p>분석 결과를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data?.result || loadError) {
    return (
      <div className="name-page">
        <div className="name-header">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <h1>이름 풀이</h1>
        </div>
        <div className="name-content">
          <div className="error-state">
            <p>분석 결과를 찾을 수 없습니다</p>
            <Button type="primary" onClick={() => navigate('/name')}>
              다시 분석하기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const { result, surname, surnameHanja, givenName, selectedHanja } = data
  const fullName = surname + givenName
  const fullHanja = surnameHanja + selectedHanja.map(s => s.hanja).join('')

  const toggleSection = (section: string) => {
    setActiveSection(prev => (prev === section ? null : section))
  }

  return (
    <div className="name-page name-result-page">
      <div className="name-header">
        <button className="back-btn" onClick={() => navigate('/')}>←</button>
        <h1>이름 풀이 결과</h1>
      </div>

      <div className="name-content">
        {/* 상단 히어로 카드 */}
        <div className="result-hero-card">
          {/* 이름 + 한자 */}
          <div className="hero-name-area">
            <div className="hero-hanja-row">
              {fullHanja.split('').map((char, i) => (
                <span key={i} className="hero-hanja-char">{char}</span>
              ))}
            </div>
            <div className="hero-korean">{fullName}</div>
          </div>

          {/* 닉네임 (메인 포커스) - 25개 고정 닉네임 */}
          {result.nickname && (
            <div className="hero-nickname-area">
              <div className="hero-nickname-badge">
                <span className="hero-nickname-icon">{result.nickname.icon}</span>
                <span className="hero-nickname-text">{result.nickname.name}</span>
              </div>
              <p className="hero-nickname-desc">{result.nickname.desc}</p>
              <p className="hero-quote">"{result.nickname.quote}"</p>
              <div className="hero-nickname-tags">
                <span className={`nickname-element-tag el-${result.nickname.element}`}>
                  {result.nickname.element}오행
                </span>
                <span className="nickname-type-tag">{result.nickname.type}형</span>
              </div>
            </div>
          )}

          {/* 키워드 태그들 */}
          {result.shareable?.keywords && (
            <div className="hero-keywords">
              {result.shareable.keywords.map((kw, i) => (
                <span key={i} className="hero-keyword-tag">#{kw}</span>
              ))}
            </div>
          )}

          {/* 오행 미니 요약 */}
          {result.fiveElements?.distribution && (
            <div className="hero-elements-row">
              {result.fiveElements.distribution.filter(d => d.count > 0).map((el, i) => (
                <div key={i} className={`hero-element-chip el-${el.element}`}>
                  <span className="he-icon">{el.icon}</span>
                  <span className="he-name">{el.element}</span>
                  <span className="he-count">×{el.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 글자별 해석 섹션 (항상 펼침) */}
        <div className="result-section always-open">
          <div className="section-header">
            <span className="section-icon">🔤</span>
            <span className="section-title">글자별 해석</span>
          </div>
          <div className="section-content">
              <div className="characters-list">
                {result.characters?.map((char, idx) => (
                  <div key={idx} className="character-card-v2">
                    {/* 상단: 泳(영) — "헤엄치다" 형식 */}
                    <div className="char-header-line">
                      <span className="char-title">
                        {char.hanja}({char.korean}) — "{char.meaning}"
                      </span>
                      <div className="char-meta-v2">
                        <span className={`element-badge el-${char.fiveElement}`}>
                          {char.fiveElement}
                        </span>
                        <span className="stroke-badge">{char.strokeCount}획</span>
                      </div>
                    </div>

                    {/* 해석 섹션 */}
                    <div className="char-section">
                      <div className="char-section-label">해석</div>
                      <p className="char-section-text">{char.interpretation}</p>
                    </div>

                    {/* 상징 섹션 */}
                    <div className="char-section">
                      <div className="char-section-label">상징</div>
                      <p className="char-section-text">{char.symbolism}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="combined-meaning">
                <span className="label">조합 의미</span>
                <p>{result.combinedMeaning}</p>
              </div>
            </div>
        </div>

        {/* 실생활 해석 섹션 */}
        <div className="result-section">
          <div className="section-header" onClick={() => toggleSection('life')}>
            <span className="section-icon">💫</span>
            <span className="section-title">실생활 해석</span>
            <span className="toggle-icon">{activeSection === 'life' ? '▲' : '▼'}</span>
          </div>
          {activeSection === 'life' && result.lifeInterpretation && (
            <div className="section-content">
              <div className="life-card">
                <div className="life-icon">💕</div>
                <div className="life-label">연애/결혼</div>
                <p>{result.lifeInterpretation.love}</p>
              </div>
              <div className="life-card">
                <div className="life-icon">💼</div>
                <div className="life-label">일/직업</div>
                <p>{result.lifeInterpretation.career}</p>
              </div>
              <div className="life-card">
                <div className="life-icon">🤝</div>
                <div className="life-label">인간관계</div>
                <p>{result.lifeInterpretation.relationships}</p>
              </div>
            </div>
          )}
        </div>

        {/* 오행 분석 섹션 */}
        <div className="result-section">
          <div className="section-header" onClick={() => toggleSection('elements')}>
            <span className="section-icon">🌊</span>
            <span className="section-title">오행 분석</span>
            <span className="toggle-icon">{activeSection === 'elements' ? '▲' : '▼'}</span>
          </div>
          {activeSection === 'elements' && result.fiveElements && (
            <div className="section-content">
              {/* 5개 오행 카드 */}
              <div className="elements-grid">
                {result.fiveElements.distribution?.map(el => (
                  <div
                    key={el.element}
                    className={`element-card ${el.count > 0 ? 'active' : ''}`}
                  >
                    <span className="el-icon">{el.icon}</span>
                    <span className={`el-name el-${el.element}`}>{el.element}</span>
                    <span className="el-count">{el.count}개</span>
                  </div>
                ))}
              </div>

              {/* 글자별 오행 분석 */}
              <div className="element-char-list">
                {/* 성씨 */}
                <div className="element-char-item">
                  <div className="ec-header">
                    <span className="ec-hanja">{surnameHanja}({surname})</span>
                    <span className={`ec-element el-${result.fiveElements.surnameElement || '토'}`}>
                      {result.fiveElements.surnameElement || '토'}
                    </span>
                  </div>
                  <p className="ec-reason">{result.fiveElements.surnameElementReason || `${surnameHanja}의 부수 계열로 ${result.fiveElements.surnameElement || '토'} 성향으로 봅니다.`}</p>
                </div>
                {/* 이름 글자들 */}
                {result.characters?.map((char, idx) => (
                  <div key={idx} className="element-char-item">
                    <div className="ec-header">
                      <span className="ec-hanja">{char.hanja}({char.korean})</span>
                      <span className={`ec-element el-${char.fiveElement}`}>
                        {char.fiveElement}
                      </span>
                    </div>
                    <p className="ec-reason">{char.elementReason}</p>
                  </div>
                ))}
              </div>

              {/* 오행 흐름 정리 */}
              {result.fiveElements.harmony && (
                <div className="element-flow-box">
                  <div className="ef-header">
                    <span className="ef-title">✅ 오행 흐름 정리</span>
                    <span className={`ef-type type-${result.fiveElements.harmony.type}`}>
                      {result.fiveElements.harmony.type}
                    </span>
                  </div>
                  <div className="ef-summary">
                    <span className="ef-formula">
                      성({surnameHanja})={result.fiveElements.surnameElement || '토'},
                      이름({selectedHanja.map(h => h.hanja).join('')})=
                      {result.characters?.map(c => c.fiveElement).join(' + ') || '-'}
                    </span>
                  </div>
                  <p className="ef-desc">{result.fiveElements.harmony.description}</p>
                  <div className="ef-advice">
                    <span className="advice-icon">💡</span>
                    <span>{result.fiveElements.harmony.advice}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 획수 분석 섹션 */}
        <div className="result-section">
          <div className="section-header" onClick={() => toggleSection('ogyeok')}>
            <span className="section-icon">📊</span>
            <span className="section-title">획수 분석 (오격)</span>
            <span className="toggle-icon">{activeSection === 'ogyeok' ? '▲' : '▼'}</span>
          </div>
          {activeSection === 'ogyeok' && result.ogyeokScores && (
            <div className="section-content">
              {/* 1) 글자별 총 획수 확인 */}
              <div className="stroke-section">
                <div className="stroke-section-title">① 글자별 총 획수</div>
                <div className="stroke-char-list">
                  {result.ogyeokScores.breakdown?.map((item, idx) => (
                    <div key={idx} className="stroke-char-item">
                      <span className="sc-hanja">{item.hanja}</span>
                      <span className="sc-strokes">{item.strokes}획</span>
                    </div>
                  ))}
                </div>
                <div className="stroke-total-line">
                  총합(총격의 베이스): {result.ogyeokScores.breakdown?.map(i => i.strokes).join(' + ')} = {result.ogyeokScores.breakdown?.reduce((sum, item) => sum + item.strokes, 0)}획
                </div>
              </div>

              {/* 2) 오격 계산 */}
              <div className="stroke-section">
                <div className="stroke-section-title">② 오격(五格) 계산</div>
                <div className="ogyeok-detail-list">
                  {/* 천격 */}
                  <div className="ogyeok-detail-item">
                    <div className="od-row">
                      <div className="od-left">
                        <span className="od-name">천격</span>
                        <span className="od-desc">(성)</span>
                      </div>
                      <div className="od-calc">= {result.ogyeokScores.천격?.formula || result.ogyeokScores.천격?.strokes || '-'}</div>
                      <div className="od-right">
                        <span className="od-last">끝 {(result.ogyeokScores.천격?.strokes ?? 0) % 10}</span>
                        <span className="od-arrow">→</span>
                        <span className={`od-element el-${result.ogyeokScores.천격?.fiveElement || '토'}`}>
                          {result.ogyeokScores.천격?.fiveElement || '-'}
                        </span>
                      </div>
                    </div>
                    {result.ogyeokScores.천격?.interpretation && (
                      <p className="od-interpretation">{result.ogyeokScores.천격.interpretation}</p>
                    )}
                  </div>
                  {/* 인격 */}
                  <div className="ogyeok-detail-item">
                    <div className="od-row">
                      <div className="od-left">
                        <span className="od-name">인격</span>
                        <span className="od-desc">(성+이름 첫글자)</span>
                      </div>
                      <div className="od-calc">= {result.ogyeokScores.인격?.formula || result.ogyeokScores.인격?.strokes || '-'}</div>
                      <div className="od-right">
                        <span className="od-last">끝 {(result.ogyeokScores.인격?.strokes ?? 0) % 10}</span>
                        <span className="od-arrow">→</span>
                        <span className={`od-element el-${result.ogyeokScores.인격?.fiveElement || '토'}`}>
                          {result.ogyeokScores.인격?.fiveElement || '-'}
                        </span>
                      </div>
                    </div>
                    {result.ogyeokScores.인격?.interpretation && (
                      <p className="od-interpretation">{result.ogyeokScores.인격.interpretation}</p>
                    )}
                  </div>
                  {/* 지격 */}
                  <div className="ogyeok-detail-item">
                    <div className="od-row">
                      <div className="od-left">
                        <span className="od-name">지격</span>
                        <span className="od-desc">(이름 글자들)</span>
                      </div>
                      <div className="od-calc">= {result.ogyeokScores.지격?.formula || result.ogyeokScores.지격?.strokes || '-'}</div>
                      <div className="od-right">
                        <span className="od-last">끝 {(result.ogyeokScores.지격?.strokes ?? 0) % 10}</span>
                        <span className="od-arrow">→</span>
                        <span className={`od-element el-${result.ogyeokScores.지격?.fiveElement || '토'}`}>
                          {result.ogyeokScores.지격?.fiveElement || '-'}
                        </span>
                      </div>
                    </div>
                    {result.ogyeokScores.지격?.interpretation && (
                      <p className="od-interpretation">{result.ogyeokScores.지격.interpretation}</p>
                    )}
                  </div>
                  {/* 외격 */}
                  <div className="ogyeok-detail-item">
                    <div className="od-row">
                      <div className="od-left">
                        <span className="od-name">외격</span>
                        <span className="od-desc">(성+이름 끝글자)</span>
                      </div>
                      <div className="od-calc">= {result.ogyeokScores.외격?.formula || result.ogyeokScores.외격?.strokes || '-'}</div>
                      <div className="od-right">
                        <span className="od-last">끝 {(result.ogyeokScores.외격?.strokes ?? 0) % 10}</span>
                        <span className="od-arrow">→</span>
                        <span className={`od-element el-${result.ogyeokScores.외격?.fiveElement || '토'}`}>
                          {result.ogyeokScores.외격?.fiveElement || '-'}
                        </span>
                      </div>
                    </div>
                    {result.ogyeokScores.외격?.interpretation && (
                      <p className="od-interpretation">{result.ogyeokScores.외격.interpretation}</p>
                    )}
                  </div>
                  {/* 총격 */}
                  <div className="ogyeok-detail-item">
                    <div className="od-row">
                      <div className="od-left">
                        <span className="od-name">총격</span>
                        <span className="od-desc">(성+이름 전체)</span>
                      </div>
                      <div className="od-calc">= {result.ogyeokScores.총격?.formula || result.ogyeokScores.총격?.strokes || '-'}</div>
                      <div className="od-right">
                        <span className="od-last">끝 {(result.ogyeokScores.총격?.strokes ?? 0) % 10}</span>
                        <span className="od-arrow">→</span>
                        <span className={`od-element el-${result.ogyeokScores.총격?.fiveElement || '토'}`}>
                          {result.ogyeokScores.총격?.fiveElement || '-'}
                        </span>
                      </div>
                    </div>
                    {result.ogyeokScores.총격?.interpretation && (
                      <p className="od-interpretation">{result.ogyeokScores.총격.interpretation}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 3) 획수 → 오행 흐름 */}
              <div className="stroke-section">
                <div className="stroke-section-title">③ 획수 오행 흐름</div>

                {/* 오행 흐름 시각화 */}
                <div className="ogyeok-flow-visual">
                  {['천격', '인격', '지격', '외격', '총격'].map((key, idx) => {
                    const value = result.ogyeokScores[key as keyof typeof result.ogyeokScores]
                    if (!value || typeof value !== 'object' || !('fiveElement' in value)) return null
                    return (
                      <span key={key} className="ofv-item">
                        <span className={`ofv-element el-${value.fiveElement}`}>{value.fiveElement}</span>
                        <span className="ofv-label">{key.replace('격', '')}</span>
                        {idx < 4 && <span className="ofv-arrow">·</span>}
                      </span>
                    )
                  })}
                </div>

                {/* 삼재 분석 */}
                {result.ogyeokScores.samjae && (
                  <div className="samjae-box">
                    <div className="samjae-header">
                      <span className="samjae-title">삼재(천·인·지) 흐름</span>
                      <span className={`samjae-type type-${result.ogyeokScores.samjae.type}`}>
                        {result.ogyeokScores.samjae.type}
                      </span>
                    </div>
                    <div className="samjae-flow">
                      {result.ogyeokScores.samjae.elements?.map((el, idx) => (
                        <span key={idx} className="samjae-element">
                          <span className={`se-badge el-${el}`}>{el}</span>
                          <span className="se-label">{['천', '인', '지'][idx]}</span>
                          {idx < 2 && <span className="se-arrow">→</span>}
                        </span>
                      ))}
                    </div>
                    <p className="samjae-desc">{result.ogyeokScores.samjae.description}</p>
                  </div>
                )}
              </div>

              {/* 획수 → 오행 기준 안내 */}
              <div className="ogyeok-note">
                <span className="note-icon">💡</span>
                <span className="note-text">
                  획수 끝자리로 오행 판단: 1·2=목, 3·4=화, 5·6=토, 7·8=금, 9·0=수
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 종합 요약 (항상 펼침) */}
        <div className="result-section summary-section always-open">
          <div className="section-header">
            <span className="section-icon">📝</span>
            <span className="section-title">종합 분석</span>
          </div>
          <div className="section-content">
            <p className="summary-text">{result.summary}</p>
            <div className="advice-box">
              <span className="advice-icon">🌟</span>
              <p>{result.advice}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
