import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FighterPosition,
  Surface,
  INITIAL_POSITIONS,
  ROUND_PATTERNS,
  getAttackPath,
  getSurfaceCoordinates,
  MovementPattern,
} from '../utils/arenaPositions'
import { AnimationState, CharacterType, EffectAnimationType } from '../components/platformer/AnimatedFighter'

export type BattlePhase = 'loading' | 'intro' | 'battle' | 'result'

export interface RoundData {
  id: string
  name: string
  icon: string
  winner: 'challenger' | 'opponent' | 'draw'
  challenger: { score: number; grade: string }
  opponent: { score: number; grade: string }
}

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

interface UseSmoothBattleProps {
  rounds: RoundData[]
  finalWinner: 'challenger' | 'opponent' | 'draw'
  challengerNickname: string
  opponentNickname: string
  onPhaseChange?: (phase: BattlePhase) => void
}

interface UseSmoothBattleReturn {
  phase: BattlePhase
  currentRound: number
  challenger: SmoothFighterState
  opponent: SmoothFighterState
  effects: ActiveSpriteEffect[]
  isShaking: boolean
  roundInfo: {
    current: number
    total: number
    name?: string
    icon?: string
  } | null
  skipToResult: () => void
}

// 애니메이션 시퀀스 타이밍 (ms)
const TIMING = {
  INTRO_DURATION: 2000,
  JUMP_START: 150,
  AIR_DURATION: 300,
  LAND_DURATION: 150,
  ATTACK_DURATION: 400,
  HIT_DURATION: 300,
  RETURN_JUMP: 150,
  RETURN_AIR: 300,
  RETURN_LAND: 150,
  ROUND_GAP: 500,
}

let effectIdCounter = 0
function createSpriteEffect(
  type: EffectAnimationType,
  character: CharacterType,
  x: number,
  y: number
): ActiveSpriteEffect {
  return {
    id: `effect-${++effectIdCounter}`,
    type,
    character,
    x,
    y,
  }
}

export function useSmoothBattle({
  rounds,
  finalWinner,
  challengerNickname,
  opponentNickname,
  onPhaseChange,
}: UseSmoothBattleProps): UseSmoothBattleReturn {
  const [phase, setPhase] = useState<BattlePhase>('intro')
  const [currentRound, setCurrentRound] = useState(-1)
  const [effects, setEffects] = useState<ActiveSpriteEffect[]>([])
  const [isShaking, setIsShaking] = useState(false)
  const sequenceRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // 캐릭터 상태
  const [challenger, setChallenger] = useState<SmoothFighterState>({
    character: 'blue',
    nickname: challengerNickname,
    animation: 'idle',
    position: INITIAL_POSITIONS.challenger,
    isMoving: false,
  })

  const [opponent, setOpponent] = useState<SmoothFighterState>({
    character: 'red',
    nickname: opponentNickname,
    animation: 'idle',
    position: INITIAL_POSITIONS.opponent,
    isMoving: false,
  })

  // 라운드 정보
  const roundInfo =
    phase === 'battle' && currentRound >= 0 && currentRound < rounds.length
      ? {
          current: currentRound + 1,
          total: rounds.length,
          ...(rounds[currentRound]?.name ? { name: rounds[currentRound].name } : {}),
          ...(rounds[currentRound]?.icon ? { icon: rounds[currentRound].icon } : {}),
        }
      : null

  // 타이머 정리
  const clearTimers = useCallback(() => {
    sequenceRef.current.forEach((timer) => clearTimeout(timer))
    sequenceRef.current = []
  }, [])

  // 타이머 추가 헬퍼
  const addTimer = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay)
    sequenceRef.current.push(timer)
    return timer
  }, [])

  // 페이즈 변경 콜백
  useEffect(() => {
    onPhaseChange?.(phase)
  }, [phase, onPhaseChange])

  // 인트로 → 배틀
  useEffect(() => {
    if (phase === 'intro') {
      const timer = setTimeout(() => {
        setPhase('battle')
        setCurrentRound(0)
      }, TIMING.INTRO_DURATION)
      return () => clearTimeout(timer)
    }
  }, [phase])

  // 라운드 진행 - 매끄러운 애니메이션 시퀀스
  useEffect(() => {
    if (phase !== 'battle' || currentRound < 0) return
    if (currentRound >= rounds.length) {
      setPhase('result')
      return
    }

    const round = rounds[currentRound]
    if (!round) return

    const attackerType = round.winner === 'draw' ? 'challenger' : round.winner
    const defenderType = attackerType === 'challenger' ? 'opponent' : 'challenger'
    const pattern = ROUND_PATTERNS[currentRound % ROUND_PATTERNS.length] ?? 'floor-to-ceiling'

    const setAttacker = attackerType === 'challenger' ? setChallenger : setOpponent
    const setDefender = defenderType === 'challenger' ? setChallenger : setOpponent
    const attackerState = attackerType === 'challenger' ? challenger : opponent
    const defenderState = defenderType === 'challenger' ? challenger : opponent

    // 공격 목표 위치
    const attackPosition = getAttackPath(pattern, attackerState.position, defenderState.position)

    let t = 0

    // 1. 점프 시작 + dust 이펙트
    addTimer(() => {
      setAttacker((prev) => ({ ...prev, animation: 'jump', isMoving: true }))
      const startCoords = getSurfaceCoordinates(attackerState.position.surface, attackerState.position.offset)
      setEffects([createSpriteEffect('dust', attackerState.character, startCoords.x, startCoords.y)])
    }, t)
    t += TIMING.JUMP_START

    // 2. 공중 상태 + 위치 이동
    addTimer(() => {
      setAttacker((prev) => ({
        ...prev,
        animation: 'air',
        position: attackPosition,
      }))
      setEffects([])
    }, t)
    t += TIMING.AIR_DURATION

    // 3. 착지 + 공격
    addTimer(() => {
      setAttacker((prev) => ({ ...prev, animation: 'attack', isMoving: false }))
      // 착지 dust
      const landCoords = getSurfaceCoordinates(attackPosition.surface, attackPosition.offset)
      setEffects([createSpriteEffect('dust', attackerState.character, landCoords.x, landCoords.y)])
    }, t)
    t += 100

    // 4. 피격
    addTimer(() => {
      setDefender((prev) => ({ ...prev, animation: 'hit' }))
      // 피격 이펙트
      const defenderCoords = getSurfaceCoordinates(defenderState.position.surface, defenderState.position.offset)
      setEffects([createSpriteEffect('impact', defenderState.character, defenderCoords.x, defenderCoords.y)])
      setIsShaking(true)
    }, t)
    t += TIMING.ATTACK_DURATION

    // 5. 화면 흔들림 종료
    addTimer(() => {
      setIsShaking(false)
      setEffects([])
    }, t)
    t += 100

    // 6. 복귀 점프
    addTimer(() => {
      setAttacker((prev) => ({ ...prev, animation: 'jump', isMoving: true }))
      setDefender((prev) => ({ ...prev, animation: 'idle' }))
    }, t)
    t += TIMING.RETURN_JUMP

    // 7. 복귀 이동
    addTimer(() => {
      const originalPos = attackerType === 'challenger'
        ? INITIAL_POSITIONS.challenger
        : INITIAL_POSITIONS.opponent
      setAttacker((prev) => ({
        ...prev,
        animation: 'air',
        position: originalPos,
      }))
    }, t)
    t += TIMING.RETURN_AIR

    // 8. 복귀 착지
    addTimer(() => {
      setAttacker((prev) => ({ ...prev, animation: 'land', isMoving: false }))
    }, t)
    t += TIMING.RETURN_LAND

    // 9. idle 복귀
    addTimer(() => {
      setAttacker((prev) => ({ ...prev, animation: 'idle' }))
    }, t)
    t += TIMING.ROUND_GAP

    // 10. 다음 라운드
    addTimer(() => {
      setCurrentRound((prev) => prev + 1)
    }, t)

    return () => clearTimers()
  }, [phase, currentRound, rounds, addTimer, clearTimers])

  // 결과 페이즈
  useEffect(() => {
    if (phase !== 'result') return

    if (finalWinner === 'challenger') {
      setChallenger((prev) => ({ ...prev, animation: 'victory' }))
      setOpponent((prev) => ({ ...prev, animation: 'death' }))
    } else if (finalWinner === 'opponent') {
      setChallenger((prev) => ({ ...prev, animation: 'death' }))
      setOpponent((prev) => ({ ...prev, animation: 'victory' }))
    } else {
      setChallenger((prev) => ({ ...prev, animation: 'idle' }))
      setOpponent((prev) => ({ ...prev, animation: 'idle' }))
    }
  }, [phase, finalWinner])

  // 스킵 기능
  const skipToResult = useCallback(() => {
    clearTimers()
    setCurrentRound(rounds.length)
    setPhase('result')
  }, [rounds.length, clearTimers])

  // cleanup
  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  return {
    phase,
    currentRound,
    challenger,
    opponent,
    effects,
    isShaking,
    roundInfo,
    skipToResult,
  }
}
