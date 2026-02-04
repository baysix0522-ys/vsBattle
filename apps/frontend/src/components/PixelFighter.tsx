import { useEffect, useState } from 'react'
import './PixelFighter.css'

type FighterAction = 'idle' | 'attack' | 'hit' | 'victory' | 'ultimate' | 'defeat'

interface PixelFighterProps {
  color: 'silver' | 'red'
  action: FighterAction
  flipped?: boolean // 오른쪽 캐릭터는 좌우 반전
  nickname?: string
}

// 새 스프라이트 시트 프레임 매핑 (row, col)
// red 스프라이트: 3행 × 6열
const ACTION_FRAMES_RED: Record<FighterAction, { row: number; col: number }> = {
  idle: { row: 0, col: 0 },      // 1행 1번 - 기본 자세
  attack: { row: 0, col: 2 },    // 1행 3번 - 검 휘두르기
  hit: { row: 2, col: 2 },       // 3행 3번 - 피격
  victory: { row: 0, col: 4 },   // 1행 5번 - 승리 포즈
  ultimate: { row: 1, col: 2 },  // 2행 3번 - 불꽃 필살기
  defeat: { row: 2, col: 4 },    // 3행 5번 - 쓰러짐
}

// silver 스프라이트는 기존 4프레임 유지
const ACTION_FRAMES_SILVER: Record<FighterAction, { row: number; col: number }> = {
  idle: { row: 0, col: 0 },
  attack: { row: 0, col: 1 },
  hit: { row: 0, col: 2 },
  victory: { row: 0, col: 3 },
  ultimate: { row: 0, col: 1 },  // attack과 동일
  defeat: { row: 0, col: 2 },    // hit과 동일
}

const FRAME_SIZE = 64
const COLS_RED = 6
const COLS_SILVER = 4

export default function PixelFighter({ color, action, flipped, nickname }: PixelFighterProps) {
  const [currentAction, setCurrentAction] = useState<FighterAction>(action)

  useEffect(() => {
    setCurrentAction(action)
  }, [action])

  const isRed = color === 'red'
  const frames = isRed ? ACTION_FRAMES_RED : ACTION_FRAMES_SILVER
  const frame = frames[currentAction]
  const spriteUrl = `/sprites/fighter-${color}.png`

  // 배경 위치 계산
  const bgX = frame.col * FRAME_SIZE
  const bgY = frame.row * FRAME_SIZE

  return (
    <div className={`pixel-fighter ${flipped ? 'flipped' : ''}`}>
      <div
        className={`fighter-sprite action-${currentAction} sprite-${color}`}
        style={{
          backgroundImage: `url(${spriteUrl})`,
          backgroundPosition: `-${bgX}px -${bgY}px`,
        }}
      />
      {nickname && <span className="fighter-name">{nickname}</span>}
    </div>
  )
}
