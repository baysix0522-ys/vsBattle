import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, ConfigProvider, theme, App, Spin } from 'antd'
import { useAuth } from '../contexts/AuthContext'
import { battleApi, type BattleResultData, type Chemistry, type BattleStats, type SajuBasicAnalysis } from '../api/client'
import PixelFighter from '../components/PixelFighter'

// 일간 심볼
const DAY_MASTER_SYMBOLS: Record<string, string> = {
  갑: '🌲', 을: '🌿', 병: '☀️', 정: '🕯️', 무: '⛰️',
  기: '🌾', 경: '⚔️', 신: '💎', 임: '🌊', 계: '💧',
}

// 패배자의 굴복 멘트
const LOSER_MESSAGES = [
  '제가 졌습니다... 까불지 않겠습니다 🙇',
  '완패입니다... 형님이라 부르겠습니다 🙇',
  '항복합니다... 인정할 건 인정해야죠 🙇',
  '완전 발렸습니다... 운세의 차이란... 😭',
  '오늘은 제가 졌어요... 인정합니다 🥺',
]

// 승자의 승리 멘트
const WINNER_MESSAGES = [
  '오늘의 승자는 나! 😎',
  '역시 내 운세가 짱이지! 🏆',
  '운도 실력이다! 💪',
  '압도적 승리! 🎉',
  '오늘 하루 까불어도 됩니다 ㅋㅋ 👑',
]

// 무승부 멘트
const DRAW_MESSAGES = [
  '이번엔 비겼지만... 다음엔 꼭! 🤜🤛',
  '우린 라이벌인가봐요 ⚡',
  '막상막하! 다음에 다시 붙자! 🔥',
]

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)]
}

type Participant = {
  id: string
  nickname: string
  dayMaster: string
  dayMasterElement: string
  ilju: string
  stats: BattleStats
  basic: SajuBasicAnalysis
}

export default function BattleResult() {
  const navigate = useNavigate()
  const { battleId } = useParams<{ battleId: string }>()
  const { user, token } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BattleResultData | null>(null)
  const [chemistry, setChemistry] = useState<Chemistry | null>(null)
  const [winnerId, setWinnerId] = useState<string | null>(null)
  const [challenger, setChallenger] = useState<Participant | null>(null)
  const [opponent, setOpponent] = useState<Participant | null>(null)

  // 애니메이션 상태
  const [showIntro, setShowIntro] = useState(true)
  const [currentRound, setCurrentRound] = useState(-1)
  const [showFinalResult, setShowFinalResult] = useState(false)

  // 캐릭터 액션 상태
  const [challengerAction, setChallengerAction] = useState<'idle' | 'attack' | 'hit' | 'victory' | 'ultimate' | 'defeat'>('idle')
  const [opponentAction, setOpponentAction] = useState<'idle' | 'attack' | 'hit' | 'victory' | 'ultimate' | 'defeat'>('idle')
  const [stageShaking, setStageShaking] = useState(false)

  useEffect(() => {
    if (!battleId || !token) return

    const fetchResult = async () => {
      try {
        const res = await battleApi.getBattleResult(token, battleId)
        setResult(res.result)
        setChemistry(res.chemistry)
        setWinnerId(res.winnerId)
        setChallenger(res.challenger)
        setOpponent(res.opponent)
      } catch (err) {
        console.error('결과 조회 실패:', err)
        setError(err instanceof Error ? err.message : '결과를 불러올 수 없습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [battleId, token])

  // 애니메이션 시퀀스
  useEffect(() => {
    if (!result || !result.rounds || loading) return

    // 인트로 후 라운드 시작
    const introTimer = setTimeout(() => {
      setShowIntro(false)
      setCurrentRound(0)
    }, 2500)

    return () => clearTimeout(introTimer)
  }, [result, loading])

  useEffect(() => {
    if (currentRound < 0 || !result || !result.rounds) return

    if (currentRound < result.rounds.length) {
      // 현재 라운드 결과에 따라 캐릭터 액션 설정
      const round = result.rounds[currentRound]
      if (round.winner === 'challenger') {
        setChallengerAction('attack')
        setOpponentAction('hit')
        // 충격 효과
        setTimeout(() => setStageShaking(true), 300)
        setTimeout(() => setStageShaking(false), 600)
      } else if (round.winner === 'opponent') {
        setChallengerAction('hit')
        setOpponentAction('attack')
        // 충격 효과
        setTimeout(() => setStageShaking(true), 300)
        setTimeout(() => setStageShaking(false), 600)
      } else {
        // 무승부
        setChallengerAction('attack')
        setOpponentAction('attack')
      }

      // 액션 후 idle로 복귀 (애니메이션 완료 후)
      const resetTimer = setTimeout(() => {
        setChallengerAction('idle')
        setOpponentAction('idle')
      }, 700)

      // 다음 라운드로 (충분한 시간 후)
      const roundTimer = setTimeout(() => {
        setCurrentRound((prev) => prev + 1)
      }, 1200)

      return () => {
        clearTimeout(resetTimer)
        clearTimeout(roundTimer)
      }
    } else {
      // 모든 라운드 완료 후 최종 결과
      if (result.winner === 'challenger') {
        setChallengerAction('victory')
        setOpponentAction('defeat')  // 패배 애니메이션
      } else if (result.winner === 'opponent') {
        setChallengerAction('defeat')  // 패배 애니메이션
        setOpponentAction('victory')
      } else {
        setChallengerAction('idle')
        setOpponentAction('idle')
      }

      const finalTimer = setTimeout(() => {
        setShowFinalResult(true)
      }, 500)
      return () => clearTimeout(finalTimer)
    }
  }, [currentRound, result])

  if (!user || !token) {
    return (
      <div className="battle-page">
        <header className="battle-header">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <h1>대결 결과</h1>
          <div style={{ width: 40 }} />
        </header>
        <div className="battle-content">
          <div className="error-state">
            <span>🔒</span>
            <p>로그인이 필요합니다</p>
            <Button onClick={() => navigate('/login')}>로그인하기</Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="battle-page">
        <div className="battle-content loading-center">
          <Spin size="large" />
          <p>대결 결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !result || !result.rounds || !challenger || !opponent) {
    return (
      <div className="battle-page">
        <header className="battle-header">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <h1>대결 결과</h1>
          <div style={{ width: 40 }} />
        </header>
        <div className="battle-content">
          <div className="error-state">
            <span>❌</span>
            <p>{error || '결과를 찾을 수 없습니다'}</p>
            <Button onClick={() => navigate('/')}>홈으로</Button>
          </div>
        </div>
      </div>
    )
  }

  const isChallenger = user.id === challenger.id
  const myData = isChallenger ? challenger : opponent
  const opponentData = isChallenger ? opponent : challenger
  const amIWinner = winnerId === user.id
  const isDraw = result.winner === 'draw'

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#f97316',
          borderRadius: 12,
        },
      }}
    >
      <App>
        <div className="battle-result-page">
          {/* 인트로 애니메이션 */}
          {showIntro && (
            <div className="battle-intro-animation">
              {/* 캐릭터 스테이지 */}
              <div className="battle-stage">
                <PixelFighter color="silver" action="idle" nickname={challenger.nickname} />
                <span className="battle-vs">VS</span>
                <PixelFighter color="red" action="idle" flipped nickname={opponent.nickname} />
              </div>

              <div className="intro-vs-container">
                <div className="intro-player left">
                  <span className="player-symbol">{DAY_MASTER_SYMBOLS[challenger.dayMaster]}</span>
                  <span className="player-ilju">{challenger.ilju}</span>
                </div>
                {chemistry && (
                  <span className={`chemistry-badge ${chemistry.type === '천생연분' ? 'match' : chemistry.type === '숙명의라이벌' ? 'rival' : ''}`}>
                    {chemistry.type}
                  </span>
                )}
                <div className="intro-player right">
                  <span className="player-symbol">{DAY_MASTER_SYMBOLS[opponent.dayMaster]}</span>
                  <span className="player-ilju">{opponent.ilju}</span>
                </div>
              </div>
              <div className="intro-message">대결 시작!</div>
            </div>
          )}

          {/* 라운드별 결과 */}
          {!showIntro && !showFinalResult && (
            <div className="battle-rounds-animation">
              {/* 캐릭터 스테이지 */}
              <div className={`battle-stage ${stageShaking ? 'shaking' : ''}`}>
                <PixelFighter color="silver" action={challengerAction} nickname={challenger.nickname} />
                <span className="battle-vs">VS</span>
                <PixelFighter color="red" action={opponentAction} flipped nickname={opponent.nickname} />
              </div>

              {result.rounds.slice(0, currentRound + 1).map((round, idx) => {
                const challengerScore = round.challenger.score
                const opponentScore = round.opponent.score
                const isCurrentRound = idx === currentRound

                return (
                  <div
                    key={round.id}
                    className={`round-card ${isCurrentRound ? 'current' : 'done'} ${round.winner}`}
                  >
                    <div className="round-header">
                      <span className="round-icon">{round.icon}</span>
                      <span className="round-name">{round.name}</span>
                    </div>
                    <div className="round-scores">
                      <div className={`score-side challenger ${round.winner === 'challenger' ? 'winner' : ''}`}>
                        <span className="score-value">{challengerScore}</span>
                        <span className="score-grade">{round.challenger.grade}</span>
                      </div>
                      <div className="score-vs">
                        {round.winner === 'challenger' ? '>' : round.winner === 'opponent' ? '<' : '='}
                      </div>
                      <div className={`score-side opponent ${round.winner === 'opponent' ? 'winner' : ''}`}>
                        <span className="score-value">{opponentScore}</span>
                        <span className="score-grade">{round.opponent.grade}</span>
                      </div>
                    </div>
                    {round.winner !== 'draw' && (
                      <div className="round-winner-tag">
                        {round.winner === 'challenger' ? challenger.nickname : opponent.nickname} 승!
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="round-progress">
                라운드 {Math.min(currentRound + 1, 6)} / 6
              </div>
            </div>
          )}

          {/* 최종 결과 */}
          {showFinalResult && (
            <div className="final-result">
              {/* 캐릭터 스테이지 */}
              <div className="battle-stage final">
                <PixelFighter
                  color="silver"
                  action={result.winner === 'challenger' ? 'victory' : result.winner === 'opponent' ? 'defeat' : 'idle'}
                  nickname={challenger.nickname}
                />
                <span className="battle-vs">
                  {isDraw ? '🤝' : '👑'}
                </span>
                <PixelFighter
                  color="red"
                  action={result.winner === 'opponent' ? 'victory' : result.winner === 'challenger' ? 'defeat' : 'idle'}
                  flipped
                  nickname={opponent.nickname}
                />
              </div>

              <div className={`result-banner ${isDraw ? 'draw' : amIWinner ? 'win' : 'lose'}`}>
                <span className="result-icon">
                  {isDraw ? '🤝' : amIWinner ? '🏆' : '😢'}
                </span>
                <span className="result-text">
                  {isDraw ? '무승부!' : amIWinner ? '승리!' : '패배...'}
                </span>
              </div>

              {/* 패자의 굴복 메시지 */}
              <div className="loser-message-box">
                {isDraw ? (
                  <div className="draw-message">
                    <span className="message-speaker">둘 다:</span>
                    <p className="message-text">{getRandomMessage(DRAW_MESSAGES)}</p>
                  </div>
                ) : (
                  <>
                    <div className="loser-speech">
                      <span className="message-speaker">
                        {result.winner === 'challenger' ? opponent.nickname : challenger.nickname}:
                      </span>
                      <p className="message-text">{getRandomMessage(LOSER_MESSAGES)}</p>
                    </div>
                    <div className="winner-speech">
                      <span className="message-speaker">
                        {result.winner === 'challenger' ? challenger.nickname : opponent.nickname}:
                      </span>
                      <p className="message-text">{getRandomMessage(WINNER_MESSAGES)}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="score-summary mini">
                <span>{challenger.nickname} {result.challengerWins}승</span>
                {result.draws > 0 && <span className="draws">{result.draws}무</span>}
                <span>{opponent.nickname} {result.opponentWins}승</span>
              </div>

              {/* 케미스트리 */}
              {chemistry && (
                <div className={`chemistry-card ${chemistry.type === '천생연분' ? 'match' : chemistry.type === '숙명의라이벌' ? 'rival' : ''}`}>
                  <div className="chemistry-header">
                    <span className="chemistry-type">{chemistry.type}</span>
                    <span className="chemistry-score">{chemistry.compatibility}%</span>
                  </div>
                  <p className="chemistry-desc">{chemistry.description}</p>
                  <p className="chemistry-relation">{chemistry.stemRelation.description}</p>
                </div>
              )}

              {/* 라운드 상세 결과 */}
              <div className="rounds-detail">
                <h3>라운드별 결과</h3>
                {result.rounds.map((round) => (
                  <div key={round.id} className={`detail-row ${round.winner}`}>
                    <span className="detail-icon">{round.icon}</span>
                    <span className="detail-name">{round.name}</span>
                    <span className="detail-scores">
                      <span className={round.winner === 'challenger' ? 'winner' : ''}>{round.challenger.score}</span>
                      <span className="detail-vs">:</span>
                      <span className={round.winner === 'opponent' ? 'winner' : ''}>{round.opponent.score}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="result-actions">
                <Button
                  type="primary"
                  size="large"
                  onClick={() => navigate('/')}
                  style={{
                    height: 52,
                    fontSize: 16,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  }}
                >
                  홈으로
                </Button>
              </div>
            </div>
          )}
        </div>
      </App>
    </ConfigProvider>
  )
}
