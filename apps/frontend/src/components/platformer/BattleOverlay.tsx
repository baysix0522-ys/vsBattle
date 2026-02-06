/**
 * 오버레이 자동 배틀 컴포넌트
 * 사주 대결 결과 화면 위에 표시되는 2D 액션 전투
 * + 격투게임 스타일 선수 소개 인트로 (3초)
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useBattleOverlay } from '../../hooks/useBattleOverlay'
import './BattleOverlay.css'

interface BattleOverlayProps {
  containerRef: React.RefObject<HTMLDivElement>
  challenger: { nickname: string; dayMaster?: string; element?: string }
  opponent: { nickname: string; dayMaster?: string; element?: string }
  platformSelectors?: string
  onBattleEnd?: (winner: 'p1' | 'p2') => void
  onScoreReveal?: () => void
  scoresRevealed?: boolean
  autoStart?: boolean
  /** 종합 점수 기반 미리 정해진 승자 */
  predeterminedWinner?: 'p1' | 'p2'
}

// 오행 표시
const ELEMENT_DISPLAY: Record<string, { label: string; hanja: string }> = {
  wood: { label: '목', hanja: '木' },
  fire: { label: '화', hanja: '火' },
  earth: { label: '토', hanja: '土' },
  metal: { label: '금', hanja: '金' },
  water: { label: '수', hanja: '水' },
}

// 오행별 스프라이트 시트 매핑 (영어 + 한글 키 모두 지원)
const ELEMENT_SPRITES: Record<string, string> = {
  // 영어 키
  wood: '/sprites/green-panda-sheet.png',
  fire: '/sprites/red-panda-sheet.png',
  earth: '/sprites/brown-panda-sheet.png',
  metal: '/sprites/yellow-panda-sheet.png',
  water: '/sprites/blue-panda-sheet.png',
  // 한글 키
  목: '/sprites/green-panda-sheet.png',
  화: '/sprites/red-panda-sheet.png',
  토: '/sprites/brown-panda-sheet.png',
  금: '/sprites/yellow-panda-sheet.png',
  수: '/sprites/blue-panda-sheet.png',
}

// 스프라이트 시트 원본 프레임 크기
const SPRITE_FS = 192
// 인트로 캔버스 표시 크기
const INTRO_SIZE = 110

export default function BattleOverlay({
  containerRef,
  challenger,
  opponent,
  platformSelectors,
  onBattleEnd,
  onScoreReveal,
  scoresRevealed = false,
  autoStart = true,
  predeterminedWinner,
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
    ...(predeterminedWinner ? { predeterminedWinner } : {}),
    autoStart: false,
  })

  // ====== 인트로 상태 ======
  type IntroPhase = 'waiting' | 'p1-in' | 'p2-in' | 'vs' | 'fight' | 'done'
  const [introPhase, setIntroPhase] = useState<IntroPhase>(
    autoStart ? 'waiting' : 'done'
  )

  const introCanvasP1 = useRef<HTMLCanvasElement>(null)
  const introCanvasP2 = useRef<HTMLCanvasElement>(null)

  const p1El = challenger.element ? ELEMENT_DISPLAY[challenger.element] : null
  const p2El = opponent.element ? ELEMENT_DISPLAY[opponent.element] : null

  // ====== 인트로 정적 스프라이트 (첫 프레임만 1회 그리기) ======
  const drawStaticSprite = useCallback(() => {
    const c1 = introCanvasP1.current?.getContext('2d')
    const c2 = introCanvasP2.current?.getContext('2d')
    if (!c1 || !c2) return

    c1.imageSmoothingEnabled = false
    c2.imageSmoothingEnabled = false

    const half = INTRO_SIZE / 2
    const radius = half - 5

    const drawFirst = (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
      ctx.clearRect(0, 0, INTRO_SIZE, INTRO_SIZE)
      ctx.save()
      ctx.beginPath()
      ctx.arc(half, half, radius, 0, Math.PI * 2)
      ctx.clip()
      // 첫 번째 프레임(0번)만 그리기
      ctx.drawImage(
        img,
        0, 0, SPRITE_FS, SPRITE_FS,
        0, 0, INTRO_SIZE, INTRO_SIZE
      )
      ctx.restore()
    }

    const p1Sprite = challenger.element
      ? ELEMENT_SPRITES[challenger.element] || '/sprites/blue-panda-sheet.png'
      : '/sprites/blue-panda-sheet.png'
    const p2Sprite = opponent.element
      ? ELEMENT_SPRITES[opponent.element] || '/sprites/red-panda-sheet.png'
      : '/sprites/red-panda-sheet.png'

    const p1Img = new Image()
    p1Img.src = p1Sprite
    p1Img.onload = () => drawFirst(c1, p1Img)

    const p2Img = new Image()
    p2Img.src = p2Sprite
    p2Img.onload = () => drawFirst(c2, p2Img)
  }, [challenger.element, opponent.element])

  // ====== 인트로 시퀀스 (총 3초) ======
  useEffect(() => {
    if (!autoStart || introPhase === 'done') return

    drawStaticSprite()

    const t: ReturnType<typeof setTimeout>[] = []
    t.push(setTimeout(() => setIntroPhase('p1-in'), 200))
    t.push(setTimeout(() => setIntroPhase('p2-in'), 500))
    t.push(setTimeout(() => setIntroPhase('vs'), 1100))
    t.push(setTimeout(() => setIntroPhase('fight'), 1800))
    t.push(setTimeout(() => {
      setIntroPhase('done')
      start()
    }, 3000))

    return () => {
      t.forEach(clearTimeout)
    }
  }, [autoStart]) // eslint-disable-line react-hooks/exhaustive-deps

  // ====== 계산 ======
  const hp1Pct = p1 ? Math.max(0, (p1.hp / p1.mhp) * 100) : 100
  const hp2Pct = p2 ? Math.max(0, (p2.hp / p2.mhp) * 100) : 100
  const isKO = (p1?.dead || p2?.dead) && !isRunning && !scoresRevealed
  const winner = p1?.dead ? p2 : p2?.dead ? p1 : null

  const showIntro = introPhase !== 'done'
  const p1Show = introPhase !== 'waiting'
  const p2Show = introPhase === 'p2-in' || introPhase === 'vs' || introPhase === 'fight'
  const vsShow = introPhase === 'vs' || introPhase === 'fight'
  const fightShow = introPhase === 'fight'

  return (
    <>
      {/* ====== 인트로 오버레이 ====== */}
      {showIntro && (
        <div className="intro-overlay">
          <div className="intro-scanlines" />
          <div className="intro-players">
            {/* P1 왼쪽 */}
            <div className={`intro-player left ${p1Show ? 'show' : ''}`}>
              <div className="intro-sprite-wrap blue">
                <canvas
                  ref={introCanvasP1}
                  width={INTRO_SIZE}
                  height={INTRO_SIZE}
                  className="intro-sprite-canvas"
                />
              </div>
              {p1El && <div className="intro-element blue">{p1El.label}({p1El.hanja})</div>}
              <div className="intro-name blue">{challenger.nickname}</div>
              {challenger.dayMaster && <div className="intro-tag">{challenger.dayMaster}일간</div>}
            </div>

            <div className={`intro-spark ${vsShow ? 'show' : ''}`} />
            <div className={`intro-vs ${vsShow ? 'show' : ''}`}>VS</div>

            {/* P2 오른쪽 */}
            <div className={`intro-player right ${p2Show ? 'show' : ''}`}>
              <div className="intro-sprite-wrap red">
                <canvas
                  ref={introCanvasP2}
                  width={INTRO_SIZE}
                  height={INTRO_SIZE}
                  className="intro-sprite-canvas"
                />
              </div>
              {p2El && <div className="intro-element red">{p2El.label}({p2El.hanja})</div>}
              <div className="intro-name red">{opponent.nickname}</div>
              {opponent.dayMaster && <div className="intro-tag">{opponent.dayMaster}일간</div>}
            </div>
          </div>
          <div className={`intro-fight ${fightShow ? 'show' : ''}`}>FIGHT!</div>
        </div>
      )}

      {/* ====== 캔버스 ====== */}
      <canvas ref={canvasRef} className="battle-overlay-canvas" />

      {/* ====== HUD ====== */}
      <div className={`battle-overlay-hud ${isRunning || isKO ? 'on' : ''}`}>
        <div className="hud-health blue">
          <div className="hud-name blue">🐼 {challenger.nickname}</div>
          <div className="hud-bar">
            <div className={`hud-fill blue ${hp1Pct < 30 ? 'low' : ''}`} style={{ width: `${hp1Pct}%` }} />
            <div className="hud-shine" />
          </div>
          <div className="hud-text">{p1?.hp ?? 320}/{p1?.mhp ?? 320}</div>
        </div>
        <div className="hud-vs">VS</div>
        <div className="hud-health red">
          <div className="hud-name red">{opponent.nickname} 🐼</div>
          <div className="hud-bar">
            <div className={`hud-fill red ${hp2Pct < 30 ? 'low' : ''}`} style={{ width: `${hp2Pct}%` }} />
            <div className="hud-shine" />
          </div>
          <div className="hud-text" style={{ textAlign: 'right' }}>{p2?.hp ?? 320}/{p2?.mhp ?? 320}</div>
        </div>
      </div>

      {/* ====== 배틀 로그 ====== */}
      <div className="battle-overlay-log">
        {logs.map(log => (
          <div key={log.id} className="log-item">{log.message}</div>
        ))}
      </div>

      {/* ====== KO ====== */}
      <div className={`battle-overlay-ko ${isKO ? 'show' : ''}`}>
        <h1 className="ko-title">K.O.!</h1>
        {winner && (
          <p className={`ko-winner ${winner.isBlue ? 'blue' : 'red'}`}>🏆 {winner.nm} 승리!</p>
        )}
        {onScoreReveal && !scoresRevealed ? (
          <button className="ko-reveal" onClick={onScoreReveal}>📊 점수 확인</button>
        ) : (
          <button className="ko-restart" onClick={start}>⚔️ 다시 대결</button>
        )}
      </div>
    </>
  )
}
