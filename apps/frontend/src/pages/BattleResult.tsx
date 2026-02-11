import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../contexts/AuthContext'
import {
  battleApi,
  type BattleResultData,
  type Chemistry,
  type BattleStats,
  type SajuBasicAnalysis,
  type SajuDetailedReport,
  type ComparisonAnalysis,
} from '../api/client'
import BattleOverlay from '../components/platformer/BattleOverlay'
import './BattleResult.css'

// 오행 한글
const ELEMENT_NAMES: Record<string, string> = {
  wood: '목',
  fire: '화',
  earth: '토',
  metal: '금',
  water: '수',
}

type Participant = {
  id: string
  nickname: string
  dayMaster: string
  dayMasterElement: string
  ilju: string
  stats: BattleStats
  basic: SajuBasicAnalysis
  report: SajuDetailedReport
}

// 종합 스탯 합산
function getTotalScore(stats: BattleStats): number {
  return (
    stats.money.score +
    stats.love.score +
    stats.children.score +
    stats.career.score +
    stats.study.score +
    stats.health.score
  )
}

export default function BattleResult() {
  const navigate = useNavigate()
  const { battleId } = useParams<{ battleId: string }>()
  const { user, token } = useAuth()

  const containerRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BattleResultData | null>(null)
  const [chemistry, setChemistry] = useState<Chemistry | null>(null)
  const [challengerData, setChallengerData] = useState<Participant | null>(null)
  const [opponentData, setOpponentData] = useState<Participant | null>(null)
  const [scoresRevealed, setScoresRevealed] = useState(false)
  const [comparison, setComparison] = useState<ComparisonAnalysis | null>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)

  useEffect(() => {
    if (!battleId || !token) return

    const fetchResult = async () => {
      try {
        const res = await battleApi.getBattleResult(token, battleId)
        setResult(res.result)
        setChemistry(res.chemistry)
        setChallengerData(res.challenger)
        setOpponentData(res.opponent)

        // 이미 비교분석이 있으면 바로 세팅
        if (res.comparison) {
          setComparison(res.comparison)
        } else {
          // 없으면 비교분석 생성 요청 (백그라운드)
          setComparisonLoading(true)
          battleApi.getComparison(token, battleId)
            .then((compRes) => setComparison(compRes.comparison))
            .catch((err) => console.error('비교분석 요청 실패:', err))
            .finally(() => setComparisonLoading(false))
        }
      } catch (err) {
        console.error('결과 조회 실패:', err)
        setError(err instanceof Error ? err.message : '결과를 불러올 수 없습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [battleId, token])

  if (!user || !token) {
    return (
      <div className="saju-screen">
        <div className="error-state">
          <span>🔒</span>
          <p>로그인이 필요합니다</p>
          <button className="home-btn" onClick={() => navigate('/login')}>
            로그인하기
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="saju-screen">
        <div className="loading-center">
          <Spin size="large" />
          <p>대결 결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !result || !result.rounds || !challengerData || !opponentData) {
    return (
      <div className="saju-screen">
        <div className="error-state">
          <span>❌</span>
          <p>{error || '결과를 찾을 수 없습니다'}</p>
          <button className="home-btn" onClick={() => navigate('/')}>
            홈으로
          </button>
        </div>
      </div>
    )
  }

  const challengerTotal = getTotalScore(challengerData.stats)
  const opponentTotal = getTotalScore(opponentData.stats)

  const challengerElement = ELEMENT_NAMES[challengerData.dayMasterElement] || challengerData.dayMasterElement
  const opponentElement = ELEMENT_NAMES[opponentData.dayMasterElement] || opponentData.dayMasterElement

  return (
    <div className="battle-page-wrapper" ref={containerRef}>
      <div className="saju-screen">
        {/* 스텝 인디케이터 */}
        <div className="battle-steps" style={{ padding: '16px 16px 0' }}>
          <div className="step done">
            <span className="step-num">✓</span>
            <span className="step-text">내 사주 분석</span>
          </div>
          <div className="step-arrow">→</div>
          <div className="step done">
            <span className="step-num">✓</span>
            <span className="step-text">대결 링크 공유</span>
          </div>
          <div className="step-arrow">→</div>
          <div className="step active">
            <span className="step-num">3</span>
            <span className="step-text">대결 결과 확인!</span>
          </div>
        </div>

        {/* VS 헤더 */}
        <div className="versus-header">
          <div className="vs-player">
            <div className="vs-avatar blue">🐼</div>
            <div className="vs-name blue">{challengerData.nickname}</div>
            <div className="vs-sub">
              {challengerData.dayMaster}일간 · {challengerElement}오행
            </div>
            <div className="vs-sub">
              {challengerData.basic.balance} · {challengerData.basic.geukGuk}
            </div>
          </div>
          <div className="vs-badge">VS</div>
          <div className="vs-player">
            <div className="vs-avatar red">🐼</div>
            <div className="vs-name red">{opponentData.nickname}</div>
            <div className="vs-sub">
              {opponentData.dayMaster}일간 · {opponentElement}오행
            </div>
            <div className="vs-sub">
              {opponentData.basic.balance} · {opponentData.basic.geukGuk}
            </div>
          </div>
        </div>

        {/* 종합 스탯 */}
        <div className="total-section">
          <div className="total-label">⚔️ 종합 스탯</div>
          <div className="total-scores">
            <div className={`total-val blue ${scoresRevealed ? 'score-reveal' : 'score-hidden'}`}>
              {scoresRevealed ? challengerTotal : '???'}
            </div>
            <div className="total-vs">VS</div>
            <div className={`total-val red ${scoresRevealed ? 'score-reveal' : 'score-hidden'}`}>
              {scoresRevealed ? opponentTotal : '???'}
            </div>
          </div>
        </div>

        {/* 라운드별 스탯 카드 */}
        <div className="stats-battle">
          {result.rounds.map((round) => {
            const cardClass =
              round.winner === 'draw'
                ? 'draw-card'
                : round.winner === 'challenger'
                  ? 'win'
                  : 'lose'

            return (
              <div key={round.id} className={`stat-card ${scoresRevealed ? cardClass : ''}`}>
                <div className="stat-label">
                  {round.icon} {round.name}
                </div>
                <div className="stat-scores">
                  <span className={`stat-val blue ${scoresRevealed ? 'score-reveal' : 'score-hidden'}`}>
                    {scoresRevealed ? round.challenger.score : '??'}
                  </span>
                  <span className="stat-vs">:</span>
                  <span className={`stat-val red ${scoresRevealed ? 'score-reveal' : 'score-hidden'}`}>
                    {scoresRevealed ? round.opponent.score : '??'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* 케미스트리 */}
        {chemistry && (
          <div
            className={`chemistry-section ${
              chemistry.type === '천생연분'
                ? 'match'
                : chemistry.type === '숙명의라이벌'
                  ? 'rival'
                  : ''
            }`}
          >
            <div className="chemistry-header">
              <span className="chemistry-type">
                {chemistry.type === '천생연분' ? '💕' : chemistry.type === '숙명의라이벌' ? '⚡' : '🤝'}{' '}
                {chemistry.type}
              </span>
              <span className={`chemistry-score ${scoresRevealed ? 'score-reveal' : 'score-hidden'}`}>
                {scoresRevealed ? `${chemistry.compatibility}%` : '??%'}
              </span>
            </div>
            <p className="chemistry-desc">{chemistry.description}</p>
            <p className="chemistry-relation">{chemistry.stemRelation.description}</p>
          </div>
        )}

        {/* 사주 요약 */}
        <div className="summary-section">
          <div className="summary-title">📋 사주 요약</div>
          <div className="summary-text">
            <strong className="vs-name blue">{challengerData.nickname}</strong>{' '}
            {challengerData.report.summary}
          </div>
          <div className="summary-text" style={{ marginTop: 12 }}>
            <strong className="vs-name red">{opponentData.nickname}</strong>{' '}
            {opponentData.report.summary}
          </div>
        </div>

        {/* 대결 분석 */}
        <div className="summary-section">
          <div className="summary-title">🌟 대결 분석</div>
          <div className="summary-text">
            {(() => {
              // 각 라운드에서 큰 차이 나는 항목 찾기
              const bigWins = result.rounds
                .filter(r => r.winner !== 'draw' && r.scoreDiff >= 10)
                .sort((a, b) => b.scoreDiff - a.scoreDiff)

              const winnerName = result.winner === 'challenger'
                ? challengerData.nickname
                : result.winner === 'opponent'
                  ? opponentData.nickname
                  : null

              const parts: string[] = []

              if (bigWins.length > 0) {
                const top = bigWins.slice(0, 2)
                const topDescs = top.map(r => {
                  const who = r.winner === 'challenger' ? challengerData.nickname : opponentData.nickname
                  return `${r.name}에서 ${who}가 ${r.scoreDiff}점 차이로 우세`
                })
                parts.push(topDescs.join('하고, ') + '합니다.')
              }

              if (winnerName) {
                parts.push(
                  `종합 ${result.challengerWins}승 ${result.draws > 0 ? `${result.draws}무 ` : ''}${result.opponentWins}패로 ${winnerName}의 승리입니다.`
                )
              } else {
                parts.push(
                  `종합 ${result.challengerWins}승 ${result.draws}무 ${result.opponentWins}패로 팽팽한 무승부입니다.`
                )
              }

              if (challengerTotal !== opponentTotal) {
                const diff = Math.abs(challengerTotal - opponentTotal)
                const ahead = challengerTotal > opponentTotal
                  ? challengerData.nickname
                  : opponentData.nickname
                parts.push(`스탯 총합으로는 ${ahead}가 ${diff}점 앞서고 있습니다.`)
              }

              return parts.join(' ')
            })()}
          </div>
        </div>

        {/* 인생 조언 */}
        <div className="summary-section">
          <div className="summary-title">💡 인생 조언</div>
          <div className="summary-text">
            <strong className="vs-name blue">{challengerData.nickname}</strong>{' '}
            {challengerData.report.personality}
          </div>
          <div className="summary-text" style={{ marginTop: 12 }}>
            <strong className="vs-name red">{opponentData.nickname}</strong>{' '}
            {opponentData.report.personality}
          </div>
        </div>

        {/* AI 대결 해설 */}
        {scoresRevealed && (
          <div className="summary-section">
            <div className="summary-title">🤖 AI 대결 해설</div>
            {comparisonLoading ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Spin size="small" />
                <p style={{ fontSize: 13, color: '#999', marginTop: 8 }}>AI가 대결을 분석하고 있습니다...</p>
              </div>
            ) : comparison ? (
              <>
                {/* 라운드별 해설 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {comparison.rounds.map((round, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      borderLeft: `3px solid ${
                        round.advantage === 'challenger' ? '#3b82f6'
                          : round.advantage === 'opponent' ? '#ef4444'
                          : '#666'
                      }`,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#ccc', marginBottom: 4 }}>
                        {round.category}
                        <span style={{
                          fontSize: 11,
                          marginLeft: 8,
                          color: round.advantage === 'challenger' ? '#3b82f6'
                            : round.advantage === 'opponent' ? '#ef4444'
                            : '#666',
                        }}>
                          {round.advantage === 'challenger' ? `${challengerData.nickname} 우세`
                            : round.advantage === 'opponent' ? `${opponentData.nickname} 우세`
                            : '호각'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#aaa', lineHeight: 1.5 }}>
                        {round.narrative}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 전체 해설 */}
                <div style={{
                  marginTop: 16,
                  padding: '12px 14px',
                  background: 'rgba(249, 115, 22, 0.08)',
                  borderRadius: 8,
                  border: '1px solid rgba(249, 115, 22, 0.2)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f97316', marginBottom: 6 }}>
                    📢 총평
                  </div>
                  <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6 }}>
                    {comparison.overallNarrative}
                  </div>
                </div>

                {/* 궁합 해설 */}
                <div style={{
                  marginTop: 12,
                  padding: '12px 14px',
                  background: 'rgba(139, 92, 246, 0.08)',
                  borderRadius: 8,
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa', marginBottom: 6 }}>
                    💫 두 사주의 궁합
                  </div>
                  <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6 }}>
                    {comparison.chemistryNarrative}
                  </div>
                </div>

                {/* 승자 코멘트 */}
                <div style={{
                  marginTop: 12,
                  padding: '12px 14px',
                  background: 'rgba(234, 179, 8, 0.08)',
                  borderRadius: 8,
                  border: '1px solid rgba(234, 179, 8, 0.2)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#eab308', marginBottom: 6 }}>
                    🏆 승자 코멘트
                  </div>
                  <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6 }}>
                    {comparison.winnerCommentary}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: '#666', textAlign: 'center', padding: 12 }}>
                AI 해설을 불러올 수 없습니다
              </div>
            )}
          </div>
        )}

        {/* 홈 버튼 */}
        <div className="result-bottom-actions">
          <button className="home-btn" onClick={() => navigate('/')}>
            🏠 홈으로
          </button>
        </div>
      </div>

      {/* 오버레이 자동 배틀 (결과 UI 위에서 싸움) */}
      <BattleOverlay
        containerRef={containerRef}
        challenger={{
          nickname: challengerData.nickname,
          dayMaster: challengerData.dayMaster,
          element: challengerData.dayMasterElement,
        }}
        opponent={{
          nickname: opponentData.nickname,
          dayMaster: opponentData.dayMaster,
          element: opponentData.dayMasterElement,
        }}
        platformSelectors=".stat-card,.summary-section,.total-section,.chemistry-section"
        autoStart={true}
        onScoreReveal={() => setScoresRevealed(true)}
        scoresRevealed={scoresRevealed}
        predeterminedWinner={challengerTotal >= opponentTotal ? 'p1' : 'p2'}
      />
    </div>
  )
}
