import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { allTarotMeanings, TarotMeaning } from '../utils/tarotMeanings'

type GamePhase = 'intro' | 'selecting' | 'revealing' | 'result'

interface DrawnCard {
  card: TarotMeaning
  isReversed: boolean
  isFlipped: boolean
  position: number
}

export default function Tarot() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<GamePhase>('intro')
  const [shuffledDeck, setShuffledDeck] = useState<TarotMeaning[]>([])
  const [selectedCards, setSelectedCards] = useState<DrawnCard[]>([])
  const [revealIndex, setRevealIndex] = useState(0)
  const [isShuffling, setIsShuffling] = useState(false)

  // 덱 셔플 (78장에서 셔플)
  const shuffleDeck = () => {
    const shuffled = [...allTarotMeanings].sort(() => Math.random() - 0.5)
    setShuffledDeck(shuffled)
  }

  // 시작하기
  const startReading = () => {
    shuffleDeck()
    setSelectedCards([])
    setRevealIndex(0)
    setPhase('selecting')
  }

  // 카드 섞기 (선택 화면에서) - 선택한 카드는 유지
  const handleShuffle = () => {
    if (isShuffling) return
    setIsShuffling(true)

    setTimeout(() => {
      shuffleDeck()
    }, 400)

    setTimeout(() => {
      setIsShuffling(false)
    }, 800)
  }

  // 카드 선택 (3장)
  const selectCard = (index: number) => {
    if (selectedCards.length >= 3) return
    if (selectedCards.some(c => c.position === index)) return

    const card = shuffledDeck[index]
    if (!card) return

    const isReversed = Math.random() < 0.3

    setSelectedCards(prev => [...prev, {
      card,
      isReversed,
      isFlipped: false,
      position: index,
    }])
  }

  // 3장 선택 완료 시 결과 단계로
  useEffect(() => {
    if (selectedCards.length === 3 && phase === 'selecting') {
      setTimeout(() => setPhase('revealing'), 500)
    }
  }, [selectedCards, phase])

  // 카드 뒤집기 애니메이션
  useEffect(() => {
    if (phase === 'revealing' && revealIndex < 3) {
      const timer = setTimeout(() => {
        setSelectedCards(prev =>
          prev.map((c, i) => i === revealIndex ? { ...c, isFlipped: true } : c)
        )
        setRevealIndex(prev => prev + 1)
      }, 800)
      return () => clearTimeout(timer)
    }
    if (phase === 'revealing' && revealIndex >= 3) {
      setTimeout(() => setPhase('result'), 500)
    }
  }, [phase, revealIndex])

  // 다시하기
  const resetReading = () => {
    setPhase('intro')
    setSelectedCards([])
    setRevealIndex(0)
  }

  const positionLabels = ['과거', '현재', '미래']

  return (
    <div className="tarot-page">
      <header className="tarot-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 홈으로
        </button>
        <h1>타로 카드</h1>
      </header>

      {phase === 'intro' && (
        <div className="tarot-intro">
          <div className="tarot-intro-visual">
            <div className="floating-cards">
              <div className="floating-card card-1">🃏</div>
              <div className="floating-card card-2">🌙</div>
              <div className="floating-card card-3">⭐</div>
            </div>
          </div>
          <h2>오늘의 타로 리딩</h2>
          <p>마음을 가다듬고, 질문을 떠올리세요.<br />세 장의 카드가 과거, 현재, 미래를 보여줍니다.</p>
          <button className="tarot-start-btn" onClick={startReading}>
            카드 뽑기 시작
          </button>
        </div>
      )}

      {phase === 'selecting' && (
        <div className="tarot-selecting">
          <div className="selecting-guide">
            <p>카드 3장을 선택하세요</p>
            <div className="selection-progress">
              {[0, 1, 2].map(i => (
                <span key={i} className={`progress-dot ${selectedCards.length > i ? 'filled' : ''}`}>
                  {selectedCards.length > i ? positionLabels[i] : '?'}
                </span>
              ))}
            </div>
          </div>

          <div className={`card-spread ${isShuffling ? 'shuffling' : ''}`}>
            {shuffledDeck.slice(0, 10).map((_, index) => {
              const isSelected = selectedCards.some(c => c.position === index)
              const rotation = (index - 4.5) * 6
              const translateX = (index - 4.5) * 42
              return (
                <div
                  key={index}
                  className={`spread-card ${isSelected ? 'selected fly-away' : ''}`}
                  onClick={() => !isShuffling && selectCard(index)}
                  style={{
                    '--rotation': `${rotation}deg`,
                    '--translateX': `${translateX}px`,
                    '--i': index,
                    transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
                    zIndex: isSelected ? 100 : 10 - Math.abs(index - 4.5),
                  } as React.CSSProperties}
                >
                  <div className="card-back">
                    <div className="card-back-pattern">
                      <span>☽</span>
                      <span>★</span>
                      <span>☾</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="shuffle-action">
            <button
              className="shuffle-inline-btn"
              onClick={handleShuffle}
              disabled={isShuffling}
            >
              {isShuffling ? '섞는 중...' : '🔀 다시 섞기'}
            </button>
          </div>
        </div>
      )}

      {(phase === 'revealing' || phase === 'result') && (
        <div className="tarot-reveal">
          <div className="reveal-cards">
            {selectedCards.map((drawn, index) => (
              <div key={index} className="reveal-card-wrapper">
                <span className="position-label">{positionLabels[index]}</span>
                <div className={`reveal-card ${drawn.isFlipped ? 'flipped' : ''} ${drawn.isReversed ? 'reversed' : ''}`}>
                  <div className="card-inner">
                    <div className="card-back">
                      <div className="card-back-pattern">
                        <span>☽</span>
                        <span>★</span>
                        <span>☾</span>
                      </div>
                    </div>
                    <div className="card-front">
                      <img
                        src={getCardImagePath(drawn.card.id, drawn.card.number)}
                        alt={drawn.card.name}
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
            <div className="tarot-interpretation">
              {selectedCards.map((drawn, index) => (
                <div key={index} className="interpretation-card">
                  <div className="interpretation-header">
                    <span className="position-badge">{positionLabels[index]}</span>
                    <h3>{drawn.card.name} {drawn.isReversed && '(역방향)'}</h3>
                  </div>
                  <div className="interpretation-keywords">
                    {drawn.card.keywords.map((kw, i) => (
                      <span key={i} className="keyword">{kw}</span>
                    ))}
                  </div>
                  <p className="interpretation-text">
                    {drawn.isReversed ? drawn.card.reversed : drawn.card.upright}
                  </p>
                </div>
              ))}

              <div className="tarot-actions">
                <button className="tarot-action-btn primary" onClick={resetReading}>
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

// 카드 ID를 이미지 경로로 변환
function getCardImagePath(cardId: string, cardNumber: number): string {
  // Major Arcana (0-21)
  const majorArcanaMap: Record<string, string> = {
    'the-fool': '00-TheFool',
    'the-magician': '01-TheMagician',
    'the-high-priestess': '02-TheHighPriestess',
    'the-empress': '03-TheEmpress',
    'the-emperor': '04-TheEmperor',
    'the-hierophant': '05-TheHierophant',
    'the-lovers': '06-TheLovers',
    'the-chariot': '07-TheChariot',
    'strength': '08-Strength',
    'the-hermit': '09-TheHermit',
    'wheel-of-fortune': '10-WheelOfFortune',
    'justice': '11-Justice',
    'the-hanged-man': '12-TheHangedMan',
    'death': '13-Death',
    'temperance': '14-Temperance',
    'the-devil': '15-TheDevil',
    'the-tower': '16-TheTower',
    'the-star': '17-TheStar',
    'the-moon': '18-TheMoon',
    'the-sun': '19-TheSun',
    'judgement': '20-Judgement',
    'the-world': '21-TheWorld',
  }

  // Major Arcana 체크
  if (majorArcanaMap[cardId]) {
    return `/cards/${majorArcanaMap[cardId]}.jpg`
  }

  // Minor Arcana
  let suit = ''
  if (cardId.includes('-of-wands')) suit = 'Wands'
  else if (cardId.includes('-of-cups')) suit = 'Cups'
  else if (cardId.includes('-of-swords')) suit = 'Swords'
  else if (cardId.includes('-of-pentacles')) suit = 'Pentacles'

  if (suit) {
    const num = cardNumber.toString().padStart(2, '0')
    return `/cards/${suit}${num}.jpg`
  }

  return '/cards/CardBacks.jpg'
}
