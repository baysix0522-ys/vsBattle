import { useRef, useEffect, useCallback, useState } from 'react'
import {
  drawCharacter,
  drawArenaBackground,
  drawEffect,
  drawNickname,
  preloadSprites,
  type CharacterColor,
  type CharacterAction,
} from '../../utils/canvasCharacter'

export interface CanvasFighterState {
  color: CharacterColor
  nickname: string
  action: CharacterAction
  x: number
  y: number
  targetX: number
  targetY: number
  facing: 'left' | 'right'
}

interface ActiveEffect {
  id: string
  type: 'impact' | 'dust' | 'spark'
  x: number
  y: number
  startFrame: number
}

interface CanvasBattleArenaProps {
  challenger: CanvasFighterState
  opponent: CanvasFighterState
  effects: ActiveEffect[]
  isShaking: boolean
  roundInfo?: {
    current: number
    total: number
    name?: string
    icon?: string
  }
  onSkip?: () => void
  showSkipButton?: boolean
}

const ARENA_WIDTH = 480
const ARENA_HEIGHT = 600
const LERP_SPEED = 0.12 // 위치 보간 속도

export default function CanvasBattleArena({
  challenger,
  opponent,
  effects,
  isShaking,
  roundInfo,
  onSkip,
  showSkipButton = true,
}: CanvasBattleArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const animationRef = useRef<number | null>(null)
  const shakeRef = useRef({ x: 0, y: 0 })

  // 부드러운 위치 보간을 위한 현재 위치
  const [smoothPositions, setSmoothPositions] = useState({
    challenger: { x: challenger.x, y: challenger.y },
    opponent: { x: opponent.x, y: opponent.y },
  })

  // 스프라이트 미리 로드
  useEffect(() => {
    preloadSprites()
  }, [])

  // 위치 보간
  const lerp = useCallback((start: number, end: number, t: number) => {
    return start + (end - start) * t
  }, [])

  // 렌더링 루프
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      frameRef.current++
      const frame = frameRef.current

      // 위치 보간 업데이트
      setSmoothPositions((prev) => ({
        challenger: {
          x: lerp(prev.challenger.x, challenger.targetX, LERP_SPEED),
          y: lerp(prev.challenger.y, challenger.targetY, LERP_SPEED),
        },
        opponent: {
          x: lerp(prev.opponent.x, opponent.targetX, LERP_SPEED),
          y: lerp(prev.opponent.y, opponent.targetY, LERP_SPEED),
        },
      }))

      // 화면 흔들림
      if (isShaking) {
        shakeRef.current = {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10,
        }
      } else {
        shakeRef.current = { x: 0, y: 0 }
      }

      // 캔버스 클리어
      ctx.save()
      ctx.translate(shakeRef.current.x, shakeRef.current.y)

      // 배경
      drawArenaBackground(ctx, ARENA_WIDTH, ARENA_HEIGHT, frame)

      // 이펙트 (캐릭터 뒤)
      effects.forEach((effect) => {
        const effectFrame = frame - effect.startFrame
        if (effectFrame >= 0 && effectFrame < 15) {
          drawEffect(ctx, effect.type, effect.x, effect.y, effectFrame)
        }
      })

      // 캐릭터들
      drawCharacter(ctx, {
        x: smoothPositions.challenger.x,
        y: smoothPositions.challenger.y,
        color: challenger.color,
        action: challenger.action,
        facing: challenger.facing,
        frame,
      })

      drawCharacter(ctx, {
        x: smoothPositions.opponent.x,
        y: smoothPositions.opponent.y,
        color: opponent.color,
        action: opponent.action,
        facing: opponent.facing,
        frame,
      })

      // 닉네임
      drawNickname(
        ctx,
        smoothPositions.challenger.x,
        smoothPositions.challenger.y + 50,
        challenger.nickname,
        challenger.color
      )

      drawNickname(
        ctx,
        smoothPositions.opponent.x,
        smoothPositions.opponent.y + 50,
        opponent.nickname,
        opponent.color
      )

      // 라운드 정보
      if (roundInfo) {
        ctx.save()
        ctx.font = 'bold 16px "Noto Sans KR", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // 배경
        const text = `Round ${roundInfo.current}/${roundInfo.total}`
        const metrics = ctx.measureText(text)
        const bgWidth = metrics.width + 60
        const bgHeight = 36

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.beginPath()
        ctx.roundRect(ARENA_WIDTH / 2 - bgWidth / 2, 15, bgWidth, bgHeight, 18)
        ctx.fill()

        // 아이콘
        if (roundInfo.icon) {
          ctx.font = '20px sans-serif'
          ctx.fillText(roundInfo.icon, ARENA_WIDTH / 2 - metrics.width / 2 - 15, 33)
        }

        // 텍스트
        ctx.font = 'bold 14px "Noto Sans KR", sans-serif'
        ctx.fillStyle = '#FFFFFF'
        ctx.fillText(text, ARENA_WIDTH / 2 + 10, 33)

        if (roundInfo.name) {
          ctx.font = '12px "Noto Sans KR", sans-serif'
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
          ctx.fillText(roundInfo.name, ARENA_WIDTH / 2 + 10, 47)
        }

        ctx.restore()
      }

      // VS 표시
      ctx.save()
      ctx.font = 'bold 48px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.shadowColor = 'rgba(255, 100, 50, 0.3)'
      ctx.shadowBlur = 30
      ctx.fillText('VS', ARENA_WIDTH / 2, ARENA_HEIGHT / 2)
      ctx.restore()

      ctx.restore()

      animationRef.current = requestAnimationFrame(render)
    }

    animationRef.current = requestAnimationFrame(render)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [
    challenger,
    opponent,
    effects,
    isShaking,
    roundInfo,
    smoothPositions,
    lerp,
  ])

  return (
    <div className="canvas-battle-arena" style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={ARENA_WIDTH}
        height={ARENA_HEIGHT}
        style={{
          width: '100%',
          maxWidth: ARENA_WIDTH,
          height: 'auto',
          display: 'block',
          margin: '0 auto',
          borderRadius: 12,
        }}
      />
      {showSkipButton && onSkip && (
        <button
          onClick={onSkip}
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            padding: '8px 16px',
            background: 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          스킵 →
        </button>
      )}
    </div>
  )
}
