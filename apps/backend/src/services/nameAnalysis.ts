import OpenAI from 'openai'

// API 키가 유효한지 체크
function isValidApiKey(key: string | undefined): boolean {
  if (!key) return false
  if (key.includes('your') || key.includes('YOUR')) return false
  if (key === 'sk-your-openai-api-key') return false
  if (!key.startsWith('sk-')) return false
  return true
}

const USE_DUMMY_DATA = process.env.USE_DUMMY_DATA === 'true' || !isValidApiKey(process.env.OPENAI_API_KEY)

// Lazy initialization
let openaiClient: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다')
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

// ============================================
// 타입 정의
// ============================================

export type HanjaSuggestion = {
  hanja: string
  reading: string
  meaning: string
  strokeCount: number
  fiveElement: '목' | '화' | '토' | '금' | '수'
  popularity: number
}

export type HanjaCandidates = {
  korean: string
  candidates: HanjaSuggestion[]
}

export type HanjaCharacter = {
  korean: string              // 한글 (영)
  hanja: string               // 한자 (泳)
  meaning: string             // 훈 (헤엄치다, 물에서 나아가다)
  interpretation: string      // 핵심 해석 (2-3문장)
  symbolism: string           // 상징적 의미 + 추가 설명
  fiveElement: '목' | '화' | '토' | '금' | '수'
  elementReason: string       // 오행 판단 근거 (예: "氵(삼수변) = 水(물)")
  strokeCount: number
}

export type LifeInterpretation = {
  love: string
  career: string
  relationships: string
}

export type FiveElementCard = {
  element: '목' | '화' | '토' | '금' | '수'
  count: number
  percentage: number
  personality: string
  icon: string
}

export type FiveElementBalance = {
  distribution: FiveElementCard[]
  harmony: {
    type: '상생' | '상극' | '균형' | '편중'
    description: string
    advice: string
  }
  dominant: string
  lacking: string | null
  surnameElement?: string
  surnameElementReason?: string
}

export type OgyeokScore = {
  strokes: number
  fiveElement: '목' | '화' | '토' | '금' | '수'
  formula: string  // 계산식 (예: "6 + 8 = 14")
  score: number
  label: string
  interpretation?: string  // GPT가 생성한 해석
}

export type SamjaeAnalysis = {
  flow: string  // "토 → 화 → 수"
  elements: ['목' | '화' | '토' | '금' | '수', '목' | '화' | '토' | '금' | '수', '목' | '화' | '토' | '금' | '수']
  type: '상생' | '상극' | '혼합'
  description: string
}

export type StrokeBreakdown = {
  char: string
  hanja: string
  strokes: number
}

export type OgyeokScores = {
  breakdown: StrokeBreakdown[]
  천격: OgyeokScore
  인격: OgyeokScore
  지격: OgyeokScore
  외격: OgyeokScore
  총격: OgyeokScore
  samjae: SamjaeAnalysis
}

export type ShareableKeywords = {
  nickname: string
  keywords: string[]
  hashtags: string[]
  oneLineQuote: string
}

export type NameAnalysisResult = {
  characters: HanjaCharacter[]
  combinedMeaning: string
  lifeInterpretation: LifeInterpretation
  fiveElements: FiveElementBalance
  ogyeokScores: OgyeokScores
  shareable: ShareableKeywords
  nickname: NicknameInfo  // 25개 고정 닉네임 중 선정
  overallScore: number
  overallGrade: '대길' | '길' | '중길' | '소길' | '평'
  summary: string
  advice: string
}

export type SelectedHanja = {
  korean: string
  hanja: string
}

// ============================================
// 닉네임 시스템 타입 및 상수
// ============================================

export type NicknameType = '리더' | '전략가' | '장인' | '조율자' | '탐구자'
export type FiveElement = '목' | '화' | '토' | '금' | '수'

export type NicknameInfo = {
  element: FiveElement
  type: NicknameType
  name: string
  desc: string
  icon: string
  quote: string
}

// 25개 고정 닉네임 (5 오행 × 5 타입)
const ELEMENT_NICKNAMES: Record<FiveElement, Record<NicknameType, Omit<NicknameInfo, 'element' | 'type'>>> = {
  // ===== 水(수) - 흐름/직관/적응 =====
  수: {
    리더: {
      name: '파도의 선봉장',
      desc: '거침없이 밀어붙이는 물의 힘',
      icon: '🌊',
      quote: '막히면 돌아가고, 돌아가면 결국 바다에 닿는다',
    },
    전략가: {
      name: '물길의 설계자',
      desc: '흐름을 읽고 판을 바꾸는 지혜',
      icon: '💧',
      quote: '흐름을 읽는 자가 판을 바꾼다',
    },
    장인: {
      name: '심해의 장인',
      desc: '깊이 있는 완성도를 추구',
      icon: '🐋',
      quote: '깊이 들어가야 진짜가 보인다',
    },
    조율자: {
      name: '흐름의 조율사',
      desc: '관계를 자연스럽게 연결',
      icon: '🌀',
      quote: '물은 모든 것을 품고 흐른다',
    },
    탐구자: {
      name: '잔잔한 관찰자',
      desc: '조용히 상황을 읽는 눈',
      icon: '🔮',
      quote: '고요한 물이 깊은 법',
    },
  },

  // ===== 木(목) - 성장/확장/육성 =====
  목: {
    리더: {
      name: '숲의 개척자',
      desc: '새로운 영역을 넓히는 선구자',
      icon: '🌲',
      quote: '첫 나무가 숲이 된다',
    },
    전략가: {
      name: '뿌리의 설계자',
      desc: '기반부터 탄탄히 세우는 계획가',
      icon: '🌱',
      quote: '보이지 않는 곳에서 성장이 시작된다',
    },
    장인: {
      name: '성장의 정원사',
      desc: '꾸준히 키워내는 장인정신',
      icon: '🪴',
      quote: '매일 조금씩, 결국 거목이 된다',
    },
    조율자: {
      name: '가지의 연결자',
      desc: '사람과 사람을 이어주는 역할',
      icon: '🍃',
      quote: '가지가 닿는 곳에 그늘이 생긴다',
    },
    탐구자: {
      name: '새순의 탐구자',
      desc: '가능성을 발견하는 관찰력',
      icon: '🌿',
      quote: '작은 싹에서 미래를 본다',
    },
  },

  // ===== 火(화) - 추진/표현/열정 =====
  화: {
    리더: {
      name: '불꽃의 선봉장',
      desc: '앞장서서 돌파하는 열정',
      icon: '🔥',
      quote: '두려움은 불꽃 앞에 재가 된다',
    },
    전략가: {
      name: '화염의 설계자',
      desc: '폭발적 성과를 계획하는 전략',
      icon: '💥',
      quote: '불을 다루는 자가 판을 뒤집는다',
    },
    장인: {
      name: '열정의 단조사',
      desc: '뜨겁게 완성해내는 집중력',
      icon: '⚒️',
      quote: '달궈진 철만이 명검이 된다',
    },
    조율자: {
      name: '온기의 연결자',
      desc: '따뜻함으로 사람을 모으는 힘',
      icon: '🕯️',
      quote: '작은 불씨 하나가 모두를 따뜻하게',
    },
    탐구자: {
      name: '불씨의 발견자',
      desc: '가능성의 불씨를 찾아내는 눈',
      icon: '✨',
      quote: '꺼진 줄 알았던 곳에서 빛을 찾는다',
    },
  },

  // ===== 土(토) - 안정/지지/신뢰 =====
  토: {
    리더: {
      name: '대지의 수호자',
      desc: '든든하게 지켜내는 리더십',
      icon: '⛰️',
      quote: '산은 흔들리지 않는다',
    },
    전략가: {
      name: '기반의 설계자',
      desc: '흔들리지 않는 토대를 세우는 힘',
      icon: '🏗️',
      quote: '튼튼한 기초 위에 높은 탑이 선다',
    },
    장인: {
      name: '땅을 다지는 장인',
      desc: '묵묵히 완성해가는 신뢰',
      icon: '🧱',
      quote: '한 삽 한 삽이 길이 된다',
    },
    조율자: {
      name: '중심의 조율자',
      desc: '균형을 맞추는 안정감',
      icon: '⚖️',
      quote: '흔들리는 배에서도 중심은 있다',
    },
    탐구자: {
      name: '지층의 탐구자',
      desc: '본질을 파악하는 통찰력',
      icon: '💎',
      quote: '깊이 파야 보석이 나온다',
    },
  },

  // ===== 金(금) - 결단/정리/판단 =====
  금: {
    리더: {
      name: '결단의 칼날',
      desc: '단호하게 이끄는 리더십',
      icon: '⚔️',
      quote: '망설임 없이 베어야 길이 열린다',
    },
    전략가: {
      name: '판을 짜는 설계자',
      desc: '치밀하게 구조를 세우는 전략',
      icon: '🎯',
      quote: '한 수 앞을 보는 자가 이긴다',
    },
    장인: {
      name: '정리의 장인',
      desc: '완벽하게 마무리하는 능력',
      icon: '🔧',
      quote: '끝이 좋아야 전부 좋다',
    },
    조율자: {
      name: '선을 긋는 중재자',
      desc: '명확한 기준으로 조율하는 힘',
      icon: '📐',
      quote: '기준이 있어야 판단이 선다',
    },
    탐구자: {
      name: '냉철한 분석가',
      desc: '객관적으로 판단하는 시선',
      icon: '🔍',
      quote: '감정을 빼면 진실이 보인다',
    },
  },
}

// 오격 → 타입 매핑 (오격의 전통적 의미 기반)
// 천격(성씨=선천운) → 탐구자, 인격(대인관계) → 리더, 지격(실행력) → 장인
// 외격(사회관계) → 조율자, 총격(종합운) → 전략가
function determineNicknameType(ogyeokScores: OgyeokScores): NicknameType {
  const { 천격, 인격, 지격, 외격, 총격, samjae } = ogyeokScores

  // 오격별 점수 + 타입 매핑
  const scores: { type: NicknameType; score: number; boost: number }[] = [
    { type: '탐구자', score: 천격.score, boost: 0 },
    { type: '리더', score: 인격.score, boost: samjae.type === '상생' ? 5 : 0 },
    { type: '장인', score: 지격.score, boost: 0 },
    { type: '조율자', score: 외격.score, boost: 0 },
    { type: '전략가', score: 총격.score, boost: 0 },
  ]

  // 보정 점수 포함해서 최고점 찾기
  const sorted = [...scores].sort((a, b) => (b.score + b.boost) - (a.score + a.boost))
  return sorted[0]!.type
}

// 주오행 + 타입 → 닉네임 선정
function selectNickname(mainElement: FiveElement, type: NicknameType): NicknameInfo {
  const nicknameData = ELEMENT_NICKNAMES[mainElement][type]
  return {
    element: mainElement,
    type,
    ...nicknameData,
  }
}

// ============================================
// 궁합 계산 (사실 기반: 오행 상생/상극 + 인격 비교)
// ============================================

export type CompatibilityResult = {
  score: number  // 0-100
  grade: '천생연분' | '좋음' | '보통' | '노력필요' | '상극'
  analysis: {
    elementMatch: {
      type: '상생' | '상극' | '비화' | '중립'
      description: string
    }
    ingyeokMatch: {
      type: '상생' | '상극' | '비화' | '중립'
      description: string
    }
    samjaeMatch: {
      compatible: boolean
      description: string
    }
  }
  advice: string
}

// 상생 관계: 목→화→토→금→수→목
const SANGSAENG: Record<FiveElement, FiveElement> = {
  목: '화', 화: '토', 토: '금', 금: '수', 수: '목'
}

// 상극 관계: 목↔토, 화↔금, 토↔수
const SANGGEUK: [FiveElement, FiveElement][] = [
  ['목', '토'], ['화', '금'], ['토', '수']
]

function getElementRelation(el1: FiveElement, el2: FiveElement): '상생' | '상극' | '비화' | '중립' {
  if (el1 === el2) return '비화'
  if (SANGSAENG[el1] === el2 || SANGSAENG[el2] === el1) return '상생'
  if (SANGGEUK.some(([a, b]) => (a === el1 && b === el2) || (a === el2 && b === el1))) return '상극'
  return '중립'
}

export function calculateCompatibility(
  person1: { mainElement: FiveElement; ingyeokElement: FiveElement; samjaeType: '상생' | '상극' | '혼합' },
  person2: { mainElement: FiveElement; ingyeokElement: FiveElement; samjaeType: '상생' | '상극' | '혼합' }
): CompatibilityResult {
  // 1. 주오행 비교 (40점)
  const elementRelation = getElementRelation(person1.mainElement, person2.mainElement)
  let elementScore = 0
  let elementDesc = ''

  switch (elementRelation) {
    case '상생':
      elementScore = 40
      elementDesc = `${person1.mainElement}과 ${person2.mainElement}은 서로를 키워주는 상생 관계입니다.`
      break
    case '비화':
      elementScore = 25
      elementDesc = `같은 ${person1.mainElement} 오행으로 서로를 이해하지만, 경쟁할 수 있습니다.`
      break
    case '중립':
      elementScore = 30
      elementDesc = `${person1.mainElement}과 ${person2.mainElement}은 무난한 관계입니다.`
      break
    case '상극':
      elementScore = 15
      elementDesc = `${person1.mainElement}과 ${person2.mainElement}은 충돌이 있을 수 있어 조율이 필요합니다.`
      break
  }

  // 2. 인격 오행 비교 (40점) - 대인관계의 핵심
  const ingyeokRelation = getElementRelation(person1.ingyeokElement, person2.ingyeokElement)
  let ingyeokScore = 0
  let ingyeokDesc = ''

  switch (ingyeokRelation) {
    case '상생':
      ingyeokScore = 40
      ingyeokDesc = '인격 오행이 상생하여 대인관계가 원활합니다.'
      break
    case '비화':
      ingyeokScore = 30
      ingyeokDesc = '인격 오행이 같아 공감대가 높지만 부딪힐 수 있습니다.'
      break
    case '중립':
      ingyeokScore = 25
      ingyeokDesc = '인격 오행이 중립으로 평범한 관계를 유지합니다.'
      break
    case '상극':
      ingyeokScore = 10
      ingyeokDesc = '인격 오행이 상극하여 소통에 노력이 필요합니다.'
      break
  }

  // 3. 삼재 보완 (20점)
  let samjaeScore = 0
  let samjaeDesc = ''
  const samjaeCompatible = !(person1.samjaeType === '상극' && person2.samjaeType === '상극')

  if (person1.samjaeType === '상생' && person2.samjaeType === '상생') {
    samjaeScore = 20
    samjaeDesc = '둘 다 삼재가 상생으로 안정적인 조합입니다.'
  } else if (person1.samjaeType === '상극' && person2.samjaeType === '상극') {
    samjaeScore = 5
    samjaeDesc = '둘 다 삼재 상극으로 서로 보완이 필요합니다.'
  } else if (person1.samjaeType !== person2.samjaeType) {
    samjaeScore = 15
    samjaeDesc = '삼재가 다르지만 서로 보완할 수 있는 관계입니다.'
  } else {
    samjaeScore = 12
    samjaeDesc = '삼재 조합이 무난합니다.'
  }

  const totalScore = elementScore + ingyeokScore + samjaeScore

  let grade: CompatibilityResult['grade']
  if (totalScore >= 85) grade = '천생연분'
  else if (totalScore >= 70) grade = '좋음'
  else if (totalScore >= 50) grade = '보통'
  else if (totalScore >= 35) grade = '노력필요'
  else grade = '상극'

  let advice = ''
  if (grade === '천생연분') {
    advice = '서로의 장점을 살려주는 환상의 조합입니다!'
  } else if (grade === '좋음') {
    advice = '좋은 궁합입니다. 서로를 존중하면 더 좋아집니다.'
  } else if (grade === '보통') {
    advice = '무난한 관계입니다. 소통에 신경 쓰면 발전할 수 있습니다.'
  } else if (grade === '노력필요') {
    advice = '서로 다른 점을 인정하고 배려하면 좋은 관계가 됩니다.'
  } else {
    advice = '충돌이 있을 수 있지만, 다름을 인정하면 오히려 보완이 됩니다.'
  }

  return {
    score: totalScore,
    grade,
    analysis: {
      elementMatch: { type: elementRelation, description: elementDesc },
      ingyeokMatch: { type: ingyeokRelation, description: ingyeokDesc },
      samjaeMatch: { compatible: samjaeCompatible, description: samjaeDesc },
    },
    advice,
  }
}

// ============================================
// 81수리 길흉 테이블
// ============================================

const STROKE_LUCK: Record<number, { score: number; label: string }> = {
  1: { score: 90, label: '대길' },
  2: { score: 30, label: '흉' },
  3: { score: 85, label: '길' },
  4: { score: 35, label: '흉' },
  5: { score: 88, label: '대길' },
  6: { score: 82, label: '길' },
  7: { score: 80, label: '길' },
  8: { score: 85, label: '길' },
  9: { score: 30, label: '흉' },
  10: { score: 25, label: '흉' },
  11: { score: 90, label: '대길' },
  12: { score: 35, label: '흉' },
  13: { score: 85, label: '길' },
  14: { score: 30, label: '흉' },
  15: { score: 88, label: '대길' },
  16: { score: 85, label: '길' },
  17: { score: 80, label: '길' },
  18: { score: 82, label: '길' },
  19: { score: 28, label: '흉' },
  20: { score: 25, label: '흉' },
  21: { score: 90, label: '대길' },
  22: { score: 32, label: '흉' },
  23: { score: 88, label: '대길' },
  24: { score: 90, label: '대길' },
  25: { score: 78, label: '중길' },
  26: { score: 45, label: '소길' },
  27: { score: 45, label: '소길' },
  28: { score: 35, label: '흉' },
  29: { score: 85, label: '길' },
  30: { score: 50, label: '반길반흉' },
  31: { score: 88, label: '대길' },
  32: { score: 85, label: '길' },
  33: { score: 88, label: '대길' },
  34: { score: 30, label: '흉' },
  35: { score: 78, label: '중길' },
  36: { score: 45, label: '소길' },
  37: { score: 82, label: '길' },
  38: { score: 75, label: '중길' },
  39: { score: 85, label: '길' },
  40: { score: 50, label: '반길반흉' },
  41: { score: 88, label: '대길' },
  42: { score: 50, label: '반길반흉' },
  43: { score: 40, label: '소흉' },
  44: { score: 35, label: '흉' },
  45: { score: 85, label: '길' },
  46: { score: 40, label: '소흉' },
  47: { score: 85, label: '길' },
  48: { score: 82, label: '길' },
  49: { score: 40, label: '소흉' },
  50: { score: 50, label: '반길반흉' },
  51: { score: 50, label: '반길반흉' },
  52: { score: 78, label: '중길' },
  53: { score: 50, label: '반길반흉' },
  54: { score: 35, label: '흉' },
  55: { score: 50, label: '반길반흉' },
  56: { score: 40, label: '소흉' },
  57: { score: 78, label: '중길' },
  58: { score: 50, label: '반길반흉' },
  59: { score: 35, label: '흉' },
  60: { score: 30, label: '흉' },
  61: { score: 82, label: '길' },
  62: { score: 40, label: '소흉' },
  63: { score: 78, label: '중길' },
  64: { score: 35, label: '흉' },
  65: { score: 82, label: '길' },
  66: { score: 40, label: '소흉' },
  67: { score: 82, label: '길' },
  68: { score: 82, label: '길' },
  69: { score: 40, label: '소흉' },
  70: { score: 35, label: '흉' },
  71: { score: 50, label: '반길반흉' },
  72: { score: 40, label: '소흉' },
  73: { score: 50, label: '반길반흉' },
  74: { score: 35, label: '흉' },
  75: { score: 50, label: '반길반흉' },
  76: { score: 40, label: '소흉' },
  77: { score: 50, label: '반길반흉' },
  78: { score: 50, label: '반길반흉' },
  79: { score: 40, label: '소흉' },
  80: { score: 40, label: '소흉' },
  81: { score: 90, label: '대길' },
}

function getStrokeLuck(strokes: number): { score: number; label: string } {
  const mod = strokes <= 0 ? 1 : (strokes > 81 ? ((strokes - 1) % 81) + 1 : strokes)
  return STROKE_LUCK[mod] || { score: 50, label: '중립' }
}

// 획수 끝자리로 오행 판단: 1·2=목, 3·4=화, 5·6=토, 7·8=금, 9·0=수
function getElementFromStrokes(strokes: number): '목' | '화' | '토' | '금' | '수' {
  const lastDigit = strokes % 10
  if (lastDigit === 1 || lastDigit === 2) return '목'
  if (lastDigit === 3 || lastDigit === 4) return '화'
  if (lastDigit === 5 || lastDigit === 6) return '토'
  if (lastDigit === 7 || lastDigit === 8) return '금'
  return '수' // 9, 0
}

// 상생/상극 판단
function checkElementRelation(el1: string, el2: string): '상생' | '상극' | '중립' {
  // 상생: 목→화→토→금→수→목
  const sangseung: Record<string, string> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' }
  // 상극: 목↔토, 화↔금, 토↔수
  const sanggeuk: [string, string][] = [['목', '토'], ['화', '금'], ['토', '수']]

  if (sangseung[el1] === el2) return '상생'
  if (sanggeuk.some(([a, b]) => (a === el1 && b === el2) || (a === el2 && b === el1))) return '상극'
  return '중립'
}

// ============================================
// 오격 계산
// ============================================

function calculateOgyeok(
  surnameChar: string,
  surnameHanja: string,
  surnameStrokes: number,
  nameChars: { char: string; hanja: string; strokes: number }[]
): OgyeokScores {
  const nameStrokes = nameChars.map(c => c.strokes)
  const totalNameStrokes = nameStrokes.reduce((a, b) => a + b, 0)
  const firstNameStroke = nameStrokes[0] || 1
  const lastNameStroke = nameStrokes[nameStrokes.length - 1] || 1

  // breakdown: 글자별 획수
  const breakdown: StrokeBreakdown[] = [
    { char: surnameChar, hanja: surnameHanja, strokes: surnameStrokes },
    ...nameChars.map(c => ({ char: c.char, hanja: c.hanja, strokes: c.strokes })),
  ]

  // 천격: 성씨 획수 (단독)
  const cheonStrokes = surnameStrokes
  const cheonLuck = getStrokeLuck(cheonStrokes)
  const cheonElement = getElementFromStrokes(cheonStrokes)

  // 인격: 성씨 획수 + 이름 첫 글자 획수
  const inStrokes = surnameStrokes + firstNameStroke
  const inLuck = getStrokeLuck(inStrokes)
  const inElement = getElementFromStrokes(inStrokes)

  // 지격: 이름 획수 합
  const jiStrokes = totalNameStrokes || 2
  const jiLuck = getStrokeLuck(jiStrokes)
  const jiElement = getElementFromStrokes(jiStrokes)

  // 외격: 성씨 획수 + 이름 끝 글자 획수
  const oeStrokes = surnameStrokes + lastNameStroke
  const oeLuck = getStrokeLuck(oeStrokes)
  const oeElement = getElementFromStrokes(oeStrokes)

  // 총격: 전체 획수
  const chongStrokes = surnameStrokes + totalNameStrokes
  const chongLuck = getStrokeLuck(chongStrokes)
  const chongElement = getElementFromStrokes(chongStrokes)

  // 삼재 분석 (천-인-지)
  const samjaeElements: ['목' | '화' | '토' | '금' | '수', '목' | '화' | '토' | '금' | '수', '목' | '화' | '토' | '금' | '수'] = [cheonElement, inElement, jiElement]
  const rel1 = checkElementRelation(cheonElement, inElement)
  const rel2 = checkElementRelation(inElement, jiElement)

  let samjaeType: '상생' | '상극' | '혼합'
  let samjaeDesc: string

  if (rel1 === '상생' && rel2 === '상생') {
    samjaeType = '상생'
    samjaeDesc = `${cheonElement}(天) → ${inElement}(人) → ${jiElement}(地) 순환으로 자연스러운 성장과 발전의 흐름입니다.`
  } else if (rel1 === '상극' || rel2 === '상극') {
    samjaeType = '상극'
    const conflictPair = rel1 === '상극'
      ? `${cheonElement}(天)과 ${inElement}(人)`
      : `${inElement}(人)과 ${jiElement}(地)`
    samjaeDesc = `${conflictPair} 사이에 충돌이 있어 조율이 필요한 구조입니다. 열정과 환경 사이에서 균형을 찾는 것이 과제입니다.`
  } else {
    samjaeType = '혼합'
    samjaeDesc = `${cheonElement}(天) → ${inElement}(人) → ${jiElement}(地) 흐름으로 안정적인 구조입니다.`
  }

  return {
    breakdown,
    천격: {
      strokes: cheonStrokes,
      fiveElement: cheonElement,
      formula: `${surnameStrokes}`,
      score: cheonLuck.score,
      label: cheonLuck.label,
    },
    인격: {
      strokes: inStrokes,
      fiveElement: inElement,
      formula: `${surnameStrokes} + ${firstNameStroke} = ${inStrokes}`,
      score: inLuck.score,
      label: inLuck.label,
    },
    지격: {
      strokes: jiStrokes,
      fiveElement: jiElement,
      formula: nameStrokes.join(' + ') + ` = ${jiStrokes}`,
      score: jiLuck.score,
      label: jiLuck.label,
    },
    외격: {
      strokes: oeStrokes,
      fiveElement: oeElement,
      formula: `${surnameStrokes} + ${lastNameStroke} = ${oeStrokes}`,
      score: oeLuck.score,
      label: oeLuck.label,
    },
    총격: {
      strokes: chongStrokes,
      fiveElement: chongElement,
      formula: `${surnameStrokes} + ${totalNameStrokes} = ${chongStrokes}`,
      score: chongLuck.score,
      label: chongLuck.label,
    },
    samjae: {
      flow: `${cheonElement} → ${inElement} → ${jiElement}`,
      elements: samjaeElements,
      type: samjaeType,
      description: samjaeDesc,
    },
  }
}

// ============================================
// 한자 후보 제안 프롬프트
// ============================================

function buildHanjaSuggestionPrompt(koreanName: string): string {
  return `당신은 한국 작명 전문가입니다. 다음 한글 이름의 각 글자에 대해 이름에 많이 사용되는 한자 후보 3개씩을 제안해주세요.

이름: ${koreanName}

다음 JSON 형식으로만 응답해주세요:
{
  "suggestions": [
    {
      "korean": "글자",
      "candidates": [
        {
          "hanja": "한자 1글자",
          "reading": "음 (한글)",
          "meaning": "훈 (간결하게 2-4자)",
          "strokeCount": 획수(숫자),
          "fiveElement": "목/화/토/금/수 중 하나",
          "popularity": 1-5
        }
      ]
    }
  ]
}

주의사항:
- 이름에 자주 쓰이는 긍정적 의미의 한자 우선 (popularity 5가 가장 높음)
- 획수는 정확히 계산
- 오행은 부수 기반으로 판단 (木→목, 火→화, 土→토, 金→금, 水→수, 그 외는 의미 기반)
- 각 글자당 정확히 3개의 후보`
}

// ============================================
// 이름 분석 프롬프트
// ============================================

function buildNameAnalysisPrompt(
  surname: string,
  surnameHanja: string,
  koreanName: string,
  selectedHanja: SelectedHanja[],
  surnameStrokes: number,
  nameStrokes: number[]
): string {
  const hanjaList = selectedHanja.map((h, i) => `${h.korean}(${h.hanja}, ${nameStrokes[i]}획)`).join(', ')
  const fullName = surname + koreanName
  const fullHanja = surnameHanja + selectedHanja.map(h => h.hanja).join('')

  // 오격 계산에 필요한 데이터
  const totalNameStrokes = nameStrokes.reduce((a, b) => a + b, 0)
  const firstNameStroke = nameStrokes[0] || 1
  const lastNameStroke = nameStrokes[nameStrokes.length - 1] || 1

  const cheonStrokes = surnameStrokes
  const inStrokes = surnameStrokes + firstNameStroke
  const jiStrokes = totalNameStrokes
  const oeStrokes = surnameStrokes + lastNameStroke
  const chongStrokes = surnameStrokes + totalNameStrokes

  return `당신은 40년 경력의 작명/성명학 전문가입니다.
다음 이름을 심층 분석해주세요.

성명: ${fullName}
한자: ${fullHanja}
- 성: ${surname}(${surnameHanja}, ${surnameStrokes}획)
- 이름: ${hanjaList}

[오격 계산 결과]
- 천격(天格): ${cheonStrokes}획
- 인격(人格): ${surnameStrokes} + ${firstNameStroke} = ${inStrokes}획
- 지격(地格): ${nameStrokes.join(' + ')} = ${jiStrokes}획
- 외격(外格): ${surnameStrokes} + ${lastNameStroke} = ${oeStrokes}획
- 총격(總格): ${surnameStrokes} + ${totalNameStrokes} = ${chongStrokes}획

다음 JSON 형식으로 정확히 응답해주세요:

{
  "surnameCharacter": {
    "fiveElement": "목/화/토/금/수 (부수/자형 기반으로 판단)",
    "elementReason": "오행 판단 근거. 부수나 자형 구조로 설명"
  },
  "characters": [
    {
      "korean": "한글 1글자",
      "hanja": "한자 1글자",
      "meaning": "훈 (10-20자, 여러 뜻이 있으면 콤마로 구분). 예: '헤엄치다, 물에서 나아가다'",
      "interpretation": "해석 (2-3문장). 단순한 뜻풀이가 아닌 상징과 철학이 담긴 해석.",
      "symbolism": "상징 (2문장). 핵심 키워드를 + 로 연결하고, 추가 설명을 덧붙임.",
      "fiveElement": "목/화/토/금/수 (부수/자형 기반으로 판단)",
      "elementReason": "오행 판단 근거. 부수나 자형 구조로 설명."
    }
  ],
  "combinedMeaning": "이름 전체의 조합 의미를 시적으로 표현 (80-120자, 은유적으로)",
  "lifeInterpretation": {
    "love": "연애/결혼 관점에서 이 이름이 가진 특성 해석 (50-80자)",
    "career": "일/직업 관점에서 이 이름이 가진 강점 해석 (50-80자)",
    "relationships": "인간관계 관점에서 이 이름이 가진 특성 해석 (50-80자)"
  },
  "fiveElements": {
    "harmony": {
      "type": "상생/상극/균형/편중 중 하나",
      "description": "오행 관계 분석 설명 (50-80자)",
      "advice": "부족한 오행 보완 조언 (30-50자)"
    }
  },
  "ogyeok": {
    "천격": {
      "interpretation": "천격 해석 (40-60자). 조상운/가문의 기운 관점에서 해석"
    },
    "인격": {
      "interpretation": "인격 해석 (40-60자). 성격/대인관계/중년운 관점에서 해석"
    },
    "지격": {
      "interpretation": "지격 해석 (40-60자). 초년운/성장기/기초운 관점에서 해석"
    },
    "외격": {
      "interpretation": "외격 해석 (40-60자). 사회운/직업운/외부 환경 관점에서 해석"
    },
    "총격": {
      "interpretation": "총격 해석 (40-60자). 총운/인생 전체 흐름 관점에서 해석"
    }
  },
  "shareable": {
    "keywords": ["키워드1", "키워드2", "키워드3"],
    "hashtags": ["#해시태그1", "#해시태그2", "#해시태그3"]
  },
  "overallScore": 0-100 종합 점수,
  "overallGrade": "대길/길/중길/소길/평 중 하나",
  "summary": "종합 분석 (4-6문장). 글자별 의미 분석, 오행 흐름, 오격 획수를 모두 종합하여 이 이름이 가진 총체적 기운과 인생 흐름을 분석. 단순 요약이 아닌 세 가지 관점을 연결한 깊이 있는 해석.",
  "advice": "이 이름을 가진 사람에게 드리는 인생 조언 (1-2문장)"
}

분석 기준:
- surnameCharacter: 성씨(${surnameHanja})의 오행을 부수/자형 기반으로 판단
- characters: 이름 글자만 포함 (성씨 제외)
- 각 한자의 훈/음/상징을 정확히 해석
- 오행은 부수 기반으로 판단 (木,艸→목, 火,灬→화, 土→토, 金→금, 水,氵→수)
- 상생(목→화→토→금→수→목), 상극(목↔토, 화↔금, 토↔수) 관계 분석
- 오격 해석 시 위에 제공된 획수 계산 결과를 기반으로 각 격의 의미를 풀이
- summary(종합 분석)는 글자 의미 + 오행 흐름 + 오격 획수 세 가지를 모두 아우르는 분석
- 긍정적이고 희망적인 톤 유지
- 실생활에 적용 가능한 해석 제공

※ 오행분포/닉네임은 서버에서 별도 계산하므로 생략`
}

// ============================================
// 더미 데이터 생성
// ============================================

function generateDummyHanjaSuggestions(koreanName: string): HanjaCandidates[] {
  const dummyData: Record<string, HanjaSuggestion[]> = {
    영: [
      { hanja: '榮', reading: '영', meaning: '영화롭다', strokeCount: 14, fiveElement: '목', popularity: 5 },
      { hanja: '永', reading: '영', meaning: '영원하다', strokeCount: 5, fiveElement: '수', popularity: 5 },
      { hanja: '英', reading: '영', meaning: '꽃부리', strokeCount: 8, fiveElement: '목', popularity: 4 },
    ],
    식: [
      { hanja: '植', reading: '식', meaning: '심다', strokeCount: 12, fiveElement: '목', popularity: 4 },
      { hanja: '式', reading: '식', meaning: '법식', strokeCount: 6, fiveElement: '금', popularity: 3 },
      { hanja: '識', reading: '식', meaning: '알다', strokeCount: 19, fiveElement: '금', popularity: 3 },
    ],
    민: [
      { hanja: '民', reading: '민', meaning: '백성', strokeCount: 5, fiveElement: '수', popularity: 5 },
      { hanja: '敏', reading: '민', meaning: '민첩하다', strokeCount: 11, fiveElement: '수', popularity: 4 },
      { hanja: '旻', reading: '민', meaning: '하늘', strokeCount: 8, fiveElement: '화', popularity: 3 },
    ],
    수: [
      { hanja: '秀', reading: '수', meaning: '빼어나다', strokeCount: 7, fiveElement: '목', popularity: 5 },
      { hanja: '壽', reading: '수', meaning: '오래살다', strokeCount: 14, fiveElement: '토', popularity: 4 },
      { hanja: '洙', reading: '수', meaning: '물이름', strokeCount: 9, fiveElement: '수', popularity: 3 },
    ],
    지: [
      { hanja: '智', reading: '지', meaning: '지혜', strokeCount: 12, fiveElement: '화', popularity: 5 },
      { hanja: '志', reading: '지', meaning: '뜻', strokeCount: 7, fiveElement: '화', popularity: 4 },
      { hanja: '知', reading: '지', meaning: '알다', strokeCount: 8, fiveElement: '화', popularity: 4 },
    ],
    현: [
      { hanja: '賢', reading: '현', meaning: '어질다', strokeCount: 15, fiveElement: '금', popularity: 5 },
      { hanja: '現', reading: '현', meaning: '나타나다', strokeCount: 11, fiveElement: '토', popularity: 4 },
      { hanja: '炫', reading: '현', meaning: '빛나다', strokeCount: 9, fiveElement: '화', popularity: 4 },
    ],
    준: [
      { hanja: '俊', reading: '준', meaning: '준걸', strokeCount: 9, fiveElement: '화', popularity: 5 },
      { hanja: '準', reading: '준', meaning: '준하다', strokeCount: 13, fiveElement: '수', popularity: 4 },
      { hanja: '峻', reading: '준', meaning: '높다', strokeCount: 10, fiveElement: '토', popularity: 3 },
    ],
    서: [
      { hanja: '瑞', reading: '서', meaning: '상서롭다', strokeCount: 13, fiveElement: '금', popularity: 5 },
      { hanja: '書', reading: '서', meaning: '글', strokeCount: 10, fiveElement: '목', popularity: 4 },
      { hanja: '序', reading: '서', meaning: '차례', strokeCount: 7, fiveElement: '목', popularity: 3 },
    ],
    연: [
      { hanja: '延', reading: '연', meaning: '늘이다', strokeCount: 7, fiveElement: '토', popularity: 4 },
      { hanja: '蓮', reading: '연', meaning: '연꽃', strokeCount: 15, fiveElement: '목', popularity: 5 },
      { hanja: '燕', reading: '연', meaning: '제비', strokeCount: 16, fiveElement: '화', popularity: 3 },
    ],
    우: [
      { hanja: '宇', reading: '우', meaning: '집', strokeCount: 6, fiveElement: '토', popularity: 5 },
      { hanja: '佑', reading: '우', meaning: '돕다', strokeCount: 7, fiveElement: '토', popularity: 4 },
      { hanja: '雨', reading: '우', meaning: '비', strokeCount: 8, fiveElement: '수', popularity: 4 },
    ],
  }

  const chars = koreanName.split('')
  return chars.map(char => ({
    korean: char,
    candidates: dummyData[char] || [
      { hanja: '○', reading: char, meaning: '(알 수 없음)', strokeCount: 10, fiveElement: '토' as const, popularity: 3 },
      { hanja: '○', reading: char, meaning: '(알 수 없음)', strokeCount: 8, fiveElement: '목' as const, popularity: 2 },
      { hanja: '○', reading: char, meaning: '(알 수 없음)', strokeCount: 12, fiveElement: '수' as const, popularity: 1 },
    ],
  }))
}

// 한자의 부수 기반 오행 판단
function getHanjaElement(hanja: string): '목' | '화' | '토' | '금' | '수' {
  // 木(나무) 계열
  const woodChars = '木林森桂柳松柏梅楊榮植根株枝板材棟樑朴李梁柱楓橋權柄極束杏杜'
  // 火(불) 계열
  const fireChars = '火炎燃煙熱焰炳煥熙燦炫照燈烈煌熏炤焄煜'
  // 土(흙) 계열
  const earthChars = '土地坤城堡墓境基坊坪塔堂壁塗墳壤均坦培'
  // 金(쇠) 계열
  const metalChars = '金銀銅鐵鋼錫鍾鏡錦鑫鋒鍊銳鎭鑄錫'
  // 水(물) 계열
  const waterChars = '水河海洋湖泉江波浪泳沐洪淳洙淵溪潤澤清涼沈汪'

  if (woodChars.includes(hanja)) return '목'
  if (fireChars.includes(hanja)) return '화'
  if (earthChars.includes(hanja)) return '토'
  if (metalChars.includes(hanja)) return '금'
  if (waterChars.includes(hanja)) return '수'

  // 기본값: 토
  return '토'
}

function generateDummyAnalysisResult(
  surname: string,
  surnameHanja: string,
  koreanName: string,
  selectedHanja: SelectedHanja[],
  surnameStrokes: number
): NameAnalysisResult {
  const elements: ('목' | '화' | '토' | '금' | '수')[] = ['목', '화', '토', '금', '수']
  const icons: Record<string, string> = { 목: '🌲', 화: '🔥', 토: '⛰️', 금: '⚔️', 수: '💧' }

  // 성씨 오행 판단
  const surnameElement = getHanjaElement(surnameHanja)

  // 더미 캐릭터 데이터 (새 구조: interpretation + symbolism + elementReason)
  const dummyInterpretations = [
    {
      meaning: '헤엄치다, 물에서 나아가다',
      interpretation: '단순히 "물놀이" 느낌이 아니라, 물속에서 방향을 잡고 전진하는 능력을 뜻합니다. 환경(물이라는 매체)에 적응하며 움직이는 힘이 핵심입니다.',
      symbolism: '유연함 + 생존력 + 꾸준한 전진. 물은 장애물을 "부수기"보다 "돌아가며" 길을 내잖아요. 그래서 융통성, 대응력, 지속성 쪽 의미가 강합니다.',
      fiveElement: '수' as const,
      elementReason: '氵(삼수변) = 水(물). 자형 자체가 물의 성질(유연/흐름/적응)을 강하게 띱니다.',
    },
    {
      meaning: '심다, 세우다, 뿌리내리게 하다',
      interpretation: '"나무를 심다"의 그 심다가 맞아요. 기반을 만들고, 성장시키고, 정착시키는 힘을 의미합니다. 당장의 결과보다 장기적으로 키우는 사람이라는 뜻이 붙기 쉽습니다.',
      symbolism: '기반(토대) + 확장(성장) + 안정(정착). 단기 성과보다 장기적으로 뿌리내리며 성장하는 타입입니다.',
      fiveElement: '목' as const,
      elementReason: '木(나무) + 直(곧을 직) 구조. 심다/뿌리내리다/성장이라 목(木) 성향이 명확합니다.',
    },
    {
      meaning: '밝다, 빛나다, 분명하다',
      interpretation: '해(日)와 달(月)이 함께 비추는 모습입니다. 어둠 속에서도 길을 찾는 통찰력과 사물의 본질을 꿰뚫어 보는 지혜를 의미합니다.',
      symbolism: '통찰력 + 지혜 + 본질 파악. 복잡한 상황에서 핵심을 짚어내는 눈이 있어요. 애매한 걸 싫어하고 명확함을 추구합니다.',
      fiveElement: '화' as const,
      elementReason: '日(해) + 月(달) = 밝음. 빛과 열을 발하는 성질로 화(火) 성향입니다.',
    },
    {
      meaning: '빼어나다, 뛰어나다, 꽃피다',
      interpretation: '벼이삭이 탐스럽게 익어가는 모습입니다. 재능이 자연스럽게 드러나고 빛을 발하는 상태를 나타냅니다. 억지로 뽐내지 않아도 실력으로 인정받는 사람이에요.',
      symbolism: '재능 + 자연스러운 탁월함 + 인정. 곡식이 익듯 때가 되면 드러나는 실력파 이미지입니다.',
      fiveElement: '목' as const,
      elementReason: '禾(벼 화) 부수. 곡식/성장하는 식물 계열로 목(木) 성향입니다.',
    },
  ]

  const characters: HanjaCharacter[] = selectedHanja.map((h, i) => {
    const dummy = dummyInterpretations[i % dummyInterpretations.length]!
    return {
      korean: h.korean,
      hanja: h.hanja,
      meaning: dummy.meaning,
      interpretation: dummy.interpretation,
      symbolism: dummy.symbolism,
      fiveElement: dummy.fiveElement,
      elementReason: dummy.elementReason,
      strokeCount: 10 + i,
    }
  })

  // 오격 계산용 데이터
  const nameCharsForOgyeok = characters.map(c => ({
    char: c.korean,
    hanja: c.hanja,
    strokes: c.strokeCount,
  }))
  const ogyeokScores = calculateOgyeok(surname, surnameHanja, surnameStrokes, nameCharsForOgyeok)

  // 전체 오행 리스트 (성씨 포함)
  const allElements = [surnameElement, ...characters.map(c => c.fiveElement)]
  const totalCount = allElements.length

  const distribution: FiveElementCard[] = elements.map(el => {
    const count = allElements.filter(e => e === el).length
    return {
      element: el,
      count,
      percentage: Math.round((count / totalCount) * 100) || 0,
      personality: `${el}의 기운은 ${el === '목' ? '성장과 창의성' : el === '화' ? '열정과 활력' : el === '토' ? '안정과 신뢰' : el === '금' ? '결단력과 정의' : '지혜와 유연함'}을 부여합니다.`,
      icon: icons[el] || '✨',
    }
  })

  const avgScore = Math.round((ogyeokScores.천격.score + ogyeokScores.인격.score + ogyeokScores.지격.score + ogyeokScores.외격.score + ogyeokScores.총격.score) / 5)

  // 가장 많은 오행과 부족한 오행 계산
  const sortedDist = [...distribution].sort((a, b) => b.count - a.count)
  const dominantElement = sortedDist[0]?.element || '목'
  const lackingElement = sortedDist.find(d => d.count === 0)?.element || null

  return {
    characters,
    combinedMeaning: `${surname}${koreanName}이라는 이름은 영광스럽게 뿌리내리며 성장하는 사람을 상징합니다. 물처럼 유연하게 흐르면서도 나무처럼 단단히 자리잡는 조화로운 기운을 담고 있습니다.`,
    lifeInterpretation: {
      love: '감정 표현이 부드러우면서도 관계를 오래 키우는 성향입니다. 상대방을 이해하고 배려하는 마음이 깊어 좋은 인연을 만날 수 있습니다.',
      career: '새로운 환경에 빠르게 적응하며, 시스템과 기반을 구축하는 데 강점이 있습니다. 꾸준한 노력으로 성과를 이루는 타입입니다.',
      relationships: '처음에는 유연하게 다가가지만, 관계가 깊어질수록 책임감 있게 행동합니다. 신뢰를 쌓는 데 능숙합니다.',
    },
    fiveElements: {
      distribution,
      harmony: {
        type: '상생',
        description: '수(水)가 목(木)을 키우고, 목(木)이 화(火)를 생성하는 상생 구조로, 자연스러운 성장과 발전의 흐름을 가지고 있습니다.',
        advice: lackingElement ? `${lackingElement}(${lackingElement === '금' ? '金' : lackingElement === '목' ? '木' : lackingElement === '화' ? '火' : lackingElement === '토' ? '土' : '水'})의 기운을 보완하면 더욱 균형 잡힌 삶을 살 수 있습니다.` : '오행이 잘 갖춰져 있어 균형 잡힌 기운을 가지고 있습니다.',
      },
      dominant: dominantElement,
      lacking: lackingElement,
      surnameElement,
    },
    ogyeokScores,
    // 닉네임 선정: 주오행 + 오격 기반 타입
    nickname: selectNickname(dominantElement, determineNicknameType(ogyeokScores)),
    shareable: {
      nickname: selectNickname(dominantElement, determineNicknameType(ogyeokScores)).name,
      keywords: ['번영', '성장', '지혜'],
      hashtags: ['#번영운', `#${dominantElement}오행`, '#성장형인간'],
      oneLineQuote: selectNickname(dominantElement, determineNicknameType(ogyeokScores)).quote,
    },
    overallScore: avgScore,
    overallGrade: avgScore >= 85 ? '대길' : avgScore >= 70 ? '길' : avgScore >= 55 ? '중길' : avgScore >= 40 ? '소길' : '평',
    summary: `${surname}${koreanName}님의 이름은 전체적으로 ${avgScore >= 70 ? '좋은' : '무난한'} 기운을 담고 있습니다. 특히 인격(${ogyeokScores.인격.label})과 총격(${ogyeokScores.총격.label})이 ${ogyeokScores.인격.score >= 70 && ogyeokScores.총격.score >= 70 ? '모두 좋아' : '조화를 이루어'} 안정적인 인생을 살아갈 수 있습니다.`,
    advice: '당신의 이름이 가진 성장의 기운을 믿고, 꾸준히 노력하면 원하는 목표를 이룰 수 있습니다. 물처럼 유연하게, 나무처럼 단단하게!',
  }
}

// ============================================
// 메인 함수들
// ============================================

export async function suggestHanja(koreanName: string): Promise<HanjaCandidates[]> {
  if (USE_DUMMY_DATA) {
    console.log('[NAME] 더미 데이터 모드 - 한자 후보 제안')
    await new Promise(resolve => setTimeout(resolve, 500))
    return generateDummyHanjaSuggestions(koreanName)
  }

  const prompt = buildHanjaSuggestionPrompt(koreanName)

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: '당신은 한국 작명 전문가입니다. 항상 유효한 JSON 형식으로만 응답합니다.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI 응답이 비어있습니다')
  }

  try {
    const result = JSON.parse(content) as { suggestions: HanjaCandidates[] }
    return result.suggestions
  } catch {
    console.error('[NAME] 한자 후보 파싱 실패, 더미 데이터 사용')
    return generateDummyHanjaSuggestions(koreanName)
  }
}

export async function analyzeName(
  surname: string,
  surnameHanja: string,
  koreanName: string,
  selectedHanja: SelectedHanja[]
): Promise<NameAnalysisResult> {
  // 성씨 획수 (간단히 추정 - 실제로는 한자 획수 DB 필요)
  const surnameStrokes = getSurnameStrokes(surnameHanja)

  if (USE_DUMMY_DATA) {
    console.log('[NAME] 더미 데이터 모드 - 이름 분석')
    await new Promise(resolve => setTimeout(resolve, 1500))
    return generateDummyAnalysisResult(surname, surnameHanja, koreanName, selectedHanja, surnameStrokes)
  }

  // 이름 글자별 획수 미리 계산 (프롬프트에 넘기기 위해)
  const nameStrokes = selectedHanja.map(h => getHanjaStrokes(h.hanja))

  const prompt = buildNameAnalysisPrompt(surname, surnameHanja, koreanName, selectedHanja, surnameStrokes, nameStrokes)

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.3,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: '당신은 40년 경력의 작명/성명학 전문가입니다. 항상 유효한 JSON 형식으로만 응답합니다.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI 응답이 비어있습니다')
  }

  try {
    // GPT 응답 파싱 (strokeCount, distribution, nickname 등은 서버에서 계산)
    const gptResult = JSON.parse(content) as {
      surnameCharacter?: {
        fiveElement: '목' | '화' | '토' | '금' | '수'
        elementReason: string
      }
      characters: Array<{
        korean: string
        hanja: string
        meaning: string
        interpretation: string
        symbolism: string
        fiveElement: '목' | '화' | '토' | '금' | '수'
        elementReason: string
        strokeCount?: number  // GPT가 제공하면 사용, 없으면 서버에서 조회
      }>
      combinedMeaning: string
      lifeInterpretation: {
        love: string
        career: string
        relationships: string
      }
      fiveElements: {
        harmony: {
          type: '상생' | '상극' | '균형' | '편중'
          description: string
          advice: string
        }
      }
      ogyeok?: {
        천격: { interpretation: string }
        인격: { interpretation: string }
        지격: { interpretation: string }
        외격: { interpretation: string }
        총격: { interpretation: string }
      }
      shareable: {
        keywords: string[]
        hashtags: string[]
      }
      overallScore: number
      overallGrade: '대길' | '길' | '중길' | '소길' | '평'
      summary: string
      advice: string
    }

    // 1) GPT가 성씨를 characters에 포함해서 반환할 수 있으므로 제거
    const givenNameChars = gptResult.characters.filter(c => c.hanja !== surnameHanja)

    // 2) 각 글자에 획수 추가 (GPT가 제공하지 않으면 서버 DB에서 조회)
    const charactersWithStrokes = givenNameChars.map((c, idx) => ({
      ...c,
      strokeCount: c.strokeCount || getHanjaStrokes(selectedHanja[idx]?.hanja || c.hanja),
    }))

    // 3) 오격 계산 (서버에서) + GPT 해석 병합
    const nameCharsForOgyeok = charactersWithStrokes.map(c => ({
      char: c.korean,
      hanja: c.hanja,
      strokes: c.strokeCount,
    }))
    const ogyeokScores = calculateOgyeok(surname, surnameHanja, surnameStrokes, nameCharsForOgyeok)

    // GPT 오격 해석 병합
    if (gptResult.ogyeok) {
      ogyeokScores.천격.interpretation = gptResult.ogyeok.천격?.interpretation || ''
      ogyeokScores.인격.interpretation = gptResult.ogyeok.인격?.interpretation || ''
      ogyeokScores.지격.interpretation = gptResult.ogyeok.지격?.interpretation || ''
      ogyeokScores.외격.interpretation = gptResult.ogyeok.외격?.interpretation || ''
      ogyeokScores.총격.interpretation = gptResult.ogyeok.총격?.interpretation || ''
    }

    // 4) 오행 분포 계산 (서버에서, 성씨 포함)
    // 성씨 오행: GPT 분석 결과 우선, 없으면 fallback
    const surnameElement = gptResult.surnameCharacter?.fiveElement || getHanjaElement(surnameHanja)
    const surnameElementReason = gptResult.surnameCharacter?.elementReason || ''
    const allElements = [surnameElement, ...charactersWithStrokes.map(c => c.fiveElement)]
    const totalCount = allElements.length
    const elements: ('목' | '화' | '토' | '금' | '수')[] = ['목', '화', '토', '금', '수']
    const icons: Record<string, string> = { 목: '🌲', 화: '🔥', 토: '⛰️', 금: '⚔️', 수: '💧' }
    const personalities: Record<string, string> = {
      목: '성장과 창의성, 새로운 시작의 기운',
      화: '열정과 활력, 표현력의 기운',
      토: '안정과 신뢰, 중심을 잡는 기운',
      금: '결단력과 정의, 판단력의 기운',
      수: '지혜와 유연함, 적응력의 기운',
    }

    const distribution = elements.map(el => {
      const count = allElements.filter(e => e === el).length
      return {
        element: el,
        count,
        percentage: Math.round((count / totalCount) * 100) || 0,
        personality: personalities[el] || `${el}의 기운`,
        icon: icons[el] || '✨',
      }
    })

    // 가장 많은 오행과 부족한 오행
    const sortedDist = [...distribution].sort((a, b) => b.count - a.count)
    const dominantElement = sortedDist[0]?.element || '목'
    const lackingElement = sortedDist.find(d => d.count === 0)?.element || null

    // 5) 닉네임 선정 (25개 고정 닉네임 중)
    const nicknameInfo = selectNickname(dominantElement, determineNicknameType(ogyeokScores))

    // 6) 최종 결과 조합
    return {
      characters: charactersWithStrokes,
      combinedMeaning: gptResult.combinedMeaning,
      lifeInterpretation: gptResult.lifeInterpretation,
      fiveElements: {
        distribution,
        harmony: gptResult.fiveElements.harmony,
        dominant: dominantElement,
        lacking: lackingElement,
        surnameElement,
        surnameElementReason,
      },
      ogyeokScores,
      nickname: nicknameInfo,
      shareable: {
        keywords: gptResult.shareable.keywords,
        hashtags: gptResult.shareable.hashtags,
        nickname: nicknameInfo.name,
        oneLineQuote: nicknameInfo.quote,
      },
      overallScore: gptResult.overallScore,
      overallGrade: gptResult.overallGrade,
      summary: gptResult.summary,
      advice: gptResult.advice,
    }
  } catch (error) {
    console.error('[NAME] 이름 분석 파싱 실패:', error)
    console.error('[NAME] 더미 데이터로 대체')
    return generateDummyAnalysisResult(surname, surnameHanja, koreanName, selectedHanja, surnameStrokes)
  }
}

// ============================================
// 한자 획수 DB (성씨 + 이름용 한자, 중복 제거)
// ============================================

const HANJA_STROKES: Record<string, number> = {
  // === 성씨 ===
  金: 8, 李: 7, 朴: 6, 崔: 11, 鄭: 15, 姜: 9, 趙: 14, 尹: 4,
  張: 11, 林: 8, 韓: 17, 吳: 7, 申: 5, 徐: 10, 權: 22, 黃: 12,
  安: 6, 宋: 7, 柳: 9, 洪: 9, 全: 6, 高: 10, 文: 4, 孫: 10,
  梁: 11, 曺: 11, 裵: 14, 白: 5, 許: 11, 劉: 15, 南: 9, 沈: 7,
  盧: 16, 河: 8, 郭: 11, 成: 6, 車: 7, 朱: 6, 禹: 9, 具: 8,
  愼: 13, 任: 6, 田: 5, 閔: 12, 兪: 9, 羅: 19, 蔡: 14, 元: 4,

  // === 이름용 한자 (자주 사용) ===
  佳: 8, 嘉: 14, 可: 5, 加: 5, 家: 10, 珂: 9, 歌: 14,
  强: 11, 康: 11, 剛: 10, 慶: 15, 景: 12, 京: 8, 敬: 12,
  建: 9, 健: 11, 乾: 11, 堅: 11, 見: 7, 賢: 15,
  恭: 10, 公: 4, 功: 5, 光: 6, 廣: 15, 國: 11, 君: 7,
  根: 10, 近: 7, 勤: 13, 琴: 12, 今: 4, 錦: 16,
  基: 11, 起: 10, 紀: 9, 奇: 8, 己: 3, 氣: 10, 祺: 12,
  娜: 9, 那: 6, 拏: 9, 楠: 13, 男: 7, 暖: 13,
  多: 6, 大: 3, 代: 5, 德: 15, 道: 12, 都: 11, 東: 8, 棟: 12,
  敦: 12, 惇: 11, 頓: 13,
  來: 8, 樂: 15, 蘭: 19, 浪: 10, 朗: 10, 良: 7, 亮: 9,
  麗: 19, 禮: 17, 蓮: 15, 連: 10, 烈: 10, 列: 6, 廉: 13,
  玲: 9, 靈: 24, 領: 14, 令: 5, 嶺: 17,
  路: 13, 露: 21, 魯: 15, 錄: 16, 綠: 14, 祿: 12, 龍: 16, 隆: 11,
  萬: 13, 滿: 14, 晩: 11, 曼: 11,
  明: 8, 銘: 14, 茗: 9, 命: 8, 名: 6,
  美: 9, 米: 6, 敏: 11, 民: 5, 旻: 8, 玟: 8,
  武: 8, 茂: 8, 務: 11, 墓: 13, 慕: 14, 夢: 13, 蒙: 13,
  博: 12, 泊: 8, 薄: 16, 範: 15, 凡: 3, 帆: 6,
  福: 13, 復: 12, 服: 8, 伏: 6, 本: 5, 奔: 8,
  丙: 5, 炳: 9, 秉: 8, 寶: 20, 普: 12, 保: 9, 報: 12, 步: 7, 甫: 7,
  思: 9, 史: 5, 士: 3, 師: 10, 斯: 12, 祀: 8,
  尙: 8, 常: 11, 商: 11, 想: 13, 相: 9, 祥: 10, 象: 12, 翔: 12,
  瑞: 13, 書: 10, 舒: 12, 序: 7, 敍: 11, 緒: 14, 西: 6, 庶: 11,
  善: 12, 先: 6, 仙: 5, 宣: 9, 鮮: 17, 禪: 16, 選: 15, 線: 15,
  世: 5, 勢: 13, 細: 11, 歲: 13,
  小: 3, 少: 4, 紹: 11, 昭: 9, 召: 5, 韶: 14,
  秀: 7, 壽: 14, 洙: 9, 樹: 16, 守: 6, 受: 8, 水: 4, 修: 10, 瘦: 14,
  淑: 11, 叔: 8, 肅: 11, 宿: 11, 熟: 15,
  承: 8, 勝: 12, 昇: 8, 升: 4, 繩: 19,
  時: 10, 是: 9, 始: 8, 市: 5, 試: 13, 詩: 13, 施: 9,
  信: 9, 新: 13, 辛: 7, 紳: 11, 神: 9,
  兒: 8, 我: 7, 牙: 4, 芽: 7, 雅: 12, 阿: 7, 亞: 7,
  岸: 8, 晏: 10, 案: 10, 顔: 18,
  愛: 13, 哀: 9, 曖: 17, 隘: 12,
  野: 11, 也: 3, 夜: 8, 耶: 9,
  陽: 12, 養: 15, 洋: 9, 揚: 12, 楊: 13, 樣: 15, 讓: 24,
  語: 14, 魚: 11, 御: 11, 漁: 14, 於: 8,
  彦: 9, 言: 7, 延: 7, 然: 12, 演: 14, 緣: 15, 燕: 16, 軟: 11,
  榮: 14, 永: 5, 英: 8, 泳: 8, 迎: 7, 映: 9, 盈: 9, 塋: 13, 瑛: 12, 營: 17, 影: 15,
  藝: 18, 譽: 21, 睿: 14, 銳: 15, 預: 13,
  溫: 12, 穩: 19, 蘊: 15, 玉: 5, 沃: 7, 屋: 9, 獄: 14,
  完: 7, 婉: 11, 頑: 13, 玩: 8, 宛: 8,
  旺: 8, 王: 4, 往: 8,
  勇: 9, 容: 10, 用: 5, 庸: 11, 鎔: 18, 溶: 13, 踊: 14,
  佑: 7, 右: 5, 友: 4, 又: 2, 雨: 8, 宇: 6, 羽: 6, 于: 3, 牛: 4, 優: 17,
  雲: 12, 云: 4, 運: 12, 芸: 7,
  園: 13, 員: 10, 院: 10, 原: 10, 遠: 13, 源: 13, 圓: 13, 願: 19, 苑: 8,
  月: 4, 越: 12, 偉: 11, 爲: 9, 緯: 15, 委: 8, 威: 9, 謂: 16, 葦: 12, 維: 14,
  有: 6, 由: 5, 唯: 11, 惟: 11, 遊: 12, 油: 8, 儒: 16, 乳: 8, 柔: 9, 裕: 12, 幽: 9, 悠: 11,
  允: 4, 潤: 15, 閏: 12, 胤: 9, 倫: 10, 輪: 15, 綸: 14,
  乙: 1, 殷: 10, 銀: 14, 隱: 17, 恩: 10, 慇: 14,
  音: 9, 陰: 10, 飮: 12, 吟: 7, 淫: 11, 蔭: 14,
  意: 13, 義: 13, 議: 20, 宜: 8, 疑: 14, 醫: 18, 依: 8, 衣: 6, 異: 11,
  仁: 4, 人: 2, 引: 4, 印: 6, 因: 6, 認: 14, 忍: 7,
  日: 4, 逸: 11, 一: 1,
  子: 3, 字: 6, 慈: 13, 滋: 12, 紫: 12, 姿: 9, 資: 13, 者: 8, 自: 6,
  作: 7, 昨: 9, 酌: 10, 雀: 11,
  章: 11, 壯: 7, 獎: 14, 場: 12, 藏: 17, 障: 14, 臟: 22, 將: 11, 丈: 3, 杖: 7, 莊: 10,
  材: 7, 才: 3, 財: 10, 在: 6, 災: 7, 再: 6, 載: 13, 裁: 12,
  正: 5, 定: 8, 靜: 16, 精: 14, 情: 11, 淨: 11, 晶: 12, 整: 16, 政: 9, 庭: 9, 貞: 9, 程: 12, 亭: 9, 征: 8, 廷: 7, 訂: 9,
  濟: 17, 際: 14, 齊: 14, 第: 11, 祭: 11, 製: 14, 諸: 15, 帝: 9, 提: 12,
  早: 6, 造: 10, 朝: 12, 祖: 9, 兆: 6, 操: 16, 條: 10, 照: 13, 調: 15,
  足: 7, 卒: 8, 尊: 12, 存: 6,
  宗: 8, 從: 11, 終: 11, 綜: 14, 縱: 17, 鍾: 17, 鐘: 20, 種: 14, 腫: 13,
  州: 6, 舟: 6, 注: 8, 主: 5, 周: 8, 洲: 9, 酒: 10, 珠: 10, 住: 7, 株: 10,
  中: 4, 衆: 12, 重: 9, 仲: 6,
  準: 13, 俊: 9, 峻: 10, 浚: 10, 竣: 12, 遵: 15,
  智: 12, 知: 8, 志: 7, 地: 6, 池: 6, 之: 3, 至: 6, 指: 9, 止: 4, 紙: 10, 枝: 8, 芝: 6, 持: 9, 誌: 14,
  珍: 9, 進: 11, 振: 10, 眞: 10, 陳: 10, 津: 9, 鎭: 18, 震: 15, 辰: 7,
  借: 10, 次: 6, 此: 6, 差: 10, 讚: 26, 贊: 19, 燦: 17, 粲: 15,
  昌: 8, 唱: 11, 倡: 10, 廠: 15, 菖: 11, 暢: 14, 蒼: 13, 窓: 11, 彰: 14, 娼: 11, 倉: 10,
  采: 8, 彩: 11, 菜: 11, 債: 13,
  天: 4, 泉: 9, 淺: 11, 千: 3, 川: 3, 穿: 9, 薦: 16, 踐: 15,
  哲: 10, 徹: 15, 轍: 19, 撤: 15, 鐵: 21,
  聽: 22, 聰: 17, 聖: 13, 請: 15, 清: 11, 廳: 25, 靑: 8,
  妻: 8, 初: 7, 招: 8, 楚: 13, 草: 9, 超: 12, 礎: 18,
  寸: 3, 村: 7, 忖: 7, 最: 12, 催: 13,
  秋: 9, 追: 9, 推: 11, 椎: 12, 楸: 13, 抽: 8, 鄒: 12,
  春: 9, 椿: 13, 蠢: 21, 祝: 9, 縮: 17, 築: 16, 軸: 12,
  忠: 8, 衷: 10, 沖: 7, 蟲: 18, 充: 6,
  取: 8, 吹: 7, 趣: 15, 聚: 14, 炊: 8, 醉: 15, 脆: 10,
  層: 15, 治: 8, 致: 10, 緻: 16, 置: 13, 熾: 16, 稚: 13, 恥: 10, 雉: 13,
  親: 16, 七: 2, 漆: 14, 快: 7,
  泰: 9, 態: 14, 駄: 8, 兌: 7, 胎: 9, 怠: 9,
  宅: 6, 擇: 16, 澤: 16, 湯: 12, 唐: 10, 堂: 11, 棠: 12, 糖: 16,
  土: 3, 吐: 6, 討: 10, 套: 10, 統: 11, 通: 10, 筒: 12, 退: 9, 投: 7, 透: 10, 特: 10,
  八: 2, 坡: 8, 波: 8, 派: 9, 破: 10, 頗: 14, 爬: 8, 巴: 4, 把: 7, 播: 15,
  判: 7, 板: 8, 版: 8, 販: 11, 辦: 16,
  敗: 11, 沛: 7, 杯: 8, 盃: 9, 貝: 7, 佩: 8, 牌: 12, 稀: 12, 肺: 8,
  便: 9, 片: 4, 偏: 11, 編: 15, 遍: 12, 篇: 15,
  平: 5, 評: 12, 坪: 8, 苹: 8, 閉: 11, 弊: 15, 幣: 14, 斃: 16,
  布: 5, 怖: 8, 捕: 10, 抱: 8, 浦: 10, 浮: 10, 譜: 19, 簿: 19,
  暴: 15, 爆: 19, 豹: 10, 表: 8, 風: 9, 楓: 13, 豐: 18, 諷: 16, 馮: 12, 品: 9,
  必: 5, 筆: 12, 畢: 11, 匹: 4,
  夏: 10, 荷: 10, 霞: 17, 下: 3, 賀: 12, 何: 7, 遐: 12, 瑕: 13,
  學: 16, 鶴: 21, 壑: 17, 翰: 16, 閑: 12, 閒: 12, 漢: 14, 汗: 6, 寒: 12, 恨: 9, 限: 8, 旱: 7,
  海: 10, 害: 10, 亥: 6, 咳: 9, 該: 13, 孩: 9, 解: 13,
  幸: 8, 行: 6, 杏: 7, 倖: 10, 香: 9, 享: 8, 向: 6, 響: 20, 鄕: 11, 餉: 12, 虛: 11,
  憲: 16, 獻: 20, 軒: 10, 掀: 11, 現: 11, 炫: 9, 弦: 8, 玄: 5, 顯: 23, 縣: 16, 絃: 11, 懸: 20,
  穴: 5, 血: 6, 兄: 5, 刑: 6, 型: 9, 形: 7, 螢: 16, 亨: 7, 衡: 16,
  惠: 12, 慧: 15, 蕙: 15, 兮: 4,
  虎: 8, 護: 20, 戶: 4, 浩: 10, 號: 13, 豪: 14, 鎬: 17, 湖: 12, 胡: 9, 呼: 8, 乎: 5, 壺: 12, 瑚: 13, 弧: 8, 互: 4, 好: 6, 昊: 8,
  弘: 5, 紅: 9, 虹: 9, 鴻: 17, 宏: 7, 泓: 8,
  和: 8, 花: 7, 華: 10, 火: 4, 化: 4, 話: 13, 禍: 13, 禾: 5, 靴: 13, 貨: 11, 畵: 12,
  煥: 13, 桓: 10, 歡: 21, 還: 16, 環: 17, 換: 12, 患: 11, 喚: 12, 奐: 9,
  皇: 9, 凰: 11, 潢: 15, 惶: 12, 遑: 12, 璜: 16, 蝗: 15,
  回: 6, 悔: 10, 會: 13, 懷: 19, 徊: 9, 迴: 9,
  厚: 9, 後: 9, 候: 10, 孝: 7, 效: 10, 曉: 16, 哮: 10,
  薰: 17, 勳: 16, 訓: 10, 暈: 13, 熏: 14, 焄: 12,
  婚: 11, 昏: 8, 混: 11, 魂: 14, 渾: 12, 惛: 11, 興: 16, 凶: 4,
  喜: 12, 熙: 14, 僖: 14, 禧: 16, 嬉: 15, 曦: 20, 煕: 13, 姬: 9, 羲: 16, 希: 7, 欣: 8,
  // 추가 (더미 데이터에서 사용)
  植: 12, 式: 6, 識: 19,
}

// 한자 획수 조회 함수
function getHanjaStrokes(hanja: string): number {
  return HANJA_STROKES[hanja] || 10  // 없으면 기본값 10
}

// 성씨 획수 조회 (하위 호환성 유지)
function getSurnameStrokes(hanja: string): number {
  return getHanjaStrokes(hanja)
}
