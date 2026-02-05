import { useState, useEffect, useCallback, useRef } from 'react'
import {
  FighterPosition,
  INITIAL_POSITIONS,
  ROUND_PATTERNS,
  getAttackPath,
  getSurfaceCoordinates,
} from '../utils/arenaPositions'
import { FighterState, ActiveEffect } from '../components/platformer'
import { createEffect } from '../components/platformer/BattleEffects'

export type BattlePhase = 'loading' | 'intro' | 'battle' | 'result'

export interface RoundData {
  id: string
  name: string
  icon: string
  winner: 'challenger' | 'opponent' | 'draw'
  challenger: { score: number; grade: string }
  opponent: { score: number; grade: string }
}

interface UsePlatformerBattleProps {
  rounds: RoundData[]
  finalWinner: 'challenger' | 'opponent' | 'draw'
  challengerNickname: string
  opponentNickname: string
  onPhaseChange?: (phase: BattlePhase) => void
}

interface UsePlatformerBattleReturn {
  phase: BattlePhase
  currentRound: number
  challenger: FighterState
  opponent: FighterState
  effects: ActiveEffect[]
  isShaking: boolean
  roundInfo: {
    current: number
    total: number
    name?: string
    icon?: string
  } | null
  skipToResult: () => void
}

export function usePlatformerBattle({
  rounds,
  finalWinner,
  challengerNickname,
  opponentNickname,
  onPhaseChange,
}: UsePlatformerBattleProps): UsePlatformerBattleReturn {
  const [phase, setPhase] = useState<BattlePhase>('intro')
  const [currentRound, setCurrentRound] = useState(-1)
  const [effects, setEffects] = useState<ActiveEffect[]>([])
  const [isShaking, setIsShaking] = useState(false)
  const animationKeyRef = useRef(0)

  // 캐릭터 상태
  const [challenger, setChallenger] = useState<FighterState>({
    color: 'silver',
    nickname: challengerNickname,
    action: 'idle',
    position: INITIAL_POSITIONS.challenger,
    animationKey: 0,
  })

  const [opponent, setOpponent] = useState<FighterState>({
    color: 'red',
    nickname: opponentNickname,
    action: 'idle',
    position: INITIAL_POSITIONS.opponent,
    animationKey: 0,
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
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [phase])

  // 라운드 진행
  useEffect(() => {
    if (phase !== 'battle' || currentRound < 0) return
    if (currentRound >= rounds.length) {
      // 모든 라운드 완료 → 결과
      setPhase('result')
      return
    }

    const round = rounds[currentRound]
    if (!round) return

    const attacker = round.winner === 'draw' ? 'challenger' : round.winner
    const defender = attacker === 'challenger' ? 'opponent' : 'challenger'
    const pattern = ROUND_PATTERNS[currentRound % ROUND_PATTERNS.length] ?? 'floor-to-ceiling'

    // 공격자/피격자 상태 업데이트 함수
    const setAttacker =
      attacker === 'challenger' ? setChallenger : setOpponent
    const setDefender =
      defender === 'challenger' ? setChallenger : setOpponent
    const attackerPos =
      attacker === 'challenger'
        ? challenger.position
        : opponent.position
    const defenderPos =
      defender === 'challenger'
        ? challenger.position
        : opponent.position

    // 공격 경로 계산
    const attackPosition = getAttackPath(pattern, attackerPos, defenderPos)

    // 1. 공격자 이동 (0.6s)
    animationKeyRef.current++
    setAttacker((prev) => ({
      ...prev,
      position: attackPosition,
      action: 'idle',
      animationKey: animationKeyRef.current,
    }))

    // 2. 공격 실행 (0.6s 후)
    const attackTimer = setTimeout(() => {
      setAttacker((prev) => ({ ...prev, action: 'attack' }))
      setDefender((prev) => ({ ...prev, action: 'hit' }))

      // 충격 이펙트
      const impactCoords = getSurfaceCoordinates(
        defenderPos.surface,
        defenderPos.offset
      )
      setEffects([createEffect('impact', impactCoords.x, impactCoords.y)])
      setIsShaking(true)

      setTimeout(() => {
        setIsShaking(false)
        setEffects([])
      }, 400)
    }, 600)

    // 3. 복귀 (1.2s 후)
    const returnTimer = setTimeout(() => {
      setAttacker((prev) => ({
        ...prev,
        position:
          attacker === 'challenger'
            ? INITIAL_POSITIONS.challenger
            : INITIAL_POSITIONS.opponent,
        action: 'idle',
        animationKey: ++animationKeyRef.current,
      }))
      setDefender((prev) => ({ ...prev, action: 'idle' }))
    }, 1200)

    // 4. 다음 라운드 (2s 후)
    const nextRoundTimer = setTimeout(() => {
      setCurrentRound((prev) => prev + 1)
    }, 2000)

    return () => {
      clearTimeout(attackTimer)
      clearTimeout(returnTimer)
      clearTimeout(nextRoundTimer)
    }
  }, [phase, currentRound, rounds])

  // 결과 페이즈
  useEffect(() => {
    if (phase !== 'result') return

    // 최종 승자/패자 애니메이션
    if (finalWinner === 'challenger') {
      setChallenger((prev) => ({ ...prev, action: 'victory' }))
      setOpponent((prev) => ({ ...prev, action: 'defeat' }))
    } else if (finalWinner === 'opponent') {
      setChallenger((prev) => ({ ...prev, action: 'defeat' }))
      setOpponent((prev) => ({ ...prev, action: 'victory' }))
    } else {
      // 무승부
      setChallenger((prev) => ({ ...prev, action: 'idle' }))
      setOpponent((prev) => ({ ...prev, action: 'idle' }))
    }
  }, [phase, finalWinner])

  // 스킵 기능
  const skipToResult = useCallback(() => {
    setCurrentRound(rounds.length)
    setPhase('result')
  }, [rounds.length])

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
