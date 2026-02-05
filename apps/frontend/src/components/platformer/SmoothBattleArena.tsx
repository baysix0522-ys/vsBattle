import { useMemo } from 'react'
import AnimatedFighter, { FighterEffect, AnimationState, CharacterType, EffectAnimationType } from './AnimatedFighter'
import { FighterPosition, getFacingDirection } from '../../utils/arenaPositions'
import './PlatformerArena.css'
import './SmoothBattleArena.css'

export interface SmoothFighterState {
  character: CharacterType
  nickname: string
  animation: AnimationState
  position: FighterPosition
  isMoving: boolean
}

export interface ActiveSpriteEffect {
  id: string
  type: EffectAnimationType
  character: CharacterType
  x: number
  y: number
}

interface SmoothBattleArenaProps {
  challenger: SmoothFighterState
  opponent: SmoothFighterState
  effects?: ActiveSpriteEffect[]
  isShaking?: boolean
  roundInfo?: {
    current: number
    total: number
    name?: string
    icon?: string
  }
}

export default function SmoothBattleArena({
  challenger,
  opponent,
  effects = [],
  isShaking = false,
  roundInfo,
}: SmoothBattleArenaProps) {
  // 각 캐릭터가 상대방을 바라보는 방향
  const challengerFacing = useMemo(
    () => getFacingDirection(challenger.position, opponent.position),
    [challenger.position, opponent.position]
  )

  const opponentFacing = useMemo(
    () => getFacingDirection(opponent.position, challenger.position),
    [opponent.position, challenger.position]
  )

  // 애니메이션 상태에 따른 CSS 클래스
  const getCssClass = (animation: AnimationState) => {
    switch (animation) {
      case 'attack':
        return 'attacking'
      case 'hit':
        return 'hit'
      case 'victory':
        return 'victory'
      case 'death':
        return 'death'
      default:
        return ''
    }
  }

  return (
    <div className={`platformer-arena smooth-arena ${isShaking ? 'shaking' : ''}`}>
      {/* 배경 레이어 */}
      <div className="arena-background">
        <div className="arena-floor-glow" />
        <div className="arena-ceiling-glow" />
        <div className="arena-left-glow" />
        <div className="arena-right-glow" />
        <div className="arena-center-light" />
        {/* 격자 가이드 (디버그용, 필요시 주석 해제) */}
        {/* <div className="arena-grid" /> */}
      </div>

      {/* 라운드 표시 */}
      {roundInfo && (
        <div className="arena-round-indicator">
          <span className="round-icon">{roundInfo.icon}</span>
          <span className="round-text">
            Round {roundInfo.current}/{roundInfo.total}
          </span>
          {roundInfo.name && <span className="round-name">{roundInfo.name}</span>}
        </div>
      )}

      {/* 캐릭터들 */}
      <div className={`fighter-wrapper ${getCssClass(challenger.animation)} ${challenger.isMoving ? 'moving' : ''}`}>
        <AnimatedFighter
          character={challenger.character}
          animation={challenger.animation}
          position={challenger.position}
          facing={challengerFacing}
          nickname={challenger.nickname}
          scale={0.9}
        />
      </div>

      <div className={`fighter-wrapper ${getCssClass(opponent.animation)} ${opponent.isMoving ? 'moving' : ''}`}>
        <AnimatedFighter
          character={opponent.character}
          animation={opponent.animation}
          position={opponent.position}
          facing={opponentFacing}
          nickname={opponent.nickname}
          scale={0.9}
        />
      </div>

      {/* 스프라이트 기반 이펙트 */}
      {effects.map((effect) => (
        <FighterEffect
          key={effect.id}
          type={effect.type}
          character={effect.character}
          x={effect.x}
          y={effect.y}
        />
      ))}

      {/* VS 표시 (중앙) */}
      <div className="arena-vs">VS</div>
    </div>
  )
}
