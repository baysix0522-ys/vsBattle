// Tennis Tarot Card Types

export type Category = 'match' | 'practice' | 'mental' | 'body' | 'doubles'

// 카드 정방향/역방향 의미
export interface CardMeaning {
  keywords: string[]
  meaning: string
}

// 카드 자체 정보
export interface CardInfo {
  image: string
  upright: CardMeaning
  reversed: CardMeaning
}

// 카테고리별 테니스 해석
export interface CategoryReading {
  message: string
  focus: string[]
  action: string
  caution: string
}

// 정방향/역방향 테니스 해석
export interface TennisOrientation {
  keywords: string[]
  general: string
  match: CategoryReading
  practice: CategoryReading
  mental: CategoryReading
  body: CategoryReading
  doubles: CategoryReading
}

// 테니스 타로 카드
export interface TennisTarotCard {
  id: string
  arcana: 'major' | 'minor'
  number: number
  suit: 'wands' | 'cups' | 'swords' | 'pentacles' | null
  rank: string | null
  name_en: string
  name_ko: string
  card: CardInfo
  tennis: {
    upright: TennisOrientation
    reversed: TennisOrientation
  }
}

// 뽑힌 카드
export interface DrawnCard {
  card: TennisTarotCard
  isReversed: boolean
  isFlipped: boolean
}

// 카테고리별 리딩 결과
export interface Reading {
  message: string
  focus: string[]
  action: string
  caution: string
  keywords: string[]
  general: string
}

// 리딩 생성 함수
export function generateReading(
  card: TennisTarotCard,
  isReversed: boolean,
  category: Category
): Reading {
  const orientation = isReversed ? card.tennis.reversed : card.tennis.upright
  const categoryReading = orientation[category]

  return {
    message: categoryReading.message,
    focus: categoryReading.focus,
    action: categoryReading.action,
    caution: categoryReading.caution,
    keywords: orientation.keywords,
    general: orientation.general,
  }
}
