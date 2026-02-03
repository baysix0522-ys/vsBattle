// Tennis Tarot Deck Loader
import type { TennisTarotCard } from './types'
import tennisTarotDeckData from './tennisTarotDeck.json'

export * from './types'

// Export the deck as typed array
export const tennisTarotDeck: TennisTarotCard[] = tennisTarotDeckData as TennisTarotCard[]

// Fisher-Yates shuffle algorithm
export function shuffleDeck(deck: TennisTarotCard[]): TennisTarotCard[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = temp
  }
  return shuffled
}

// Get card image path (reuse from Tarot.tsx logic)
export function getTennisCardImagePath(card: TennisTarotCard): string {
  // Major Arcana (0-21)
  const majorArcanaMap: Record<string, string> = {
    'major_00_the_fool': '00-TheFool',
    'major_01_the_magician': '01-TheMagician',
    'major_02_the_high_priestess': '02-TheHighPriestess',
    'major_03_the_empress': '03-TheEmpress',
    'major_04_the_emperor': '04-TheEmperor',
    'major_05_the_hierophant': '05-TheHierophant',
    'major_06_the_lovers': '06-TheLovers',
    'major_07_the_chariot': '07-TheChariot',
    'major_08_strength': '08-Strength',
    'major_09_the_hermit': '09-TheHermit',
    'major_10_wheel_of_fortune': '10-WheelOfFortune',
    'major_11_justice': '11-Justice',
    'major_12_the_hanged_man': '12-TheHangedMan',
    'major_13_death': '13-Death',
    'major_14_temperance': '14-Temperance',
    'major_15_the_devil': '15-TheDevil',
    'major_16_the_tower': '16-TheTower',
    'major_17_the_star': '17-TheStar',
    'major_18_the_moon': '18-TheMoon',
    'major_19_the_sun': '19-TheSun',
    'major_20_judgement': '20-Judgement',
    'major_21_the_world': '21-TheWorld',
  }

  // Check if Major Arcana
  if (majorArcanaMap[card.id]) {
    return `/cards/${majorArcanaMap[card.id]}.jpg`
  }

  // Minor Arcana - rank를 숫자로 변환
  if (card.suit && card.rank) {
    const suitMap: Record<string, string> = {
      wands: 'Wands',
      cups: 'Cups',
      swords: 'Swords',
      pentacles: 'Pentacles',
    }
    const rankMap: Record<string, string> = {
      ace: '01',
      two: '02',
      three: '03',
      four: '04',
      five: '05',
      six: '06',
      seven: '07',
      eight: '08',
      nine: '09',
      ten: '10',
      page: '11',
      knight: '12',
      queen: '13',
      king: '14',
    }
    const suit = suitMap[card.suit]
    const num = rankMap[card.rank]
    if (suit && num) {
      return `/cards/${suit}${num}.jpg`
    }
  }

  return '/cards/CardBacks.jpg'
}
