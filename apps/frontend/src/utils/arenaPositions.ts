// 플랫포머 전투장 위치 계산 유틸리티

export type Surface = 'floor' | 'ceiling' | 'left-wall' | 'right-wall'

export interface FighterPosition {
  surface: Surface
  offset: number // 0~1: 해당 표면에서의 위치 비율
}

export interface SurfaceCoordinates {
  x: number
  y: number
  rotation: number
}

// 아레나 크기 상수
export const ARENA = {
  WIDTH: 480,
  HEIGHT: 600,
  MARGIN: 48, // 표면에서 캐릭터까지의 여백
  CHARACTER_SIZE: 96, // 캐릭터 크기 (64 * 1.5)
} as const

// 표면별 회전 각도
export const SURFACE_ROTATION: Record<Surface, number> = {
  floor: 0,
  ceiling: 180,
  'left-wall': 90,
  'right-wall': -90,
}

/**
 * 표면과 위치 비율로 실제 좌표 계산
 */
export function getSurfaceCoordinates(
  surface: Surface,
  offset: number
): SurfaceCoordinates {
  const { WIDTH, HEIGHT, MARGIN, CHARACTER_SIZE } = ARENA
  const halfChar = CHARACTER_SIZE / 2

  switch (surface) {
    case 'floor': {
      // 바닥: y는 아래쪽 고정, x는 offset에 따라 이동
      const usableWidth = WIDTH - MARGIN * 2 - CHARACTER_SIZE
      return {
        x: MARGIN + offset * usableWidth + halfChar,
        y: HEIGHT - MARGIN - halfChar,
        rotation: 0,
      }
    }
    case 'ceiling': {
      // 천장: y는 위쪽 고정, x는 offset에 따라 이동, 180도 회전
      const usableWidth = WIDTH - MARGIN * 2 - CHARACTER_SIZE
      return {
        x: MARGIN + offset * usableWidth + halfChar,
        y: MARGIN + halfChar,
        rotation: 180,
      }
    }
    case 'left-wall': {
      // 좌측벽: x는 왼쪽 고정, y는 offset에 따라 이동, 90도 회전
      const usableHeight = HEIGHT - MARGIN * 2 - CHARACTER_SIZE
      return {
        x: MARGIN + halfChar,
        y: MARGIN + offset * usableHeight + halfChar,
        rotation: 90,
      }
    }
    case 'right-wall': {
      // 우측벽: x는 오른쪽 고정, y는 offset에 따라 이동, -90도 회전
      const usableHeight = HEIGHT - MARGIN * 2 - CHARACTER_SIZE
      return {
        x: WIDTH - MARGIN - halfChar,
        y: MARGIN + offset * usableHeight + halfChar,
        rotation: -90,
      }
    }
  }
}

/**
 * 두 위치 사이의 거리 계산
 */
export function getDistance(pos1: FighterPosition, pos2: FighterPosition): number {
  const coords1 = getSurfaceCoordinates(pos1.surface, pos1.offset)
  const coords2 = getSurfaceCoordinates(pos2.surface, pos2.offset)
  return Math.sqrt(
    Math.pow(coords2.x - coords1.x, 2) + Math.pow(coords2.y - coords1.y, 2)
  )
}

/**
 * 상대방을 바라보는 방향 계산
 */
export function getFacingDirection(
  myPos: FighterPosition,
  opponentPos: FighterPosition
): 'left' | 'right' {
  const myCoords = getSurfaceCoordinates(myPos.surface, myPos.offset)
  const oppCoords = getSurfaceCoordinates(opponentPos.surface, opponentPos.offset)
  return oppCoords.x > myCoords.x ? 'right' : 'left'
}

// 라운드별 이동 패턴
export type MovementPattern =
  | 'floor-to-ceiling'
  | 'ceiling-to-floor'
  | 'wall-to-wall'
  | 'floor-to-wall'
  | 'diagonal'

export const ROUND_PATTERNS: MovementPattern[] = [
  'floor-to-ceiling', // Round 1
  'wall-to-wall', // Round 2
  'diagonal', // Round 3
  'ceiling-to-floor', // Round 4
  'floor-to-wall', // Round 5
  'diagonal', // Round 6
]

/**
 * 공격자의 이동 경로 계산
 */
export function getAttackPath(
  pattern: MovementPattern,
  attackerStart: FighterPosition,
  _targetPos: FighterPosition
): FighterPosition {
  switch (pattern) {
    case 'floor-to-ceiling':
      return { surface: 'ceiling', offset: 1 - attackerStart.offset }

    case 'ceiling-to-floor':
      return { surface: 'floor', offset: 1 - attackerStart.offset }

    case 'wall-to-wall':
      return attackerStart.surface === 'left-wall'
        ? { surface: 'right-wall', offset: attackerStart.offset }
        : { surface: 'left-wall', offset: attackerStart.offset }

    case 'floor-to-wall':
      return attackerStart.offset < 0.5
        ? { surface: 'left-wall', offset: 0.5 }
        : { surface: 'right-wall', offset: 0.5 }

    case 'diagonal':
      // 대각선: 상대 근처로 이동
      return { surface: 'floor', offset: 1 - attackerStart.offset }

    default:
      return attackerStart
  }
}

// 초기 위치 (challenger: 왼쪽 바닥, opponent: 오른쪽 바닥)
export const INITIAL_POSITIONS = {
  challenger: { surface: 'floor' as Surface, offset: 0.15 },
  opponent: { surface: 'floor' as Surface, offset: 0.85 },
}
