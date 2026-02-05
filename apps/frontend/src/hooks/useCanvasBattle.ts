import { useState, useEffect, useCallback, useRef } from 'react'
import type { CharacterColor, CharacterAction } from '../utils/canvasCharacter'

export type BattlePhase = 'loading' | 'intro' | 'battle' | 'result'

export interface RoundData {
  id: string
  name: string
  icon: string
  winner: 'challenger' | 'opponent' | 'draw'
  challenger: { score: number; grade: string }
  opponent: { score: number; grade: string }
}

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

export interface ActiveEffect {
  id: string
  type: 'impact' | 'dust' | 'spark'
  x: number
  y: number
  startFrame: number
}

interface UseCanvasBattleProps {
  rounds: RoundData[]
  finalWinner: 'challenger' | 'opponent' | 'draw'
  challengerNickname: string
  opponentNickname: string
  onPhaseChange?: (phase: BattlePhase) => void
}

interface UseCanvasBattleReturn {
  phase: BattlePhase
  currentRound: number
  challenger: CanvasFighterState
  opponent: CanvasFighterState
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

// 아레나 크기
const ARENA_WIDTH = 480
const ARENA_HEIGHT = 600

// 초기 위치
const INITIAL_POSITIONS = {
  challenger: { x: 120, y: ARENA_HEIGHT - 120 },
  opponent: { x: ARENA_WIDTH - 120, y: ARENA_HEIGHT - 120 },
}

// 전투 위치 패턴
const BATTLE_POSITIONS = [
  // 라운드 1: 중앙 돌진
  { attacker: { x: ARENA_WIDTH / 2 - 50, y: ARENA_HEIGHT - 120 }, defender: { x: ARENA_WIDTH / 2 + 50, y: ARENA_HEIGHT - 120 } },
  // 라운드 2: 상단 점프
  { attacker: { x: ARENA_WIDTH / 2, y: 200 }, defender: { x: ARENA_WIDTH / 2 + 80, y: 200 } },
  // 라운드 3: 좌측 벽
  { attacker: { x: 100, y: ARENA_HEIGHT / 2 }, defender: { x: 180, y: ARENA_HEIGHT / 2 } },
  // 라운드 4: 우측 상단
  { attacker: { x: ARENA_WIDTH - 150, y: 180 }, defender: { x: ARENA_WIDTH - 80, y: 180 } },
  // 라운드 5: 중앙 하단
  { attacker: { x: ARENA_WIDTH / 2 + 50, y: ARENA_HEIGHT - 100 }, defender: { x: ARENA_WIDTH / 2 - 50, y: ARENA_HEIGHT - 100 } },
  // 라운드 6: 중앙 공중전
  { attacker: { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2 - 50 }, defender: { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2 + 50 } },
]

// 타이밍 (ms)
const TIMING = {
  INTRO_DURATION: 2000,
  MOVE_TO_BATTLE: 600,
  ATTACK_DURATION: 400,
  HIT_DURATION: 300,
  RETURN_DURATION: 600,
  ROUND_GAP: 500,
}

let effectIdCounter = 0
let frameCounter = 0

export function useCanvasBattle({
  rounds,
  finalWinner,
  challengerNickname,
  opponentNickname,
  onPhaseChange,
}: UseCanvasBattleProps): UseCanvasBattleReturn {
  const [phase, setPhase] = useState<BattlePhase>('intro')
  const [currentRound, setCurrentRound] = useState(-1)
  const [effects, setEffects] = useState<ActiveEffect[]>([])
  const [isShaking, setIsShaking] = useState(false)
  const sequenceRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // 캐릭터 상태
  const [challenger, setChallenger] = useState<CanvasFighterState>({
    color: 'blue',
    nickname: challengerNickname,
    action: 'idle',
    x: INITIAL_POSITIONS.challenger.x,
    y: INITIAL_POSITIONS.challenger.y,
    targetX: INITIAL_POSITIONS.challenger.x,
    targetY: INITIAL_POSITIONS.challenger.y,
    facing: 'right',
  })

  const [opponent, setOpponent] = useState<CanvasFighterState>({
    color: 'red',
    nickname: opponentNickname,
    action: 'idle',
    x: INITIAL_POSITIONS.opponent.x,
    y: INITIAL_POSITIONS.opponent.y,
    targetX: INITIAL_POSITIONS.opponent.x,
    targetY: INITIAL_POSITIONS.opponent.y,
    facing: 'left',
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

  // 타이머 추가
  const addTimer = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(callback, delay)
    sequenceRef.current.push(timer)
    return timer
  }, [])

  // 이펙트 추가
  const addEffect = useCallback((type: 'impact' | 'dust' | 'spark', x: number, y: number) => {
    frameCounter++
    const effect: ActiveEffect = {
      id: `effect-${++effectIdCounter}`,
      type,
      x,
      y,
      startFrame: frameCounter,
    }
    setEffects((prev) => [...prev, effect])

    // 자동 제거
    setTimeout(() => {
      setEffects((prev) => prev.filter((e) => e.id !== effect.id))
    }, 500)
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

  // 라운드 진행
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

    const setAttacker = attackerType === 'challenger' ? setChallenger : setOpponent
    const setDefender = defenderType === 'challenger' ? setChallenger : setOpponent

    const patternIndex = currentRound % BATTLE_POSITIONS.length
    const pattern = BATTLE_POSITIONS[patternIndex]
    if (!pattern) return

    let t = 0

    // 1. 점프 시작 + 이동
    addTimer(() => {
      setAttacker((prev) => ({
        ...prev,
        action: 'jump',
        targetX: pattern.attacker.x,
        targetY: pattern.attacker.y,
        facing: attackerType === 'challenger' ? 'right' : 'left',
      }))
      addEffect('dust', attackerType === 'challenger' ? INITIAL_POSITIONS.challenger.x : INITIAL_POSITIONS.opponent.x, attackerType === 'challenger' ? INITIAL_POSITIONS.challenger.y + 30 : INITIAL_POSITIONS.opponent.y + 30)
    }, t)
    t += 200

    // 달리기 상태
    addTimer(() => {
      setAttacker((prev) => ({ ...prev, action: 'run' }))
    }, t)
    t += TIMING.MOVE_TO_BATTLE - 200

    // 2. 공격
    addTimer(() => {
      setAttacker((prev) => ({ ...prev, action: 'attack' }))
      addEffect('dust', pattern.attacker.x, pattern.attacker.y + 30)
    }, t)
    t += 150

    // 3. 피격
    addTimer(() => {
      setDefender((prev) => ({ ...prev, action: 'hit' }))
      addEffect('impact', pattern.defender.x, pattern.defender.y)
      setIsShaking(true)
    }, t)
    t += TIMING.ATTACK_DURATION

    // 4. 흔들림 종료
    addTimer(() => {
      setIsShaking(false)
      addEffect('spark', pattern.defender.x, pattern.defender.y)
    }, t)
    t += 200

    // 5. 복귀 준비
    addTimer(() => {
      setAttacker((prev) => ({ ...prev, action: 'jump' }))
      setDefender((prev) => ({ ...prev, action: 'idle' }))
    }, t)
    t += 100

    // 6. 복귀 이동
    addTimer(() => {
      setAttacker((prev) => ({
        ...prev,
        action: 'run',
        targetX: attackerType === 'challenger' ? INITIAL_POSITIONS.challenger.x : INITIAL_POSITIONS.opponent.x,
        targetY: attackerType === 'challenger' ? INITIAL_POSITIONS.challenger.y : INITIAL_POSITIONS.opponent.y,
      }))
    }, t)
    t += TIMING.RETURN_DURATION

    // 7. idle 복귀
    addTimer(() => {
      setAttacker((prev) => ({ ...prev, action: 'idle' }))
    }, t)
    t += TIMING.ROUND_GAP

    // 8. 다음 라운드
    addTimer(() => {
      setCurrentRound((prev) => prev + 1)
    }, t)

    return () => clearTimers()
  }, [phase, currentRound, rounds, addTimer, clearTimers, addEffect])

  // 결과 페이즈
  useEffect(() => {
    if (phase !== 'result') return

    if (finalWinner === 'challenger') {
      setChallenger((prev) => ({ ...prev, action: 'victory' }))
      setOpponent((prev) => ({ ...prev, action: 'defeat' }))
    } else if (finalWinner === 'opponent') {
      setChallenger((prev) => ({ ...prev, action: 'defeat' }))
      setOpponent((prev) => ({ ...prev, action: 'victory' }))
    } else {
      setChallenger((prev) => ({ ...prev, action: 'idle' }))
      setOpponent((prev) => ({ ...prev, action: 'idle' }))
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
