import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  tennisTarotDeck,
  shuffleDeck,
  getTennisCardImagePath,
  generateReading,
  type TennisTarotCard,
  type DrawnTennisCard,
  type SpreadType,
} from '../lib/tennisTarot'

type GamePhase = 'intro' | 'selecting' | 'revealing' | 'result'
type Category = 'match' | 'practice' | 'mental' | 'body' | 'doubles'

const categoryInfo: Record<Category, { icon: string; label: string; desc: string; prefix: string; focus: string }> = {
  match: { icon: '🏆', label: '경기/매치', desc: '오늘 경기 운세', prefix: '오늘 경기에서', focus: '경기 운영에 집중하세요' },
  practice: { icon: '🎯', label: '연습/훈련', desc: '연습 효율 UP', prefix: '오늘 연습에서', focus: '루틴과 교정에 집중하세요' },
  mental: { icon: '🧠', label: '멘탈/집중', desc: '정신력 강화', prefix: '멘탈 관리 측면에서', focus: '호흡과 집중력에 신경 쓰세요' },
  body: { icon: '💪', label: '컨디션/부상예방', desc: '몸 상태 체크', prefix: '컨디션 관리 측면에서', focus: '워밍업과 스트레칭을 충분히 하세요' },
  doubles: { icon: '🤝', label: '복식/파트너', desc: '팀워크 운세', prefix: '파트너와 함께할 때', focus: '소통과 포지셔닝에 신경 쓰세요' },
}

export default function TennisTarot() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<GamePhase>('intro')
  const [category, setCategory] = useState<Category | null>(null)
  const [spreadType, setSpreadType] = useState<SpreadType>('one')
  const [shuffledDeck, setShuffledDeck] = useState<TennisTarotCard[]>([])
  const [selectedCards, setSelectedCards] = useState<DrawnTennisCard[]>([])
  const [revealIndex, setRevealIndex] = useState(0)
  const [isShuffling, setIsShuffling] = useState(false)

  const cardCount = spreadType === 'one' ? 1 : 3

  // 덱 셔플
  const doShuffle = () => {
    setShuffledDeck(shuffleDeck(tennisTarotDeck))
  }

  // 시작하기
  const startReading = (type: SpreadType) => {
    setSpreadType(type)
    doShuffle()
    setSelectedCards([])
    setRevealIndex(0)
    setPhase('selecting')
  }

  // 카드 섞기 (선택 화면에서)
  const handleShuffle = () => {
    if (isShuffling) return
    setIsShuffling(true)

    setTimeout(() => {
      doShuffle()
    }, 400)

    setTimeout(() => {
      setIsShuffling(false)
    }, 800)
  }

  // 카드 선택
  const selectCard = (index: number) => {
    if (selectedCards.length >= cardCount) return
    if (selectedCards.some((c) => c.position === index)) return

    const card = shuffledDeck[index]
    if (!card) return

    const isReversed = Math.random() < 0.3
    const reading = generateReading(card, isReversed, spreadType, selectedCards.length)

    setSelectedCards((prev) => [
      ...prev,
      {
        card,
        isReversed,
        isFlipped: false,
        position: index,
        reading,
      },
    ])
  }

  // 선택 완료 시 결과 단계로
  useEffect(() => {
    if (selectedCards.length === cardCount && phase === 'selecting') {
      setTimeout(() => setPhase('revealing'), 500)
    }
  }, [selectedCards, phase, cardCount])

  // 카드 뒤집기 애니메이션
  useEffect(() => {
    if (phase === 'revealing' && revealIndex < cardCount) {
      const timer = setTimeout(() => {
        setSelectedCards((prev) =>
          prev.map((c, i) => (i === revealIndex ? { ...c, isFlipped: true } : c))
        )
        setRevealIndex((prev) => prev + 1)
      }, 800)
      return () => clearTimeout(timer)
    }
    if (phase === 'revealing' && revealIndex >= cardCount) {
      setTimeout(() => setPhase('result'), 500)
    }
  }, [phase, revealIndex, cardCount])

  // 다시하기
  const resetReading = () => {
    setPhase('intro')
    setCategory(null)
    setSelectedCards([])
    setRevealIndex(0)
  }

  const threeCardLabels = ['컨디션', '전략', '주의']

  return (
    <div className="tennis-tarot-page">
      <header className="tarot-header tennis">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 홈으로
        </button>
        <h1>🎾 테니스 타로</h1>
      </header>

      {phase === 'intro' && (
        <div className="tennis-intro">
          <div className="tennis-intro-visual">
            <div className="floating-cards tennis">
              <div className="floating-card card-1">🎾</div>
              <div className="floating-card card-2">🃏</div>
              <div className="floating-card card-3">🏆</div>
            </div>
          </div>
          <h2>오늘의 테니스 운세</h2>
          <p>
            경기 또는 연습 전, 카드에게 물어보세요.
            <br />
            오늘의 컨디션과 전략 힌트를 알려드립니다.
          </p>

          {/* 카테고리 선택 */}
          {!category ? (
            <div className="category-selection">
              <h3 className="category-title">어떤 상황인가요?</h3>
              <div className="category-grid">
                {(Object.keys(categoryInfo) as Category[]).map((cat) => (
                  <button
                    key={cat}
                    className="category-btn"
                    onClick={() => setCategory(cat)}
                  >
                    <span className="category-icon">{categoryInfo[cat].icon}</span>
                    <span className="category-label">{categoryInfo[cat].label}</span>
                    <span className="category-desc">{categoryInfo[cat].desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* 스프레드 선택 */
            <div className="spread-selection">
              <div className="selected-category-badge" onClick={() => setCategory(null)}>
                <span>{categoryInfo[category].icon}</span>
                <span>{categoryInfo[category].label}</span>
                <span className="change-hint">← 변경</span>
              </div>
              <div className="spread-buttons">
                <button className="spread-btn one" onClick={() => startReading('one')}>
                  <span className="spread-icon">🃏</span>
                  <span className="spread-title">원카드</span>
                  <span className="spread-desc">핵심 메시지 1장</span>
                </button>
                <button className="spread-btn three" onClick={() => startReading('three')}>
                  <span className="spread-icon">🃏🃏🃏</span>
                  <span className="spread-title">쓰리카드</span>
                  <span className="spread-desc">컨디션 / 전략 / 주의</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'selecting' && (
        <div className="tarot-selecting tennis">
          <div className="selecting-guide">
            <p>
              카드 {cardCount}장을 선택하세요
              {spreadType === 'three' && <span className="spread-hint"> (컨디션 → 전략 → 주의)</span>}
            </p>
            <div className="selection-progress">
              {Array.from({ length: cardCount }).map((_, i) => (
                <span key={i} className={`progress-dot ${selectedCards.length > i ? 'filled' : ''}`}>
                  {selectedCards.length > i
                    ? spreadType === 'three'
                      ? threeCardLabels[i]
                      : '✓'
                    : '?'}
                </span>
              ))}
            </div>
          </div>

          <div className={`card-spread ${isShuffling ? 'shuffling' : ''}`}>
            {shuffledDeck.slice(0, 10).map((_, index) => {
              const isSelected = selectedCards.some((c) => c.position === index)
              const rotation = (index - 4.5) * 6
              const translateX = (index - 4.5) * 42
              return (
                <div
                  key={index}
                  className={`spread-card ${isSelected ? 'selected fly-away' : ''}`}
                  onClick={() => !isShuffling && selectCard(index)}
                  style={
                    {
                      '--rotation': `${rotation}deg`,
                      '--translateX': `${translateX}px`,
                      '--i': index,
                      transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
                      zIndex: isSelected ? 100 : 10 - Math.abs(index - 4.5),
                    } as React.CSSProperties
                  }
                >
                  <div className="card-back tennis">
                    <div className="card-back-pattern">
                      <span>🎾</span>
                      <span>★</span>
                      <span>🎾</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="shuffle-action">
            <button className="shuffle-inline-btn" onClick={handleShuffle} disabled={isShuffling}>
              {isShuffling ? '섞는 중...' : '🔀 다시 섞기'}
            </button>
          </div>
        </div>
      )}

      {(phase === 'revealing' || phase === 'result') && (
        <div className="tarot-reveal tennis">
          <div className={`reveal-cards ${spreadType === 'one' ? 'single' : ''}`}>
            {selectedCards.map((drawn, index) => (
              <div key={index} className="reveal-card-wrapper">
                {spreadType === 'three' && (
                  <span className="position-label">{threeCardLabels[index]}</span>
                )}
                <div
                  className={`reveal-card ${drawn.isFlipped ? 'flipped' : ''} ${drawn.isReversed ? 'reversed' : ''}`}
                >
                  <div className="card-inner">
                    <div className="card-back tennis">
                      <div className="card-back-pattern">
                        <span>🎾</span>
                        <span>★</span>
                        <span>🎾</span>
                      </div>
                    </div>
                    <div className="card-front">
                      <img
                        src={getTennisCardImagePath(drawn.card)}
                        alt={drawn.card.name_ko}
                        className="card-image"
                      />
                      {drawn.isReversed && <div className="reversed-badge">역방향</div>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {phase === 'result' && (
            <div className="tennis-interpretation">
              {/* 카테고리 컨텍스트 표시 */}
              {category && (
                <div className="category-context">
                  <span className="context-icon">{categoryInfo[category].icon}</span>
                  <span className="context-label">{categoryInfo[category].label}</span>
                </div>
              )}

              {spreadType === 'one' && selectedCards[0] ? (
                // 원카드 해석
                <div className="one-card-reading">
                  <div className="reading-header">
                    <h3>
                      🎾 {selectedCards[0].card.name_ko}
                      {selectedCards[0].isReversed && ' (역방향)'}
                    </h3>
                    <span className="card-name-en">{selectedCards[0].card.name_en}</span>
                  </div>

                  <div className="reading-section summary">
                    <div className="section-icon">💫</div>
                    <p>
                      {category && <strong>{categoryInfo[category].prefix} </strong>}
                      {selectedCards[0].reading.summary}
                    </p>
                  </div>

                  <div className="reading-section action">
                    <div className="section-label">🎯 오늘의 액션</div>
                    <p>{selectedCards[0].reading.action}</p>
                  </div>

                  <div className="reading-section caution">
                    <div className="section-label">⚠️ 주의 포인트</div>
                    <p>{selectedCards[0].reading.caution}</p>
                  </div>

                  {selectedCards[0].reading.focus && (
                    <div className="reading-section focus">
                      <div className="section-label">🔍 집중 키워드</div>
                      <div className="focus-keywords">
                        {selectedCards[0].reading.focus.map((kw, i) => (
                          <span key={i} className="focus-keyword">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 카테고리별 포커스 메시지 */}
                  {category && (
                    <div className="reading-section category-focus">
                      <div className="section-label">{categoryInfo[category].icon} {categoryInfo[category].label} 포인트</div>
                      <p>{categoryInfo[category].focus}</p>
                    </div>
                  )}
                </div>
              ) : spreadType === 'three' ? (
                // 쓰리카드 해석
                <div className="three-card-reading">
                  {selectedCards.map((drawn, index) => (
                    <div key={index} className="card-reading-section">
                      <div className="reading-header">
                        <span className="position-badge tennis">{threeCardLabels[index]}</span>
                        <h3>
                          {drawn.card.name_ko}
                          {drawn.isReversed && ' (역)'}
                        </h3>
                      </div>

                      {index === 0 && drawn.reading.condition && (
                        <div className="reading-content">
                          <p>
                            {category && <strong>{categoryInfo[category].prefix} </strong>}
                            {drawn.reading.condition}
                          </p>
                          {drawn.reading.focus && (
                            <div className="focus-keywords small">
                              {drawn.reading.focus.map((kw, i) => (
                                <span key={i} className="focus-keyword">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {index === 1 && drawn.reading.strategy && (
                        <div className="reading-content">
                          <p>{drawn.reading.strategy}</p>
                          {drawn.reading.action && (
                            <p className="sub-reading">💡 {drawn.reading.action}</p>
                          )}
                        </div>
                      )}

                      {index === 2 && drawn.reading.warning && (
                        <div className="reading-content">
                          <p>{drawn.reading.warning}</p>
                          {drawn.reading.caution && (
                            <p className="sub-reading">⚠️ {drawn.reading.caution}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* 카테고리별 포커스 메시지 */}
                  {category && (
                    <div className="category-focus-section">
                      <div className="focus-badge">
                        {categoryInfo[category].icon} {categoryInfo[category].label} 포인트
                      </div>
                      <p>{categoryInfo[category].focus}</p>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="tarot-actions">
                <button className="tarot-action-btn primary tennis" onClick={resetReading}>
                  다시 뽑기
                </button>
                <button className="tarot-action-btn secondary" onClick={() => navigate('/')}>
                  홈으로
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
