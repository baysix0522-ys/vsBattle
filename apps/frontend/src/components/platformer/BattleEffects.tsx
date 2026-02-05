import { useEffect, useState } from 'react'
import './BattleEffects.css'

export type EffectType = 'impact' | 'flash' | 'speedline' | 'spark'

interface Effect {
  id: string
  type: EffectType
  x: number
  y: number
}

interface BattleEffectsProps {
  effects: Effect[]
}

export default function BattleEffects({ effects }: BattleEffectsProps) {
  const [visibleEffects, setVisibleEffects] = useState<Effect[]>([])

  useEffect(() => {
    // 새 이펙트 추가
    if (effects.length > 0) {
      setVisibleEffects(effects)

      // 일정 시간 후 이펙트 제거
      const timer = setTimeout(() => {
        setVisibleEffects([])
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [effects])

  return (
    <div className="battle-effects-layer">
      {visibleEffects.map((effect) => (
        <div
          key={effect.id}
          className={`battle-effect effect-${effect.type}`}
          style={{
            left: effect.x,
            top: effect.y,
          }}
        >
          {effect.type === 'impact' && <ImpactEffect />}
          {effect.type === 'spark' && <SparkEffect />}
        </div>
      ))}
    </div>
  )
}

function ImpactEffect() {
  return (
    <>
      <div className="impact-ring impact-ring-1" />
      <div className="impact-ring impact-ring-2" />
      <div className="impact-ring impact-ring-3" />
      <div className="impact-star" />
    </>
  )
}

function SparkEffect() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="spark-particle"
          style={{
            '--angle': `${i * 60}deg`,
          } as React.CSSProperties}
        />
      ))}
    </>
  )
}

// 이펙트 생성 유틸리티
let effectIdCounter = 0

export function createEffect(type: EffectType, x: number, y: number): Effect {
  return {
    id: `effect-${++effectIdCounter}-${Date.now()}`,
    type,
    x,
    y,
  }
}
