/**
 * 오버레이 자동 배틀 컴포넌트
 * 사주 대결 결과 화면 위에 표시되는 2D 액션 전투
 */
import { useBattleOverlay } from '../../hooks/useBattleOverlay'
import './BattleOverlay.css'

interface BattleOverlayProps {
  containerRef: React.RefObject<HTMLDivElement>
  challenger: { nickname: string; dayMaster?: string }
  opponent: { nickname: string; dayMaster?: string }
  platformSelectors?: string
  onBattleEnd?: (winner: 'p1' | 'p2') => void
  autoStart?: boolean
}

export default function BattleOverlay({
  containerRef,
  challenger,
  opponent,
  platformSelectors,
  onBattleEnd,
  autoStart = true,
}: BattleOverlayProps) {
  const {
    canvasRef,
    isRunning,
    p1,
    p2,
    logs,
    start,
  } = useBattleOverlay({
    containerRef,
    challenger,
    opponent,
    ...(platformSelectors ? { platformSelectors } : {}),
    ...(onBattleEnd ? { onBattleEnd } : {}),
    autoStart,
  })

  // HP 계산
  const hp1Percent = p1 ? Math.max(0, (p1.hp / p1.mhp) * 100) : 100
  const hp2Percent = p2 ? Math.max(0, (p2.hp / p2.mhp) * 100) : 100
  const hp1Low = hp1Percent < 30
  const hp2Low = hp2Percent < 30

  // KO 상태
  const isKO = (p1?.dead || p2?.dead) && !isRunning
  const winner = p1?.dead ? p2 : p2?.dead ? p1 : null

  return (
    <>
      {/* 캔버스 오버레이 */}
      <canvas
        ref={canvasRef}
        className="battle-overlay-canvas"
      />

      {/* HUD */}
      <div className={`battle-overlay-hud ${isRunning || isKO ? 'on' : ''}`}>
        <div className="hud-health blue">
          <div className="hud-name blue">🐼 {challenger.nickname}</div>
          <div className="hud-bar">
            <div
              className={`hud-fill blue ${hp1Low ? 'low' : ''}`}
              style={{ width: `${hp1Percent}%` }}
            />
            <div className="hud-shine" />
          </div>
          <div className="hud-text">{p1?.hp ?? 400}/{p1?.mhp ?? 400}</div>
        </div>

        <div className="hud-vs">VS</div>

        <div className="hud-health red">
          <div className="hud-name red">{opponent.nickname} 🐼</div>
          <div className="hud-bar">
            <div
              className={`hud-fill red ${hp2Low ? 'low' : ''}`}
              style={{ width: `${hp2Percent}%` }}
            />
            <div className="hud-shine" />
          </div>
          <div className="hud-text" style={{ textAlign: 'right' }}>
            {p2?.hp ?? 400}/{p2?.mhp ?? 400}
          </div>
        </div>
      </div>

      {/* 배틀 로그 */}
      <div className="battle-overlay-log">
        {logs.map(log => (
          <div key={log.id} className="log-item">
            {log.message}
          </div>
        ))}
      </div>

      {/* KO 오버레이 */}
      <div className={`battle-overlay-ko ${isKO ? 'show' : ''}`}>
        <h1 className="ko-title">K.O.!</h1>
        {winner && (
          <p className={`ko-winner ${winner.isBlue ? 'blue' : 'red'}`}>
            🏆 {winner.nm} 승리!
          </p>
        )}
        <button className="ko-restart" onClick={start}>
          ⚔️ 다시 대결
        </button>
      </div>
    </>
  )
}
