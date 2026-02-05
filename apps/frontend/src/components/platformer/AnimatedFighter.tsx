import { useEffect, useRef, useState, useMemo } from 'react'
import {
  FighterPosition,
  getSurfaceCoordinates,
  ARENA,
} from '../../utils/arenaPositions'
import './AnimatedFighter.css'

// 애니메이션 타입
export type AnimationState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'air'
  | 'fall'
  | 'land'
  | 'attack'
  | 'hit'
  | 'death'
  | 'victory'

// 캐릭터 타입
export type CharacterType = 'blue' | 'red'

// 스프라이트 설정 (128x128 프레임, 1536x1024 이미지)
// 64x64 타일 기준 2x2 = 128x128 실제 프레임
const FRAME_SIZE = 128
const SHEET_COLS = 12  // 1536 / 128 = 12
const SHEET_ROWS = 8   // 1024 / 128 = 8

// 애니메이션 프레임 정의 (row, startCol, frameCount, fps)
// 이미지 레이아웃 기반 매핑 (128x128 프레임 기준)
interface AnimationDef {
  row: number
  startCol: number
  frameCount: number
  fps: number
  loop: boolean
}

// Blue 슬라임 애니메이션 (128x128 프레임 기준)
// Row 0: IDLE 6개 + RUN 시작
// Row 1: RUN 계속 + Jump 관련
// Row 2: ATTACK
// Row 3: Hit + Death + Effects
const BLUE_ANIMATIONS: Record<AnimationState, AnimationDef> = {
  idle: { row: 0, startCol: 0, frameCount: 6, fps: 8, loop: true },
  run: { row: 0, startCol: 6, frameCount: 6, fps: 12, loop: true },
  jump: { row: 1, startCol: 0, frameCount: 1, fps: 8, loop: false },
  air: { row: 1, startCol: 1, frameCount: 2, fps: 8, loop: true },
  fall: { row: 1, startCol: 3, frameCount: 1, fps: 8, loop: false },
  land: { row: 1, startCol: 4, frameCount: 1, fps: 8, loop: false },
  attack: { row: 2, startCol: 0, frameCount: 6, fps: 15, loop: false },
  hit: { row: 3, startCol: 0, frameCount: 3, fps: 10, loop: false },
  death: { row: 3, startCol: 3, frameCount: 6, fps: 8, loop: false },
  victory: { row: 0, startCol: 0, frameCount: 6, fps: 6, loop: true },
}

// Red 전사 애니메이션 (128x128 프레임 기준)
const RED_ANIMATIONS: Record<AnimationState, AnimationDef> = {
  idle: { row: 0, startCol: 0, frameCount: 6, fps: 8, loop: true },
  run: { row: 0, startCol: 6, frameCount: 6, fps: 12, loop: true },
  jump: { row: 1, startCol: 0, frameCount: 1, fps: 8, loop: false },
  air: { row: 1, startCol: 1, frameCount: 2, fps: 8, loop: true },
  fall: { row: 1, startCol: 3, frameCount: 1, fps: 8, loop: false },
  land: { row: 1, startCol: 4, frameCount: 1, fps: 8, loop: false },
  attack: { row: 1, startCol: 6, frameCount: 6, fps: 15, loop: false },
  hit: { row: 2, startCol: 0, frameCount: 3, fps: 10, loop: false },
  death: { row: 2, startCol: 3, frameCount: 6, fps: 8, loop: false },
  victory: { row: 0, startCol: 0, frameCount: 6, fps: 6, loop: true },
}

const ANIMATIONS: Record<CharacterType, Record<AnimationState, AnimationDef>> = {
  blue: BLUE_ANIMATIONS,
  red: RED_ANIMATIONS,
}

interface AnimatedFighterProps {
  character: CharacterType
  animation: AnimationState
  position: FighterPosition
  facing: 'left' | 'right'
  nickname?: string
  onAnimationEnd?: () => void
  scale?: number
}

export default function AnimatedFighter({
  character,
  animation,
  position,
  facing,
  nickname,
  onAnimationEnd,
  scale = 1.5,
}: AnimatedFighterProps) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const animationRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const prevAnimationRef = useRef<AnimationState>(animation)

  const animDef = ANIMATIONS[character][animation]
  const spriteUrl = `/sprites/${character}-ck.png`

  // 위치 계산
  const coords = useMemo(
    () => getSurfaceCoordinates(position.surface, position.offset),
    [position.surface, position.offset]
  )

  // transform 계산
  const transform = useMemo(() => {
    const rotation = coords.rotation
    const scaleX = facing === 'left' ? -1 : 1
    const adjustedScaleX = position.surface === 'ceiling' ? -scaleX : scaleX
    return `rotate(${rotation}deg) scaleX(${adjustedScaleX}) scale(${scale})`
  }, [coords.rotation, facing, position.surface, scale])

  // 애니메이션 변경 시 프레임 리셋
  useEffect(() => {
    if (prevAnimationRef.current !== animation) {
      setCurrentFrame(0)
      prevAnimationRef.current = animation
    }
  }, [animation])

  // 프레임 애니메이션 루프
  useEffect(() => {
    const frameInterval = 1000 / animDef.fps

    const animate = (timestamp: number) => {
      if (timestamp - lastFrameTimeRef.current >= frameInterval) {
        lastFrameTimeRef.current = timestamp

        setCurrentFrame((prev) => {
          const nextFrame = prev + 1
          if (nextFrame >= animDef.frameCount) {
            if (animDef.loop) {
              return 0
            } else {
              onAnimationEnd?.()
              return prev // 마지막 프레임 유지
            }
          }
          return nextFrame
        })
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animDef, onAnimationEnd])

  // 스프라이트 배경 위치 계산
  const bgX = (animDef.startCol + currentFrame) * FRAME_SIZE
  const bgY = animDef.row * FRAME_SIZE

  const displaySize = FRAME_SIZE * scale

  return (
    <div
      className="animated-fighter"
      style={{
        left: coords.x - displaySize / 2,
        top: coords.y - displaySize / 2,
        width: displaySize,
        height: displaySize,
        transform,
      }}
    >
      <div
        className="fighter-sprite"
        style={{
          width: FRAME_SIZE,
          height: FRAME_SIZE,
          backgroundImage: `url(${spriteUrl})`,
          backgroundPosition: `-${bgX}px -${bgY}px`,
          backgroundSize: `${SHEET_COLS * FRAME_SIZE}px ${SHEET_ROWS * FRAME_SIZE}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
      {nickname && <span className="fighter-nickname">{nickname}</span>}
    </div>
  )
}

// 이펙트 컴포넌트 (Dust, Splash, Impact)
export type EffectAnimationType = 'dust' | 'splash' | 'impact'

interface FighterEffectProps {
  type: EffectAnimationType
  character: CharacterType
  x: number
  y: number
  onComplete?: () => void
}

// 이펙트 (128x128 프레임 기준, 이미지 하단 영역)
const EFFECT_ANIMATIONS: Record<EffectAnimationType, { row: number; startCol: number; frameCount: number; fps: number }> = {
  dust: { row: 4, startCol: 0, frameCount: 3, fps: 12 },
  splash: { row: 4, startCol: 3, frameCount: 4, fps: 12 },
  impact: { row: 4, startCol: 7, frameCount: 4, fps: 15 },
}

export function FighterEffect({ type, character, x, y, onComplete }: FighterEffectProps) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [visible, setVisible] = useState(true)
  const animationRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)

  const effectDef = EFFECT_ANIMATIONS[type]
  const spriteUrl = `/sprites/${character}-ck.png`

  useEffect(() => {
    const frameInterval = 1000 / effectDef.fps

    const animate = (timestamp: number) => {
      if (timestamp - lastFrameTimeRef.current >= frameInterval) {
        lastFrameTimeRef.current = timestamp

        setCurrentFrame((prev) => {
          const nextFrame = prev + 1
          if (nextFrame >= effectDef.frameCount) {
            setVisible(false)
            onComplete?.()
            return prev
          }
          return nextFrame
        })
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [effectDef, onComplete])

  if (!visible) return null

  const bgX = (effectDef.startCol + currentFrame) * FRAME_SIZE
  const bgY = effectDef.row * FRAME_SIZE

  return (
    <div
      className="fighter-effect"
      style={{
        left: x - FRAME_SIZE / 2,
        top: y - FRAME_SIZE / 2,
        width: FRAME_SIZE,
        height: FRAME_SIZE,
      }}
    >
      <div
        className="effect-sprite"
        style={{
          width: FRAME_SIZE,
          height: FRAME_SIZE,
          backgroundImage: `url(${spriteUrl})`,
          backgroundPosition: `-${bgX}px -${bgY}px`,
          backgroundSize: `${SHEET_COLS * FRAME_SIZE}px ${SHEET_ROWS * FRAME_SIZE}px`,
          transform: 'scale(1.5)',
          transformOrigin: 'center',
        }}
      />
    </div>
  )
}
