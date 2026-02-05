import { useMemo } from 'react'
import PixelFighter from '../PixelFighter'
import {
  FighterPosition,
  getSurfaceCoordinates,
  ARENA,
} from '../../utils/arenaPositions'
import './PlatformerFighter.css'

export type FighterAction =
  | 'idle'
  | 'attack'
  | 'hit'
  | 'victory'
  | 'ultimate'
  | 'defeat'

interface PlatformerFighterProps {
  color: 'silver' | 'red'
  action: FighterAction
  position: FighterPosition
  facing: 'left' | 'right'
  nickname?: string
  isAnimating?: boolean
  animationKey?: string | number
}

export default function PlatformerFighter({
  color,
  action,
  position,
  facing,
  nickname,
  isAnimating = false,
  animationKey,
}: PlatformerFighterProps) {
  const coords = useMemo(
    () => getSurfaceCoordinates(position.surface, position.offset),
    [position.surface, position.offset]
  )

  // 표면별 회전 + 바라보는 방향에 따른 scaleX
  const transform = useMemo(() => {
    const rotation = coords.rotation
    // 기본적으로 캐릭터는 오른쪽을 봄
    // facing이 left면 좌우 반전
    const scaleX = facing === 'left' ? -1 : 1

    // 천장에 있을 때는 회전이 180도이므로 scaleX를 반전
    const adjustedScaleX =
      position.surface === 'ceiling' ? -scaleX : scaleX

    return `rotate(${rotation}deg) scaleX(${adjustedScaleX})`
  }, [coords.rotation, facing, position.surface])

  const pixelFighterProps = {
    color,
    action,
    ...(nickname ? { nickname } : {}),
  }

  return (
    <div
      key={animationKey}
      className={`platformer-fighter ${isAnimating ? 'animating' : ''}`}
      style={{
        left: coords.x - ARENA.CHARACTER_SIZE / 2,
        top: coords.y - ARENA.CHARACTER_SIZE / 2,
        transform,
      }}
    >
      <PixelFighter {...pixelFighterProps} />
    </div>
  )
}
