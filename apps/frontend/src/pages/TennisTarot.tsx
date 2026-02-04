import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  tennisTarotDeck,
  shuffleDeck,
  getTennisCardImagePath,
  generateReading,
  type TennisTarotCard,
  type DrawnCard,
  type Category,
  type Reading,
} from '../lib/tennisTarot'

type GamePhase = 'intro' | 'selecting' | 'revealing' | 'result'

const categoryInfo: Record<Category, { icon: string; label: string; desc: string }> = {
  match: { icon: '🏆', label: '경기/매치', desc: '오늘 경기 운세' },
  practice: { icon: '🎯', label: '연습/훈련', desc: '연습 효율 UP' },
  mental: { icon: '🧠', label: '멘탈/집중', desc: '정신력 강화' },
  body: { icon: '💪', label: '컨디션/부상예방', desc: '몸 상태 체크' },
  doubles: { icon: '🤝', label: '복식/파트너', desc: '팀워크 운세' },
}

export default function TennisTarot() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<GamePhase>('intro')
  const [category, setCategory] = useState<Category | null>(null)
  const [shuffledDeck, setShuffledDeck] = useState<TennisTarotCard[]>([])
  const [drawnCard, setDrawnCard] = useState<DrawnCard | null>(null)
  const [reading, setReading] = useState<Reading | null>(null)
  const [isShuffling, setIsShuffling] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  // 덱 셔플
  const doShuffle = () => {
    setShuffledDeck(shuffleDeck(tennisTarotDeck))
  }

  // 시작하기
  const startReading = () => {
    if (!category) return
    doShuffle()
    setDrawnCard(null)
    setReading(null)
    setPhase('selecting')
  }

  // 카드 섞기
  const handleShuffle = () => {
    if (isShuffling) return
    setIsShuffling(true)
    setTimeout(() => doShuffle(), 400)
    setTimeout(() => setIsShuffling(false), 800)
  }

  // 카드 선택
  const selectCard = (index: number) => {
    if (drawnCard || !category) return

    const card = shuffledDeck[index]
    if (!card) return

    const isReversed = Math.random() < 0.3
    const generatedReading = generateReading(card, isReversed, category)

    setSelectedIndex(index)
    setDrawnCard({ card, isReversed, isFlipped: false })
    setReading(generatedReading)
  }

  // 선택 완료 시 revealing으로
  useEffect(() => {
    if (drawnCard && phase === 'selecting') {
      setTimeout(() => setPhase('revealing'), 500)
    }
  }, [drawnCard, phase])

  // 카드 뒤집기
  useEffect(() => {
    if (phase === 'revealing' && drawnCard && !drawnCard.isFlipped) {
      const timer = setTimeout(() => {
        setDrawnCard((prev) => prev && { ...prev, isFlipped: true })
      }, 800)
      return () => clearTimeout(timer)
    }
    if (phase === 'revealing' && drawnCard?.isFlipped) {
      setTimeout(() => setPhase('result'), 500)
    }
  }, [phase, drawnCard])

  // 다시하기
  const resetReading = () => {
    setPhase('intro')
    setCategory(null)
    setDrawnCard(null)
    setReading(null)
    setSelectedIndex(null)
  }

  // 한줄평 생성
  const generateOneLiner = (): string => {
    if (!reading || !reading.focus || reading.focus.length < 2) return ''
    return `${reading.focus[0]}에 집중, ${reading.focus[1]} 챙기기`
  }

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
          <div className="category-selection">
            <h3 className="category-title">어떤 상황인가요?</h3>
            <div className="category-grid">
              {(Object.keys(categoryInfo) as Category[]).map((cat) => (
                <button
                  key={cat}
                  className={`category-btn ${category === cat ? 'selected' : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  <span className="category-icon">{categoryInfo[cat].icon}</span>
                  <span className="category-label">{categoryInfo[cat].label}</span>
                  <span className="category-desc">{categoryInfo[cat].desc}</span>
                </button>
              ))}
            </div>

            {category && (
              <button className="start-reading-btn" onClick={startReading}>
                🃏 카드 뽑으러 가기
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'selecting' && (
        <div className="tarot-selecting tennis">
          <div className="selecting-guide">
            <p>카드 1장을 선택하세요</p>
            {category && (
              <div className="selected-category-tag">
                {categoryInfo[category].icon} {categoryInfo[category].label}
              </div>
            )}
          </div>

          <div className={`card-spread ${isShuffling ? 'shuffling' : ''}`}>
            {shuffledDeck.slice(0, 10).map((_, index) => {
              const isThisSelected = selectedIndex === index
              const isOtherSelected = selectedIndex !== null && selectedIndex !== index
              const rotation = (index - 4.5) * 6
              const translateX = (index - 4.5) * 42
              return (
                <div
                  key={index}
                  className={`spread-card ${isThisSelected ? 'fly-away' : ''} ${isOtherSelected ? 'fade-out' : ''}`}
                  onClick={() => !isShuffling && selectCard(index)}
                  style={{
                    '--rotation': `${rotation}deg`,
                    '--translateX': `${translateX}px`,
                    '--i': index,
                    transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
                    zIndex: isThisSelected ? 20 : 10 - Math.abs(index - 4.5),
                  } as React.CSSProperties}
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

      {(phase === 'revealing' || phase === 'result') && drawnCard && (
        <div className="tarot-reveal tennis">
          <div className="reveal-cards single">
            <div className="reveal-card-wrapper">
              <div className={`reveal-card ${drawnCard.isFlipped ? 'flipped' : ''} ${drawnCard.isReversed ? 'reversed' : ''}`}>
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
                      src={getTennisCardImagePath(drawnCard.card)}
                      alt={drawnCard.card.name_ko}
                      className="card-image"
                    />
                    {drawnCard.isReversed && <div className="reversed-badge">역방향</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {phase === 'result' && reading && category && (
            <div className="tennis-interpretation">
              {/* 카드 정보 */}
              <div className="card-info-section">
                <h3>{drawnCard.card.name_ko} {drawnCard.isReversed && '(역방향)'}</h3>
                <span className="card-name-en">{drawnCard.card.name_en}</span>
                <div className="card-keywords">
                  {reading.keywords.map((kw, i) => (
                    <span key={i} className="keyword-tag">{kw}</span>
                  ))}
                </div>
              </div>

              {/* 카드 이미지 설명 */}
              <div className="card-image-description">
                <p>{drawnCard.card.card.image}</p>
              </div>

              {/* 카드 의미 */}
              <div className="card-meaning-section">
                <div className="meaning-label">
                  {drawnCard.isReversed ? '🔄 역방향 의미' : '✨ 정방향 의미'}
                </div>
                <p className="card-meaning">
                  {drawnCard.isReversed
                    ? drawnCard.card.card.reversed.meaning
                    : drawnCard.card.card.upright.meaning}
                </p>
              </div>

              {/* 테니스 총평 */}
              <div className="tennis-general-section">
                <div className="general-label">🎾 테니스 운세</div>
                <p className="general-message">{reading.general}</p>
              </div>

              {/* 카테고리별 해석 */}
              <div className="category-reading-section">
                <div className="category-badge">
                  {categoryInfo[category].icon} {categoryInfo[category].label}
                </div>

                <div className="reading-message">
                  <p>{reading.message}</p>
                </div>

                <div className="reading-details">
                  <div className="reading-item action">
                    <span className="item-label">🎯 액션</span>
                    <p>{reading.action}</p>
                  </div>
                  <div className="reading-item caution">
                    <span className="item-label">⚠️ 주의</span>
                    <p>{reading.caution}</p>
                  </div>
                </div>

                <div className="focus-section">
                  <span className="focus-label">🔍 집중 키워드</span>
                  <div className="focus-keywords">
                    {reading.focus.map((kw, i) => (
                      <span key={i} className="focus-keyword">{kw}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 오늘의 한줄 */}
              <div className="one-liner-section">
                <div className="one-liner-label">🎾 오늘의 한줄</div>
                <p className="one-liner-text">{generateOneLiner()}</p>
              </div>

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
