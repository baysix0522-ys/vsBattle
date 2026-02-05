import { useMemo } from 'react'
import PlatformerFighter, { FighterAction } from './PlatformerFighter'
import BattleEffects, { EffectType } from './BattleEffects'
import {
  FighterPosition,
  ARENA,
  getFacingDirection,
  getSurfaceCoordinates,
} from '../../utils/arenaPositions'
import './PlatformerArena.css'

export interface FighterState {
  color: 'silver' | 'red'
  nickname: string
  action: FighterAction
  position: FighterPosition
  animationKey: number
}

export interface ActiveEffect {
  id: string
  type: EffectType
  x: number
  y: number
}

interface PlatformerArenaProps {
  challenger: FighterState
  opponent: FighterState
  effects?: ActiveEffect[]
  isShaking?: boolean
  roundInfo?: {
    current: number
    total: number
    name?: string
    icon?: string
  }
}

export default function PlatformerArena({
  challenger,
  opponent,
  effects = [],
  isShaking = false,
  roundInfo,
}: PlatformerArenaProps) {
  // 각 캐릭터가 상대방을 바라보는 방향
  const challengerFacing = useMemo(
    () => getFacingDirection(challenger.position, opponent.position),
    [challenger.position, opponent.position]
  )

  const opponentFacing = useMemo(
    () => getFacingDirection(opponent.position, challenger.position),
    [opponent.position, challenger.position]
  )

  return (
    <div className={`platformer-arena ${isShaking ? 'shaking' : ''}`}>
      {/* 배경 레이어 */}
      <div className="arena-background">
        <div className="arena-floor-glow" />
        <div className="arena-ceiling-glow" />
        <div className="arena-left-glow" />
        <div className="arena-right-glow" />
        <div className="arena-center-light" />
      </div>

      {/* 라운드 표시 */}
      {roundInfo && (
        <div className="arena-round-indicator">
          <span className="round-icon">{roundInfo.icon}</span>
          <span className="round-text">
            Round {roundInfo.current}/{roundInfo.total}
          </span>
          {roundInfo.name && (
            <span className="round-name">{roundInfo.name}</span>
          )}
        </div>
      )}

      {/* 캐릭터들 */}
      <PlatformerFighter
        color={challenger.color}
        action={challenger.action}
        position={challenger.position}
        facing={challengerFacing}
        nickname={challenger.nickname}
        animationKey={challenger.animationKey}
      />

      <PlatformerFighter
        color={opponent.color}
        action={opponent.action}
        position={opponent.position}
        facing={opponentFacing}
        nickname={opponent.nickname}
        animationKey={opponent.animationKey}
      />

      {/* 이펙트 레이어 */}
      <BattleEffects effects={effects} />

      {/* VS 표시 (중앙) */}
      <div className="arena-vs">VS</div>
    </div>
  )
}

// 유틸: 충격 이펙트 위치 계산
export function getImpactPosition(
  targetPosition: FighterPosition
): { x: number; y: number } {
  const coords = getSurfaceCoordinates(
    targetPosition.surface,
    targetPosition.offset
  )
  return { x: coords.x, y: coords.y }
}
