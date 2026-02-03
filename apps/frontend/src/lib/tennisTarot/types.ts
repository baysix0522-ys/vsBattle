// Tennis Tarot Card Types

export interface TennisTarotCard {
  id: string
  arcana: 'major' | 'minor'
  number: number
  suit: 'wands' | 'cups' | 'swords' | 'pentacles' | null
  rank: string | null
  name_en: string
  name_ko: string
  tennis: {
    upright: TennisReading
    reversed: TennisReading
  }
}

export interface TennisReading {
  one: OneCardReading
  three: ThreeCardReading
}

export interface OneCardReading {
  summary_pool: string[]
  action_pool: string[]
  caution_pool: string[]
  focus_pool: string[][]
}

export interface ThreeCardReading {
  condition_pool: string[]
  strategy_pool: string[]
  warning_pool: string[]
}

export type SpreadType = 'one' | 'three'

export interface DrawnTennisCard {
  card: TennisTarotCard
  isReversed: boolean
  isFlipped: boolean
  position: number
  reading: GeneratedReading
}

export interface GeneratedReading {
  // For 1-card spread
  summary?: string
  action?: string
  caution?: string
  focus?: string[]
  // For 3-card spread (position-based)
  condition?: string
  strategy?: string
  warning?: string
}

// Helper function to pick random from pool
export function pickRandom<T>(pool: T[]): T {
  if (pool.length === 0) {
    throw new Error('Cannot pick from empty pool')
  }
  return pool[Math.floor(Math.random() * pool.length)] as T
}

// Generate reading from card based on spread type and position
export function generateReading(
  card: TennisTarotCard,
  isReversed: boolean,
  spreadType: SpreadType,
  position: number // 0, 1, 2 for three-card spread
): GeneratedReading {
  const orientation = isReversed ? card.tennis.reversed : card.tennis.upright

  if (spreadType === 'one') {
    const oneReading = orientation.one
    return {
      summary: pickRandom(oneReading.summary_pool),
      action: pickRandom(oneReading.action_pool),
      caution: pickRandom(oneReading.caution_pool),
      focus: pickRandom(oneReading.focus_pool),
    }
  } else {
    // three-card spread: each position gets different aspect
    const threeReading = orientation.three
    const oneReading = orientation.one

    // Position 0: Condition (컨디션)
    // Position 1: Strategy (전략)
    // Position 2: Warning (주의)
    if (position === 0) {
      return {
        condition: pickRandom(threeReading.condition_pool),
        focus: pickRandom(oneReading.focus_pool),
      }
    } else if (position === 1) {
      return {
        strategy: pickRandom(threeReading.strategy_pool),
        action: pickRandom(oneReading.action_pool),
      }
    } else {
      return {
        warning: pickRandom(threeReading.warning_pool),
        caution: pickRandom(oneReading.caution_pool),
      }
    }
  }
}
