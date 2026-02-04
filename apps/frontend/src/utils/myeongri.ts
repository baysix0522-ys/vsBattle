/**
 * 명리학 (Myeongri-hak) 운세 엔진
 *
 * 십신(十神), 합충형파해(合沖刑破害), 12운성(十二運星), 신살(神煞) 분석을 통한
 * 전문적인 사주 기반 운세 분석 시스템
 */

import type { FiveElement, HeavenlyStem } from 'manseryeok'

// ============================================
// 타입 정의
// ============================================

// 지지 타입
export type EarthlyBranch = '자' | '축' | '인' | '묘' | '진' | '사' | '오' | '미' | '신' | '유' | '술' | '해'

// 십신 타입
export type TenGod = '비견' | '겁재' | '식신' | '상관' | '편재' | '정재' | '편관' | '정관' | '편인' | '정인'

// 12운성 타입
export type TwelveStage = '장생' | '목욕' | '관대' | '건록' | '제왕' | '쇠' | '병' | '사' | '묘' | '절' | '태' | '양'

// 합충형파해 타입
export type BranchRelation = '합' | '충' | '형' | '파' | '해' | '삼합' | '방합' | '없음'

// 신살 타입
export type SpiritStar =
  | '천을귀인' | '문창귀인' | '학당귀인' | '태극귀인'  // 길신
  | '천덕귀인' | '월덕귀인' | '삼기귀인' | '복성귀인'
  | '역마살' | '화개살' | '도화살' | '장성살'           // 중성
  | '겁살' | '망신살' | '백호대살' | '천라지망'         // 흉살

// 사주 기둥 타입
export type Pillar = {
  heavenlyStem: HeavenlyStem
  earthlyBranch: EarthlyBranch
}

// 사주 전체 타입
export type FourPillars = {
  year: Pillar
  month: Pillar
  day: Pillar
  hour: Pillar
}

// 십신 분석 결과
export type TenGodAnalysis = {
  yearStem: TenGod
  monthStem: TenGod
  hourStem: TenGod
  yearBranch: TenGod
  monthBranch: TenGod
  dayBranch: TenGod
  hourBranch: TenGod
  dominant: TenGod | null
  balance: 'strong' | 'weak' | 'balanced'
  interpretation: string
}

// 합충형파해 분석 결과
export type BranchRelationAnalysis = {
  relations: {
    pillars: [string, string]
    type: BranchRelation
    effect: 'positive' | 'negative' | 'neutral'
    description: string
  }[]
  todayRelations: {
    pillar: string
    type: BranchRelation
    effect: 'positive' | 'negative' | 'neutral'
    description: string
  }[]
  summary: string
}

// 12운성 분석 결과
export type TwelveStageAnalysis = {
  year: TwelveStage
  month: TwelveStage
  day: TwelveStage
  hour: TwelveStage
  todayStage: TwelveStage
  interpretation: string
}

// 신살 분석 결과
export type SpiritStarAnalysis = {
  present: {
    star: SpiritStar
    type: 'auspicious' | 'inauspicious' | 'neutral'
    description: string
  }[]
  todayActive: SpiritStar[]
  interpretation: string
}

// ============================================
// 기본 데이터 매핑
// ============================================

// 천간 → 오행
export const STEM_TO_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  갑: '목', 을: '목',
  병: '화', 정: '화',
  무: '토', 기: '토',
  경: '금', 신: '금',
  임: '수', 계: '수',
}

// 천간 음양
export const STEM_YIN_YANG: Record<HeavenlyStem, 'yang' | 'yin'> = {
  갑: 'yang', 을: 'yin',
  병: 'yang', 정: 'yin',
  무: 'yang', 기: 'yin',
  경: 'yang', 신: 'yin',
  임: 'yang', 계: 'yin',
}

// 지지 → 오행
export const BRANCH_TO_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  자: '수', 축: '토', 인: '목', 묘: '목',
  진: '토', 사: '화', 오: '화', 미: '토',
  신: '금', 유: '금', 술: '토', 해: '수',
}

// 지지 음양
export const BRANCH_YIN_YANG: Record<EarthlyBranch, 'yang' | 'yin'> = {
  자: 'yang', 축: 'yin', 인: 'yang', 묘: 'yin',
  진: 'yang', 사: 'yin', 오: 'yang', 미: 'yin',
  신: 'yang', 유: 'yin', 술: 'yang', 해: 'yin',
}

// 지지 지장간 (地藏干) - 지지 안에 숨어있는 천간
export const BRANCH_HIDDEN_STEMS: Record<EarthlyBranch, HeavenlyStem[]> = {
  자: ['계'],
  축: ['기', '계', '신'],
  인: ['갑', '병', '무'],
  묘: ['을'],
  진: ['무', '을', '계'],
  사: ['병', '무', '경'],
  오: ['정', '기'],
  미: ['기', '정', '을'],
  신: ['경', '임', '무'],
  유: ['신'],
  술: ['무', '신', '정'],
  해: ['임', '갑'],
}

// 천간 순서 (십간)
export const STEM_ORDER: HeavenlyStem[] = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']

// 지지 순서 (십이지)
export const BRANCH_ORDER: EarthlyBranch[] = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']

// ============================================
// 십신 (十神) 계산
// ============================================

/**
 * 일간 기준 다른 천간의 십신 계산
 */
export function calculateTenGod(dayMaster: HeavenlyStem, targetStem: HeavenlyStem): TenGod {
  const myElement = STEM_TO_ELEMENT[dayMaster]
  const targetElement = STEM_TO_ELEMENT[targetStem]
  const myYinYang = STEM_YIN_YANG[dayMaster]
  const targetYinYang = STEM_YIN_YANG[targetStem]
  const sameYinYang = myYinYang === targetYinYang

  // 오행 관계 확인
  const elementRelation = getElementRelation(myElement, targetElement)

  switch (elementRelation) {
    case 'same':
      return sameYinYang ? '비견' : '겁재'
    case 'generates': // 내가 생
      return sameYinYang ? '식신' : '상관'
    case 'generated': // 나를 생
      return sameYinYang ? '편인' : '정인'
    case 'controls': // 내가 극
      return sameYinYang ? '편재' : '정재'
    case 'controlled': // 나를 극
      return sameYinYang ? '편관' : '정관'
    default:
      return '비견'
  }
}

/**
 * 지지의 지장간 중 본기(本氣)의 십신 계산
 */
export function calculateBranchTenGod(dayMaster: HeavenlyStem, branch: EarthlyBranch): TenGod {
  const hiddenStems = BRANCH_HIDDEN_STEMS[branch]
  const mainStem = hiddenStems[0]! // 본기
  return calculateTenGod(dayMaster, mainStem)
}

/**
 * 오행 간의 관계 확인
 */
function getElementRelation(
  my: FiveElement,
  other: FiveElement
): 'same' | 'generates' | 'generated' | 'controls' | 'controlled' {
  if (my === other) return 'same'

  // 상생 관계 (목→화→토→금→수→목)
  const generatingCycle: Record<FiveElement, FiveElement> = {
    목: '화', 화: '토', 토: '금', 금: '수', 수: '목',
  }
  // 상극 관계 (목→토→수→화→금→목)
  const controllingCycle: Record<FiveElement, FiveElement> = {
    목: '토', 토: '수', 수: '화', 화: '금', 금: '목',
  }

  if (generatingCycle[my] === other) return 'generates'
  if (generatingCycle[other] === my) return 'generated'
  if (controllingCycle[my] === other) return 'controls'
  if (controllingCycle[other] === my) return 'controlled'

  return 'same'
}

// 십신별 특성
export const TEN_GOD_TRAITS: Record<TenGod, {
  keyword: string
  positive: string
  negative: string
  category: 'self' | 'output' | 'wealth' | 'power' | 'resource'
  fortune: {
    love: string
    money: string
    work: string
    health: string
  }
}> = {
  비견: {
    keyword: '동료, 경쟁',
    positive: '자립심과 독립성이 강하며 의지가 굳습니다',
    negative: '고집이 세고 타인과 부딪힐 수 있습니다',
    category: 'self',
    fortune: {
      love: '동등한 관계에서 좋은 인연을 만날 수 있어요',
      money: '공동 투자나 협력 사업에 기회가 있어요',
      work: '팀워크가 중요한 날, 동료와 협력하세요',
      health: '체력은 좋으나 과로에 주의하세요',
    },
  },
  겁재: {
    keyword: '경쟁, 도전',
    positive: '추진력과 승부욕이 강합니다',
    negative: '재물 손실이나 다툼에 주의가 필요합니다',
    category: 'self',
    fortune: {
      love: '경쟁자가 나타날 수 있어요, 관계에 신경 쓰세요',
      money: '충동적인 지출이나 투자를 삼가세요',
      work: '경쟁에서 이기려면 실력으로 승부하세요',
      health: '스트레스 관리가 필요한 시기예요',
    },
  },
  식신: {
    keyword: '표현, 재능',
    positive: '예술적 감각과 표현력이 뛰어납니다',
    negative: '나태해지거나 안일해질 수 있습니다',
    category: 'output',
    fortune: {
      love: '자연스러운 매력이 발산되는 날이에요',
      money: '재능을 살린 부수입의 기회가 있어요',
      work: '창의적인 아이디어가 빛을 발해요',
      health: '맛있는 음식으로 기분 전환해보세요',
    },
  },
  상관: {
    keyword: '창의, 반항',
    positive: '독창적이고 창의력이 넘칩니다',
    negative: '권위에 반항하고 말로 상처를 줄 수 있습니다',
    category: 'output',
    fortune: {
      love: '솔직한 표현이 때로는 독이 될 수 있어요',
      money: '새로운 사업 아이디어를 구상하기 좋아요',
      work: '기존 방식에서 벗어난 접근이 효과적이에요',
      health: '정신적 긴장을 풀 시간이 필요해요',
    },
  },
  편재: {
    keyword: '투자, 활동',
    positive: '사업 수완과 활동력이 뛰어납니다',
    negative: '투기적 성향이나 방탕에 주의가 필요합니다',
    category: 'wealth',
    fortune: {
      love: '활발한 사교 활동에서 인연을 만날 수 있어요',
      money: '투자 기회가 있지만 신중한 판단이 필요해요',
      work: '적극적인 영업이나 외부 활동이 유리해요',
      health: '과음이나 과식에 주의하세요',
    },
  },
  정재: {
    keyword: '안정, 저축',
    positive: '근면하고 착실하며 재물 관리를 잘합니다',
    negative: '소심하거나 인색해질 수 있습니다',
    category: 'wealth',
    fortune: {
      love: '진실되고 안정적인 관계가 형성돼요',
      money: '꾸준한 저축과 관리가 결실을 맺어요',
      work: '정해진 업무를 성실히 수행하면 인정받아요',
      health: '규칙적인 생활이 건강의 비결이에요',
    },
  },
  편관: {
    keyword: '권위, 도전',
    positive: '리더십과 결단력이 있습니다',
    negative: '독단적이거나 급진적일 수 있습니다',
    category: 'power',
    fortune: {
      love: '강한 끌림을 느끼는 인연이 나타날 수 있어요',
      money: '위험을 감수한 투자는 삼가세요',
      work: '책임감 있는 역할을 맡을 기회가 와요',
      health: '과로나 스트레스로 건강을 해칠 수 있어요',
    },
  },
  정관: {
    keyword: '명예, 책임',
    positive: '정직하고 책임감이 강합니다',
    negative: '융통성이 부족하고 경직될 수 있습니다',
    category: 'power',
    fortune: {
      love: '진지하고 책임감 있는 만남이 이루어져요',
      money: '정당한 노력의 대가가 돌아와요',
      work: '승진이나 인정을 받을 기회가 있어요',
      health: '정신적 부담을 덜어내는 게 중요해요',
    },
  },
  편인: {
    keyword: '학문, 고독',
    positive: '탐구심과 통찰력이 뛰어납니다',
    negative: '고독하거나 비현실적이 될 수 있습니다',
    category: 'resource',
    fortune: {
      love: '정신적 교감을 나눌 수 있는 인연이 좋아요',
      money: '지식이나 기술을 재물로 연결하세요',
      work: '연구나 분석 업무에서 성과가 나와요',
      health: '정신적 안정이 신체 건강에 영향을 줘요',
    },
  },
  정인: {
    keyword: '학습, 보호',
    positive: '학습 능력과 인자함이 있습니다',
    negative: '의존적이거나 우유부단해질 수 있습니다',
    category: 'resource',
    fortune: {
      love: '믿고 의지할 수 있는 관계가 발전해요',
      money: '자격증이나 학위가 재물로 연결돼요',
      work: '배움을 통해 역량을 키우는 시기예요',
      health: '어른이나 전문가의 조언을 참고하세요',
    },
  },
}

// ============================================
// 합충형파해 (合沖刑破害) 분석
// ============================================

// 육합 (六合) - 지지 간의 합
const SIX_HARMONIES: [EarthlyBranch, EarthlyBranch][] = [
  ['자', '축'], ['인', '해'], ['묘', '술'],
  ['진', '유'], ['사', '신'], ['오', '미'],
]

// 삼합 (三合) - 세 지지가 합
const THREE_HARMONIES: [EarthlyBranch, EarthlyBranch, EarthlyBranch][] = [
  ['인', '오', '술'], // 화국
  ['사', '유', '축'], // 금국
  ['신', '자', '진'], // 수국
  ['해', '묘', '미'], // 목국
]

// 방합 (方合) - 같은 방향의 지지가 합
const DIRECTIONAL_HARMONIES: [EarthlyBranch, EarthlyBranch, EarthlyBranch][] = [
  ['인', '묘', '진'], // 동방 목국
  ['사', '오', '미'], // 남방 화국
  ['신', '유', '술'], // 서방 금국
  ['해', '자', '축'], // 북방 수국
]

// 충 (沖) - 지지 간의 충돌
const CLASHES: [EarthlyBranch, EarthlyBranch][] = [
  ['자', '오'], ['축', '미'], ['인', '신'],
  ['묘', '유'], ['진', '술'], ['사', '해'],
]

// 형 (刑) - 지지 간의 형
const PUNISHMENTS: [EarthlyBranch, EarthlyBranch][] = [
  ['인', '사'], ['사', '신'], // 무은지형
  ['축', '술'], ['술', '미'], ['미', '축'], // 지세지형
  ['자', '묘'], // 무례지형
  ['진', '진'], ['오', '오'], ['유', '유'], ['해', '해'], // 자형
]

// 파 (破) - 지지 간의 파
const DESTRUCTIONS: [EarthlyBranch, EarthlyBranch][] = [
  ['자', '유'], ['축', '진'], ['인', '해'],
  ['묘', '오'], ['사', '신'], ['미', '술'],
]

// 해 (害) - 지지 간의 해
const HARMS: [EarthlyBranch, EarthlyBranch][] = [
  ['자', '미'], ['축', '오'], ['인', '사'],
  ['묘', '진'], ['신', '해'], ['유', '술'],
]

/**
 * 두 지지 간의 관계 확인
 */
export function checkBranchRelation(branch1: EarthlyBranch, branch2: EarthlyBranch): BranchRelation {
  // 육합 체크
  for (const [a, b] of SIX_HARMONIES) {
    if ((branch1 === a && branch2 === b) || (branch1 === b && branch2 === a)) {
      return '합'
    }
  }

  // 충 체크
  for (const [a, b] of CLASHES) {
    if ((branch1 === a && branch2 === b) || (branch1 === b && branch2 === a)) {
      return '충'
    }
  }

  // 형 체크
  for (const [a, b] of PUNISHMENTS) {
    if ((branch1 === a && branch2 === b) || (branch1 === b && branch2 === a)) {
      return '형'
    }
  }

  // 파 체크
  for (const [a, b] of DESTRUCTIONS) {
    if ((branch1 === a && branch2 === b) || (branch1 === b && branch2 === a)) {
      return '파'
    }
  }

  // 해 체크
  for (const [a, b] of HARMS) {
    if ((branch1 === a && branch2 === b) || (branch1 === b && branch2 === a)) {
      return '해'
    }
  }

  return '없음'
}

/**
 * 삼합 체크
 */
export function checkThreeHarmony(branches: EarthlyBranch[]): FiveElement | null {
  const branchSet = new Set(branches)

  for (const harmony of THREE_HARMONIES) {
    if (harmony.every(b => branchSet.has(b))) {
      // 삼합의 결과 오행 반환
      if (harmony.includes('인') && harmony.includes('오') && harmony.includes('술')) return '화'
      if (harmony.includes('사') && harmony.includes('유') && harmony.includes('축')) return '금'
      if (harmony.includes('신') && harmony.includes('자') && harmony.includes('진')) return '수'
      if (harmony.includes('해') && harmony.includes('묘') && harmony.includes('미')) return '목'
    }
  }
  return null
}

// 합충형파해 설명
export const BRANCH_RELATION_DESCRIPTIONS: Record<BranchRelation, {
  name: string
  effect: 'positive' | 'negative' | 'neutral'
  general: string
  fortune: {
    love: string
    money: string
    work: string
    health: string
  }
}> = {
  합: {
    name: '합',
    effect: 'positive',
    general: '조화와 협력의 기운이 있습니다',
    fortune: {
      love: '좋은 인연이 맺어지거나 관계가 깊어져요',
      money: '협력을 통한 재물 기회가 있어요',
      work: '파트너십이 빛을 발하는 시기예요',
      health: '마음이 편안하고 기운이 좋아요',
    },
  },
  충: {
    name: '충',
    effect: 'negative',
    general: '변화와 충돌의 기운이 있습니다',
    fortune: {
      love: '갈등이나 이별의 기운이 있어요, 대화가 필요해요',
      money: '예상치 못한 지출이나 손실에 주의하세요',
      work: '업무 변동이나 갈등 상황이 생길 수 있어요',
      health: '사고나 부상에 주의가 필요해요',
    },
  },
  형: {
    name: '형',
    effect: 'negative',
    general: '시련과 고난의 기운이 있습니다',
    fortune: {
      love: '오해나 마찰이 생기기 쉬워요',
      money: '법적 문제나 분쟁에 주의하세요',
      work: '직장 내 갈등이나 불이익이 있을 수 있어요',
      health: '건강 검진이나 관리가 필요한 시기예요',
    },
  },
  파: {
    name: '파',
    effect: 'negative',
    general: '파괴와 단절의 기운이 있습니다',
    fortune: {
      love: '관계의 위기가 올 수 있어요',
      money: '계획이 틀어지거나 손해를 볼 수 있어요',
      work: '기존 계획을 재검토해야 할 수 있어요',
      health: '피로 누적에 주의하세요',
    },
  },
  해: {
    name: '해',
    effect: 'negative',
    general: '방해와 장애의 기운이 있습니다',
    fortune: {
      love: '질투나 방해꾼이 나타날 수 있어요',
      money: '사기나 배신에 주의가 필요해요',
      work: '뒤에서 방해하는 사람이 있을 수 있어요',
      health: '음식이나 환경으로 인한 문제에 주의하세요',
    },
  },
  삼합: {
    name: '삼합',
    effect: 'positive',
    general: '강력한 결합과 성취의 기운입니다',
    fortune: {
      love: '운명적인 만남이 이루어질 수 있어요',
      money: '큰 재물 기회가 찾아올 수 있어요',
      work: '팀워크로 큰 성과를 이룰 수 있어요',
      health: '활력이 넘치고 컨디션이 좋아요',
    },
  },
  방합: {
    name: '방합',
    effect: 'positive',
    general: '같은 방향의 힘이 모이는 기운입니다',
    fortune: {
      love: '비슷한 가치관의 인연을 만나요',
      money: '집중된 노력이 성과로 이어져요',
      work: '전문성이 인정받는 시기예요',
      health: '특정 부위의 건강에 신경 쓰세요',
    },
  },
  없음: {
    name: '없음',
    effect: 'neutral',
    general: '특별한 작용이 없는 무난한 관계입니다',
    fortune: {
      love: '평온한 하루가 될 거예요',
      money: '큰 변동 없이 무난해요',
      work: '계획대로 진행하면 돼요',
      health: '무난한 컨디션이에요',
    },
  },
}

// ============================================
// 12운성 (十二運星) 계산
// ============================================

// 12운성 순서
const TWELVE_STAGES_ORDER: TwelveStage[] = [
  '장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양',
]

// 천간별 12운성 시작점 (장생 위치)
const TWELVE_STAGE_START: Record<HeavenlyStem, EarthlyBranch> = {
  갑: '해', 을: '오', // 목
  병: '인', 정: '유', // 화
  무: '인', 기: '유', // 토 (화를 따름)
  경: '사', 신: '자', // 금
  임: '신', 계: '묘', // 수
}

/**
 * 일간 기준 특정 지지의 12운성 계산
 */
export function calculateTwelveStage(dayMaster: HeavenlyStem, branch: EarthlyBranch): TwelveStage {
  const startBranch = TWELVE_STAGE_START[dayMaster]
  const startIndex = BRANCH_ORDER.indexOf(startBranch)
  const targetIndex = BRANCH_ORDER.indexOf(branch)

  // 양간은 순행, 음간은 역행
  const isYang = STEM_YIN_YANG[dayMaster] === 'yang'

  let diff: number
  if (isYang) {
    diff = (targetIndex - startIndex + 12) % 12
  } else {
    diff = (startIndex - targetIndex + 12) % 12
  }

  return TWELVE_STAGES_ORDER[diff]!
}

// 12운성별 특성
export const TWELVE_STAGE_TRAITS: Record<TwelveStage, {
  energy: number  // 1-5 에너지 레벨
  keyword: string
  description: string
  fortune: {
    general: string
    advice: string
  }
}> = {
  장생: {
    energy: 4,
    keyword: '시작, 탄생',
    description: '새로운 시작의 기운, 가능성이 열리는 때',
    fortune: {
      general: '새로운 출발을 하기 좋은 날이에요',
      advice: '새로운 일을 시작하거나 계획을 세워보세요',
    },
  },
  목욕: {
    energy: 3,
    keyword: '성장, 불안정',
    description: '성장하지만 불안정한 시기, 유혹에 주의',
    fortune: {
      general: '배움과 성장의 기회가 있어요',
      advice: '유혹이나 충동적인 결정을 조심하세요',
    },
  },
  관대: {
    energy: 4,
    keyword: '성장, 인정',
    description: '사회적 인정을 받기 시작하는 때',
    fortune: {
      general: '능력을 인정받을 수 있는 날이에요',
      advice: '적극적으로 자신을 표현해보세요',
    },
  },
  건록: {
    energy: 5,
    keyword: '전성, 활동',
    description: '가장 활발하고 바쁜 시기',
    fortune: {
      general: '활발한 활동으로 성과를 내기 좋아요',
      advice: '적극적으로 움직이면 좋은 결과가 있어요',
    },
  },
  제왕: {
    energy: 5,
    keyword: '절정, 정점',
    description: '기운이 가장 강한 절정의 시기',
    fortune: {
      general: '최고의 컨디션과 운세를 기대할 수 있어요',
      advice: '자신감을 가지고 도전하세요',
    },
  },
  쇠: {
    energy: 3,
    keyword: '하강, 쉼',
    description: '기운이 수그러들기 시작하는 때',
    fortune: {
      general: '무리하지 말고 현상 유지가 좋아요',
      advice: '새로운 시작보다 마무리에 집중하세요',
    },
  },
  병: {
    energy: 2,
    keyword: '약화, 휴식',
    description: '기운이 약해지는 시기, 휴식 필요',
    fortune: {
      general: '건강과 휴식에 신경 쓰세요',
      advice: '무리한 일정은 피하고 재충전하세요',
    },
  },
  사: {
    energy: 1,
    keyword: '종결, 마무리',
    description: '하나의 주기가 끝나는 때',
    fortune: {
      general: '끝맺음을 잘 해야 할 때예요',
      advice: '미련을 버리고 깔끔히 정리하세요',
    },
  },
  묘: {
    energy: 1,
    keyword: '잠복, 저장',
    description: '기운이 숨어드는 시기, 내면 성찰',
    fortune: {
      general: '내면을 돌아보고 성찰하기 좋아요',
      advice: '밖으로 나서기보다 내실을 다지세요',
    },
  },
  절: {
    energy: 1,
    keyword: '단절, 전환',
    description: '완전한 변화를 앞둔 전환점',
    fortune: {
      general: '변화의 시기, 과거와 작별할 때예요',
      advice: '새로운 시작을 위해 정리가 필요해요',
    },
  },
  태: {
    energy: 2,
    keyword: '잉태, 준비',
    description: '새로운 가능성이 준비되는 때',
    fortune: {
      general: '조용히 준비하는 것이 좋아요',
      advice: '서두르지 말고 때를 기다리세요',
    },
  },
  양: {
    energy: 3,
    keyword: '양성, 성장',
    description: '가능성이 자라나는 시기',
    fortune: {
      general: '꾸준히 노력하면 성장할 수 있어요',
      advice: '인내심을 가지고 기반을 다지세요',
    },
  },
}

// ============================================
// 신살 (神煞) 분석
// ============================================

// 천을귀인 (天乙貴人) - 일간별
const TIANYI_GUIREN: Record<HeavenlyStem, EarthlyBranch[]> = {
  갑: ['축', '미'], 을: ['자', '신'], 병: ['해', '유'], 정: ['해', '유'],
  무: ['축', '미'], 기: ['자', '신'], 경: ['축', '미'], 신: ['인', '오'],
  임: ['묘', '사'], 계: ['묘', '사'],
}

// 문창귀인 (文昌貴人) - 일간별
const WENCHANG_GUIREN: Record<HeavenlyStem, EarthlyBranch> = {
  갑: '사', 을: '오', 병: '신', 정: '유', 무: '신',
  기: '유', 경: '해', 신: '자', 임: '인', 계: '묘',
}

// 역마살 (驛馬殺) - 년지 또는 일지 기준
const YIMA_SHA: Record<EarthlyBranch, EarthlyBranch> = {
  자: '인', 축: '해', 인: '신', 묘: '사',
  진: '인', 사: '해', 오: '신', 미: '사',
  신: '인', 유: '해', 술: '신', 해: '사',
}

// 도화살 (桃花殺) - 년지 또는 일지 기준
const TAOHUA_SHA: Record<EarthlyBranch, EarthlyBranch> = {
  자: '유', 축: '오', 인: '묘', 묘: '자',
  진: '유', 사: '오', 오: '묘', 미: '자',
  신: '유', 유: '오', 술: '묘', 해: '자',
}

// 화개살 (華蓋殺) - 년지 또는 일지 기준
const HUAGAI_SHA: Record<EarthlyBranch, EarthlyBranch> = {
  자: '진', 축: '축', 인: '술', 묘: '미',
  진: '진', 사: '축', 오: '술', 미: '미',
  신: '진', 유: '축', 술: '술', 해: '미',
}

// 장성살 (將星殺) - 년지 기준
const JIANGXING_SHA: Record<EarthlyBranch, EarthlyBranch> = {
  자: '자', 축: '유', 인: '오', 묘: '묘',
  진: '자', 사: '유', 오: '오', 미: '묘',
  신: '자', 유: '유', 술: '오', 해: '묘',
}

/**
 * 신살 분석
 */
export function analyzeSpiritStars(
  dayMaster: HeavenlyStem,
  fourPillars: FourPillars,
  todayBranch: EarthlyBranch
): SpiritStarAnalysis {
  const present: SpiritStarAnalysis['present'] = []
  const todayActive: SpiritStar[] = []

  const allBranches = [
    fourPillars.year.earthlyBranch,
    fourPillars.month.earthlyBranch,
    fourPillars.day.earthlyBranch,
    fourPillars.hour.earthlyBranch,
  ]
  const yearBranch = fourPillars.year.earthlyBranch
  const dayBranch = fourPillars.day.earthlyBranch

  // 천을귀인 체크
  const tianyiPositions = TIANYI_GUIREN[dayMaster]
  if (allBranches.some(b => tianyiPositions.includes(b))) {
    present.push({
      star: '천을귀인',
      type: 'auspicious',
      description: '귀인의 도움을 받을 수 있는 운명입니다',
    })
    if (tianyiPositions.includes(todayBranch)) {
      todayActive.push('천을귀인')
    }
  }

  // 문창귀인 체크
  const wenchangPosition = WENCHANG_GUIREN[dayMaster]
  if (allBranches.includes(wenchangPosition)) {
    present.push({
      star: '문창귀인',
      type: 'auspicious',
      description: '학문과 문서운이 좋은 운명입니다',
    })
    if (wenchangPosition === todayBranch) {
      todayActive.push('문창귀인')
    }
  }

  // 역마살 체크
  const yimaPosition = YIMA_SHA[yearBranch]
  if (allBranches.includes(yimaPosition)) {
    present.push({
      star: '역마살',
      type: 'neutral',
      description: '이동과 변화가 많은 운명입니다',
    })
    if (yimaPosition === todayBranch) {
      todayActive.push('역마살')
    }
  }

  // 도화살 체크
  const taohuaPosition = TAOHUA_SHA[dayBranch]
  if (allBranches.includes(taohuaPosition)) {
    present.push({
      star: '도화살',
      type: 'neutral',
      description: '매력이 넘치고 이성운이 강한 운명입니다',
    })
    if (taohuaPosition === todayBranch) {
      todayActive.push('도화살')
    }
  }

  // 화개살 체크
  const huagaiPosition = HUAGAI_SHA[yearBranch]
  if (allBranches.includes(huagaiPosition)) {
    present.push({
      star: '화개살',
      type: 'neutral',
      description: '예술적 감각과 영적 감수성이 뛰어납니다',
    })
    if (huagaiPosition === todayBranch) {
      todayActive.push('화개살')
    }
  }

  // 장성살 체크
  const jiangxingPosition = JIANGXING_SHA[yearBranch]
  if (allBranches.includes(jiangxingPosition)) {
    present.push({
      star: '장성살',
      type: 'auspicious',
      description: '리더십과 권위가 있는 운명입니다',
    })
    if (jiangxingPosition === todayBranch) {
      todayActive.push('장성살')
    }
  }

  // 해석 생성
  let interpretation = ''
  if (todayActive.length > 0) {
    interpretation = `오늘은 ${todayActive.join(', ')}이(가) 발동합니다. `
    if (todayActive.includes('천을귀인')) {
      interpretation += '귀인의 도움을 받기 좋은 날이에요. '
    }
    if (todayActive.includes('문창귀인')) {
      interpretation += '시험이나 계약에 좋은 날이에요. '
    }
    if (todayActive.includes('역마살')) {
      interpretation += '이동이나 출장에 좋은 날이에요. '
    }
    if (todayActive.includes('도화살')) {
      interpretation += '이성운이 강한 날이에요. '
    }
    if (todayActive.includes('화개살')) {
      interpretation += '영감이 떠오르고 예술적 감각이 살아나는 날이에요. '
    }
    if (todayActive.includes('장성살')) {
      interpretation += '리더십을 발휘하기 좋은 날이에요. '
    }
  } else {
    interpretation = '오늘은 특별히 발동하는 신살이 없어 무난한 하루입니다.'
  }

  return {
    present,
    todayActive,
    interpretation,
  }
}

// 신살별 운세 영향
export const SPIRIT_STAR_FORTUNE: Record<SpiritStar, {
  type: 'auspicious' | 'inauspicious' | 'neutral'
  fortune: {
    love: string
    money: string
    work: string
    health: string
  }
}> = {
  천을귀인: {
    type: 'auspicious',
    fortune: {
      love: '좋은 인연의 도움으로 관계가 발전해요',
      money: '귀인을 통한 재물 기회가 있어요',
      work: '윗사람의 도움으로 일이 풀려요',
      health: '건강에 도움이 되는 조언을 얻어요',
    },
  },
  문창귀인: {
    type: 'auspicious',
    fortune: {
      love: '지적인 대화로 관계가 깊어져요',
      money: '계약이나 문서 관련 기회가 좋아요',
      work: '기획이나 문서 업무에서 성과가 나요',
      health: '명상이나 독서로 마음의 평화를 찾아요',
    },
  },
  학당귀인: {
    type: 'auspicious',
    fortune: {
      love: '배움을 통해 인연을 만나요',
      money: '교육이나 자기계발 투자가 좋아요',
      work: '학습을 통한 역량 향상이 있어요',
      health: '건강 관련 정보를 습득하기 좋아요',
    },
  },
  태극귀인: {
    type: 'auspicious',
    fortune: {
      love: '조화로운 관계가 형성돼요',
      money: '균형 잡힌 재정 관리가 가능해요',
      work: '조율과 중재 능력이 빛나요',
      health: '음양의 균형으로 건강해요',
    },
  },
  천덕귀인: {
    type: 'auspicious',
    fortune: {
      love: '하늘이 도운 인연을 만나요',
      money: '뜻밖의 행운이 찾아와요',
      work: '위기를 기회로 바꿀 수 있어요',
      health: '자연 치유력이 좋아요',
    },
  },
  월덕귀인: {
    type: 'auspicious',
    fortune: {
      love: '자상하고 배려심 있는 만남이 있어요',
      money: '꾸준한 수입이 보장돼요',
      work: '덕을 베풀면 복이 돌아와요',
      health: '평화로운 마음이 건강의 비결이에요',
    },
  },
  삼기귀인: {
    type: 'auspicious',
    fortune: {
      love: '특별한 인연이 찾아올 수 있어요',
      money: '예상치 못한 횡재가 있을 수 있어요',
      work: '창의적 아이디어가 성공해요',
      health: '활력이 넘치는 하루예요',
    },
  },
  복성귀인: {
    type: 'auspicious',
    fortune: {
      love: '복을 나눌 수 있는 인연이에요',
      money: '재물운이 상승해요',
      work: '노력한 만큼 보상받아요',
      health: '좋은 기운이 감돌아요',
    },
  },
  역마살: {
    type: 'neutral',
    fortune: {
      love: '먼 곳에서 인연이 올 수 있어요',
      money: '해외나 원거리 투자에 기회가 있어요',
      work: '출장이나 이동 업무가 많을 거예요',
      health: '여행 중 건강 관리에 신경 쓰세요',
    },
  },
  화개살: {
    type: 'neutral',
    fortune: {
      love: '정신적 교감이 중요한 인연이에요',
      money: '예술이나 창작 관련 수입이 있어요',
      work: '창의적 분야에서 두각을 나타내요',
      health: '명상이나 휴식이 필요해요',
    },
  },
  도화살: {
    type: 'neutral',
    fortune: {
      love: '매력이 빛나고 이성운이 강해요',
      money: '사교적 활동에서 기회가 와요',
      work: '대인관계가 업무에 도움이 돼요',
      health: '스트레스를 예술로 풀어보세요',
    },
  },
  장성살: {
    type: 'neutral',
    fortune: {
      love: '주도적인 관계를 이끌어요',
      money: '리더십을 발휘해 성과를 내요',
      work: '승진이나 책임 증가가 있어요',
      health: '활동량이 많아 관리가 필요해요',
    },
  },
  겁살: {
    type: 'inauspicious',
    fortune: {
      love: '다툼이나 갈등에 주의하세요',
      money: '도난이나 손실에 주의하세요',
      work: '경쟁자나 방해자가 있을 수 있어요',
      health: '사고나 부상에 주의하세요',
    },
  },
  망신살: {
    type: 'inauspicious',
    fortune: {
      love: '오해로 관계가 틀어질 수 있어요',
      money: '체면 때문에 손해 볼 수 있어요',
      work: '실수로 인한 평판 하락을 조심하세요',
      health: '스트레스로 인한 건강 문제가 있어요',
    },
  },
  백호대살: {
    type: 'inauspicious',
    fortune: {
      love: '급격한 관계 변화에 주의하세요',
      money: '큰 투자나 도박을 피하세요',
      work: '충동적인 결정을 피하세요',
      health: '수술이나 사고에 주의하세요',
    },
  },
  천라지망: {
    type: 'inauspicious',
    fortune: {
      love: '구속받는 느낌의 관계일 수 있어요',
      money: '법적 문제에 주의하세요',
      work: '답답하거나 막히는 상황이 올 수 있어요',
      health: '정신적 압박감에 주의하세요',
    },
  },
}

// ============================================
// 종합 운세 계산
// ============================================

export type ComprehensiveFortuneAnalysis = {
  tenGodAnalysis: TenGodAnalysis
  branchRelationAnalysis: BranchRelationAnalysis
  twelveStageAnalysis: TwelveStageAnalysis
  spiritStarAnalysis: SpiritStarAnalysis
  overallScore: number
  categories: {
    love: { score: number; messages: string[] }
    money: { score: number; messages: string[] }
    work: { score: number; messages: string[] }
    health: { score: number; messages: string[] }
  }
  dailySummary: string
  detailedReading: string[]
  advice: string[]
}

/**
 * 종합 운세 분석
 */
export function analyzeComprehensiveFortune(
  dayMaster: HeavenlyStem,
  userPillars: FourPillars,
  todayPillar: Pillar
): ComprehensiveFortuneAnalysis {
  // 십신 분석
  const tenGodAnalysis = analyzeTenGods(dayMaster, userPillars, todayPillar)

  // 합충형파해 분석
  const branchRelationAnalysis = analyzeBranchRelations(userPillars, todayPillar)

  // 12운성 분석
  const twelveStageAnalysis = analyzeTwelveStages(dayMaster, userPillars, todayPillar)

  // 신살 분석
  const spiritStarAnalysis = analyzeSpiritStars(
    dayMaster,
    userPillars,
    todayPillar.earthlyBranch
  )

  // 카테고리별 점수 및 메시지 생성
  const categories = calculateCategoryScores(
    tenGodAnalysis,
    branchRelationAnalysis,
    twelveStageAnalysis,
    spiritStarAnalysis
  )

  // 종합 점수 계산
  const overallScore = Math.round(
    (categories.love.score + categories.money.score +
     categories.work.score + categories.health.score) / 4
  )

  // 일일 요약 생성
  const dailySummary = generateDailySummary(
    dayMaster,
    tenGodAnalysis,
    branchRelationAnalysis,
    twelveStageAnalysis,
    overallScore
  )

  // 상세 해석 생성
  const detailedReading = generateDetailedReading(
    tenGodAnalysis,
    branchRelationAnalysis,
    twelveStageAnalysis,
    spiritStarAnalysis
  )

  // 조언 생성
  const advice = generateAdvice(
    tenGodAnalysis,
    branchRelationAnalysis,
    twelveStageAnalysis,
    spiritStarAnalysis
  )

  return {
    tenGodAnalysis,
    branchRelationAnalysis,
    twelveStageAnalysis,
    spiritStarAnalysis,
    overallScore,
    categories,
    dailySummary,
    detailedReading,
    advice,
  }
}

/**
 * 십신 분석
 */
function analyzeTenGods(
  dayMaster: HeavenlyStem,
  pillars: FourPillars,
  todayPillar: Pillar
): TenGodAnalysis {
  const yearStem = calculateTenGod(dayMaster, pillars.year.heavenlyStem)
  const monthStem = calculateTenGod(dayMaster, pillars.month.heavenlyStem)
  const hourStem = calculateTenGod(dayMaster, pillars.hour.heavenlyStem)

  const yearBranch = calculateBranchTenGod(dayMaster, pillars.year.earthlyBranch)
  const monthBranch = calculateBranchTenGod(dayMaster, pillars.month.earthlyBranch)
  const dayBranch = calculateBranchTenGod(dayMaster, pillars.day.earthlyBranch)
  const hourBranch = calculateBranchTenGod(dayMaster, pillars.hour.earthlyBranch)

  const todayStem = calculateTenGod(dayMaster, todayPillar.heavenlyStem)

  // 십신 카운트
  const tenGodCount: Record<TenGod, number> = {
    비견: 0, 겁재: 0, 식신: 0, 상관: 0, 편재: 0,
    정재: 0, 편관: 0, 정관: 0, 편인: 0, 정인: 0,
  }

  ;[yearStem, monthStem, hourStem, yearBranch, monthBranch, dayBranch, hourBranch].forEach(tg => {
    tenGodCount[tg]++
  })

  // 우세 십신 찾기
  let dominant: TenGod | null = null
  let maxCount = 0
  for (const [tg, count] of Object.entries(tenGodCount)) {
    if (count > maxCount) {
      maxCount = count
      dominant = tg as TenGod
    }
  }

  // 신강/신약 판단
  const selfCount = tenGodCount.비견 + tenGodCount.겁재 + tenGodCount.편인 + tenGodCount.정인
  const otherCount = 7 - selfCount
  let balance: 'strong' | 'weak' | 'balanced'
  if (selfCount > otherCount + 1) balance = 'strong'
  else if (otherCount > selfCount + 1) balance = 'weak'
  else balance = 'balanced'

  // 오늘의 십신 해석
  const todayTenGodTraits = TEN_GOD_TRAITS[todayStem]
  const interpretation = `오늘은 ${todayStem}의 기운이 작용합니다. ${todayTenGodTraits.positive}`

  return {
    yearStem,
    monthStem,
    hourStem,
    yearBranch,
    monthBranch,
    dayBranch,
    hourBranch,
    dominant,
    balance,
    interpretation,
  }
}

/**
 * 합충형파해 분석
 */
function analyzeBranchRelations(
  pillars: FourPillars,
  todayPillar: Pillar
): BranchRelationAnalysis {
  const relations: BranchRelationAnalysis['relations'] = []
  const todayRelations: BranchRelationAnalysis['todayRelations'] = []

  const pillarNames = ['년', '월', '일', '시'] as const
  const branches = [
    pillars.year.earthlyBranch,
    pillars.month.earthlyBranch,
    pillars.day.earthlyBranch,
    pillars.hour.earthlyBranch,
  ]

  // 사주 내 관계 분석
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const relation = checkBranchRelation(branches[i]!, branches[j]!)
      if (relation !== '없음') {
        const desc = BRANCH_RELATION_DESCRIPTIONS[relation]
        relations.push({
          pillars: [pillarNames[i]!, pillarNames[j]!],
          type: relation,
          effect: desc.effect,
          description: desc.general,
        })
      }
    }
  }

  // 오늘 지지와의 관계 분석
  for (let i = 0; i < branches.length; i++) {
    const relation = checkBranchRelation(branches[i]!, todayPillar.earthlyBranch)
    if (relation !== '없음') {
      const desc = BRANCH_RELATION_DESCRIPTIONS[relation]
      todayRelations.push({
        pillar: `${pillarNames[i]}지`,
        type: relation,
        effect: desc.effect,
        description: desc.general,
      })
    }
  }

  // 요약 생성
  let summary = ''
  const negativeRelations = todayRelations.filter(r => r.effect === 'negative')
  const positiveRelations = todayRelations.filter(r => r.effect === 'positive')

  if (positiveRelations.length > 0 && negativeRelations.length === 0) {
    summary = '오늘은 좋은 기운이 조화를 이루는 날입니다.'
  } else if (negativeRelations.length > 0 && positiveRelations.length === 0) {
    summary = `오늘은 ${negativeRelations.map(r => r.type).join(', ')}의 기운이 있어 조심이 필요합니다.`
  } else if (positiveRelations.length > 0 && negativeRelations.length > 0) {
    summary = '오늘은 길흉이 섞여 있어 신중함이 필요합니다.'
  } else {
    summary = '오늘은 특별한 충돌 없이 무난한 날입니다.'
  }

  return {
    relations,
    todayRelations,
    summary,
  }
}

/**
 * 12운성 분석
 */
function analyzeTwelveStages(
  dayMaster: HeavenlyStem,
  pillars: FourPillars,
  todayPillar: Pillar
): TwelveStageAnalysis {
  const year = calculateTwelveStage(dayMaster, pillars.year.earthlyBranch)
  const month = calculateTwelveStage(dayMaster, pillars.month.earthlyBranch)
  const day = calculateTwelveStage(dayMaster, pillars.day.earthlyBranch)
  const hour = calculateTwelveStage(dayMaster, pillars.hour.earthlyBranch)
  const todayStage = calculateTwelveStage(dayMaster, todayPillar.earthlyBranch)

  const stageTraits = TWELVE_STAGE_TRAITS[todayStage]
  const interpretation = `오늘은 ${todayStage}의 기운입니다. ${stageTraits.fortune.general}`

  return {
    year,
    month,
    day,
    hour,
    todayStage,
    interpretation,
  }
}

/**
 * 카테고리별 점수 계산
 */
function calculateCategoryScores(
  tenGodAnalysis: TenGodAnalysis,
  branchAnalysis: BranchRelationAnalysis,
  twelveStageAnalysis: TwelveStageAnalysis,
  spiritStarAnalysis: SpiritStarAnalysis
): ComprehensiveFortuneAnalysis['categories'] {
  const categories = {
    love: { score: 70, messages: [] as string[] },
    money: { score: 70, messages: [] as string[] },
    work: { score: 70, messages: [] as string[] },
    health: { score: 70, messages: [] as string[] },
  }

  // 12운성 에너지 레벨 반영
  const stageTraits = TWELVE_STAGE_TRAITS[twelveStageAnalysis.todayStage]
  const energyBonus = (stageTraits.energy - 3) * 5 // -10 ~ +10

  for (const category of Object.keys(categories) as (keyof typeof categories)[]) {
    categories[category].score += energyBonus
  }

  // 합충형파해 반영
  for (const relation of branchAnalysis.todayRelations) {
    const desc = BRANCH_RELATION_DESCRIPTIONS[relation.type]
    const modifier = relation.effect === 'positive' ? 10 : relation.effect === 'negative' ? -10 : 0

    for (const category of Object.keys(categories) as (keyof typeof categories)[]) {
      categories[category].score += modifier
      if (relation.effect !== 'neutral') {
        categories[category].messages.push(desc.fortune[category])
      }
    }
  }

  // 신살 반영
  for (const star of spiritStarAnalysis.todayActive) {
    const starFortune = SPIRIT_STAR_FORTUNE[star]
    if (starFortune) {
      const modifier = starFortune.type === 'auspicious' ? 8 :
                       starFortune.type === 'inauspicious' ? -8 : 0

      for (const category of Object.keys(categories) as (keyof typeof categories)[]) {
        categories[category].score += modifier
        categories[category].messages.push(starFortune.fortune[category])
      }
    }
  }

  // 점수 범위 제한
  for (const category of Object.keys(categories) as (keyof typeof categories)[]) {
    categories[category].score = Math.max(30, Math.min(100, categories[category].score))
  }

  return categories
}

/**
 * 일일 요약 생성
 */
function generateDailySummary(
  dayMaster: HeavenlyStem,
  tenGodAnalysis: TenGodAnalysis,
  branchAnalysis: BranchRelationAnalysis,
  twelveStageAnalysis: TwelveStageAnalysis,
  overallScore: number
): string {
  const stageTraits = TWELVE_STAGE_TRAITS[twelveStageAnalysis.todayStage]
  const dayMasterElement = STEM_TO_ELEMENT[dayMaster]

  let grade = ''
  if (overallScore >= 85) grade = '대길'
  else if (overallScore >= 75) grade = '길'
  else if (overallScore >= 65) grade = '중길'
  else if (overallScore >= 55) grade = '소길'
  else grade = '평'

  const hasNegative = branchAnalysis.todayRelations.some(r => r.effect === 'negative')
  const hasPositive = branchAnalysis.todayRelations.some(r => r.effect === 'positive')

  let summary = `${dayMasterElement}의 기운을 가진 당신, 오늘은 ${twelveStageAnalysis.todayStage}의 운입니다. `

  if (hasPositive && !hasNegative) {
    summary += `좋은 기운이 조화를 이루어 ${grade}의 운세가 펼쳐집니다.`
  } else if (hasNegative && !hasPositive) {
    summary += `주의가 필요한 기운이 있으니 신중하게 행동하세요.`
  } else if (hasPositive && hasNegative) {
    summary += `길흉이 교차하는 날, 기회를 잘 살리고 위험은 피하세요.`
  } else {
    summary += `${stageTraits.fortune.general}`
  }

  return summary
}

/**
 * 상세 해석 생성
 */
function generateDetailedReading(
  tenGodAnalysis: TenGodAnalysis,
  branchAnalysis: BranchRelationAnalysis,
  twelveStageAnalysis: TwelveStageAnalysis,
  spiritStarAnalysis: SpiritStarAnalysis
): string[] {
  const readings: string[] = []

  // 12운성 해석
  const stageTraits = TWELVE_STAGE_TRAITS[twelveStageAnalysis.todayStage]
  readings.push(`[${twelveStageAnalysis.todayStage}운] ${stageTraits.description}`)

  // 십신 해석
  readings.push(tenGodAnalysis.interpretation)

  // 합충형파해 해석
  if (branchAnalysis.todayRelations.length > 0) {
    for (const relation of branchAnalysis.todayRelations) {
      readings.push(`[${relation.pillar} ${relation.type}] ${relation.description}`)
    }
  }

  // 신살 해석
  if (spiritStarAnalysis.todayActive.length > 0) {
    readings.push(spiritStarAnalysis.interpretation)
  }

  return readings
}

/**
 * 조언 생성
 */
function generateAdvice(
  tenGodAnalysis: TenGodAnalysis,
  branchAnalysis: BranchRelationAnalysis,
  twelveStageAnalysis: TwelveStageAnalysis,
  spiritStarAnalysis: SpiritStarAnalysis
): string[] {
  const advice: string[] = []

  // 12운성 기반 조언
  const stageTraits = TWELVE_STAGE_TRAITS[twelveStageAnalysis.todayStage]
  advice.push(stageTraits.fortune.advice)

  // 합충형파해 기반 조언
  const hasClash = branchAnalysis.todayRelations.some(r => r.type === '충')
  const hasPunishment = branchAnalysis.todayRelations.some(r => r.type === '형')

  if (hasClash) {
    advice.push('변화가 예상되는 날입니다. 중요한 결정은 신중하게 하세요.')
  }
  if (hasPunishment) {
    advice.push('인간관계에서 갈등이 생길 수 있어요. 말과 행동을 조심하세요.')
  }

  // 신살 기반 조언
  if (spiritStarAnalysis.todayActive.includes('역마살')) {
    advice.push('이동이나 여행에 좋은 날입니다. 새로운 장소에서 기회를 찾아보세요.')
  }
  if (spiritStarAnalysis.todayActive.includes('도화살')) {
    advice.push('매력이 돋보이는 날이에요. 대인관계를 적극 활용하세요.')
  }
  if (spiritStarAnalysis.todayActive.includes('천을귀인')) {
    advice.push('도움을 줄 수 있는 귀인을 만날 수 있어요. 인연을 소중히 하세요.')
  }

  // 신강/신약 기반 조언
  if (tenGodAnalysis.balance === 'strong') {
    advice.push('에너지가 넘치는 사주입니다. 타인과의 협력으로 균형을 맞추세요.')
  } else if (tenGodAnalysis.balance === 'weak') {
    advice.push('지원과 도움이 필요한 사주입니다. 귀인의 조언을 경청하세요.')
  }

  return advice
}

// ============================================
// 천간합/충 분석
// ============================================

// 천간합 (天干合) - 합이 되는 천간 쌍
const STEM_COMBINATIONS: [HeavenlyStem, HeavenlyStem, FiveElement][] = [
  ['갑', '기', '토'], // 갑기합토
  ['을', '경', '금'], // 을경합금
  ['병', '신', '수'], // 병신합수
  ['정', '임', '목'], // 정임합목
  ['무', '계', '화'], // 무계합화
]

// 천간충 (天干沖) - 충이 되는 천간 쌍
const STEM_CLASHES: [HeavenlyStem, HeavenlyStem][] = [
  ['갑', '경'], // 갑경충
  ['을', '신'], // 을신충
  ['병', '임'], // 병임충
  ['정', '계'], // 정계충
]

export type StemRelation = '합' | '충' | '없음'

export type StemRelationResult = {
  type: StemRelation
  resultElement?: FiveElement
  description: string
  effect: 'positive' | 'negative' | 'neutral'
}

/**
 * 두 천간 간의 관계 확인 (합/충)
 */
export function checkStemRelation(stem1: HeavenlyStem, stem2: HeavenlyStem): StemRelationResult {
  // 천간합 체크
  for (const [a, b, element] of STEM_COMBINATIONS) {
    if ((stem1 === a && stem2 === b) || (stem1 === b && stem2 === a)) {
      return {
        type: '합',
        resultElement: element,
        description: `${stem1}${stem2}합 → ${element}으로 변화하는 기운`,
        effect: 'positive',
      }
    }
  }

  // 천간충 체크
  for (const [a, b] of STEM_CLASHES) {
    if ((stem1 === a && stem2 === b) || (stem1 === b && stem2 === a)) {
      return {
        type: '충',
        description: `${stem1}${stem2}충 → 충돌과 변화의 기운`,
        effect: 'negative',
      }
    }
  }

  return {
    type: '없음',
    description: '특별한 관계 없음',
    effect: 'neutral',
  }
}

// ============================================
// 용신/희신 분석
// ============================================

export type YongShinAnalysis = {
  balance: 'strong' | 'weak' | 'balanced'
  neededElements: FiveElement[]  // 필요한 오행 (용신/희신)
  avoidElements: FiveElement[]   // 피해야 할 오행 (기신/구신)
  todayElementEffect: 'very_good' | 'good' | 'neutral' | 'bad' | 'very_bad'
  todayElementDescription: string
  score: number  // -30 ~ +30
}

// 오행 상생/상극 관계
const ELEMENT_GENERATES: Record<FiveElement, FiveElement> = {
  목: '화', 화: '토', 토: '금', 금: '수', 수: '목',
}

const ELEMENT_CONTROLS: Record<FiveElement, FiveElement> = {
  목: '토', 토: '수', 수: '화', 화: '금', 금: '목',
}

const ELEMENT_GENERATED_BY: Record<FiveElement, FiveElement> = {
  목: '수', 화: '목', 토: '화', 금: '토', 수: '금',
}

const ELEMENT_CONTROLLED_BY: Record<FiveElement, FiveElement> = {
  목: '금', 화: '수', 토: '목', 금: '화', 수: '토',
}

/**
 * 사주 원국의 오행 분포 계산
 */
export function calculateElementDistribution(
  dayMaster: HeavenlyStem,
  pillars: FourPillars
): Record<FiveElement, number> {
  const distribution: Record<FiveElement, number> = {
    목: 0, 화: 0, 토: 0, 금: 0, 수: 0,
  }

  // 모든 천간의 오행 카운트
  const stems = [
    pillars.year.heavenlyStem,
    pillars.month.heavenlyStem,
    dayMaster,
    pillars.hour.heavenlyStem,
  ]

  for (const stem of stems) {
    distribution[STEM_TO_ELEMENT[stem]] += 1
  }

  // 모든 지지의 오행 카운트 (지장간 본기 기준)
  const branches = [
    pillars.year.earthlyBranch,
    pillars.month.earthlyBranch,
    pillars.day.earthlyBranch,
    pillars.hour.earthlyBranch,
  ]

  for (const branch of branches) {
    distribution[BRANCH_TO_ELEMENT[branch]] += 1
  }

  return distribution
}

/**
 * 용신/희신 분석
 * 신강하면 설기/극하는 오행이 필요, 신약하면 생해주는 오행이 필요
 */
export function analyzeYongShin(
  dayMaster: HeavenlyStem,
  pillars: FourPillars,
  todayElement: FiveElement
): YongShinAnalysis {
  const dayMasterElement = STEM_TO_ELEMENT[dayMaster]
  const distribution = calculateElementDistribution(dayMaster, pillars)

  // 일간을 돕는 오행 (비겁 + 인성)
  const helpingElement = dayMasterElement
  const resourceElement = ELEMENT_GENERATED_BY[dayMasterElement]

  // 일간을 설기/극하는 오행 (식상 + 재성 + 관성)
  const outputElement = ELEMENT_GENERATES[dayMasterElement]
  const wealthElement = ELEMENT_CONTROLS[dayMasterElement]
  const powerElement = ELEMENT_CONTROLLED_BY[dayMasterElement]

  // 신강/신약 판단 (일간을 돕는 오행 vs 설기하는 오행)
  const helpingScore = distribution[helpingElement] + distribution[resourceElement]
  const drainingScore = distribution[outputElement] + distribution[wealthElement] + distribution[powerElement]

  let balance: 'strong' | 'weak' | 'balanced'
  let neededElements: FiveElement[]
  let avoidElements: FiveElement[]

  if (helpingScore > drainingScore + 1) {
    balance = 'strong'
    // 신강: 설기/극하는 오행이 필요
    neededElements = [outputElement, wealthElement, powerElement]
    avoidElements = [helpingElement, resourceElement]
  } else if (drainingScore > helpingScore + 1) {
    balance = 'weak'
    // 신약: 생해주는 오행이 필요
    neededElements = [helpingElement, resourceElement]
    avoidElements = [powerElement, wealthElement]
  } else {
    balance = 'balanced'
    // 중화: 상황에 따라 유연하게
    neededElements = [outputElement, wealthElement]
    avoidElements = []
  }

  // 오늘의 오행이 용신인지 기신인지 판단
  let todayElementEffect: YongShinAnalysis['todayElementEffect']
  let todayElementDescription: string
  let score: number

  if (neededElements.includes(todayElement)) {
    if (neededElements[0] === todayElement) {
      todayElementEffect = 'very_good'
      todayElementDescription = `오늘은 ${todayElement}의 기운으로, 당신에게 꼭 필요한 용신의 날입니다!`
      score = 25
    } else {
      todayElementEffect = 'good'
      todayElementDescription = `오늘은 ${todayElement}의 기운으로, 당신에게 도움이 되는 희신의 날입니다.`
      score = 15
    }
  } else if (avoidElements.includes(todayElement)) {
    if (avoidElements[0] === todayElement) {
      todayElementEffect = 'very_bad'
      todayElementDescription = `오늘은 ${todayElement}의 기운으로, 주의가 필요한 기신의 날입니다.`
      score = -20
    } else {
      todayElementEffect = 'bad'
      todayElementDescription = `오늘은 ${todayElement}의 기운으로, 조금 신중함이 필요한 날입니다.`
      score = -10
    }
  } else {
    todayElementEffect = 'neutral'
    todayElementDescription = `오늘은 ${todayElement}의 기운으로, 무난한 날입니다.`
    score = 0
  }

  return {
    balance,
    neededElements,
    avoidElements,
    todayElementEffect,
    todayElementDescription,
    score,
  }
}

// ============================================
// 사주 전체 천간 관계 분석
// ============================================

export type FullStemAnalysis = {
  yearStemRelation: StemRelationResult
  monthStemRelation: StemRelationResult
  hourStemRelation: StemRelationResult
  totalScore: number  // -30 ~ +30
  summary: string
}

/**
 * 사주 전체 천간과 오늘 천간의 관계 분석
 */
export function analyzeFullStemRelations(
  pillars: FourPillars,
  todayStem: HeavenlyStem
): FullStemAnalysis {
  const yearStemRelation = checkStemRelation(pillars.year.heavenlyStem, todayStem)
  const monthStemRelation = checkStemRelation(pillars.month.heavenlyStem, todayStem)
  const hourStemRelation = checkStemRelation(pillars.hour.heavenlyStem, todayStem)

  let totalScore = 0
  const summaryParts: string[] = []

  // 각 관계별 점수 계산
  const relations = [
    { name: '년간', rel: yearStemRelation, weight: 1.0 },
    { name: '월간', rel: monthStemRelation, weight: 1.5 },  // 월간이 가장 중요
    { name: '시간', rel: hourStemRelation, weight: 0.8 },
  ]

  for (const { name, rel, weight } of relations) {
    if (rel.type === '합') {
      totalScore += 10 * weight
      summaryParts.push(`${name}과 천간합`)
    } else if (rel.type === '충') {
      totalScore -= 10 * weight
      summaryParts.push(`${name}과 천간충`)
    }
  }

  let summary: string
  if (summaryParts.length === 0) {
    summary = '오늘 천간과 사주 천간 사이에 특별한 합충이 없어 무난합니다.'
  } else {
    summary = `오늘은 ${summaryParts.join(', ')}이 있습니다.`
  }

  return {
    yearStemRelation,
    monthStemRelation,
    hourStemRelation,
    totalScore: Math.round(totalScore),
    summary,
  }
}

// ============================================
// 개인화된 기본 점수 계산
// ============================================

export type PersonalizedScores = {
  love: number
  money: number
  health: number
  work: number
  overall: number
}

/**
 * 사주와 오늘의 관계를 기반으로 개인화된 기본 점수 계산
 */
export function calculatePersonalizedBaseScores(
  dayMaster: HeavenlyStem,
  pillars: FourPillars,
  todayPillar: Pillar
): PersonalizedScores {
  const todayElement = STEM_TO_ELEMENT[todayPillar.heavenlyStem]

  // 1. 용신/희신 분석
  const yongShinAnalysis = analyzeYongShin(dayMaster, pillars, todayElement)

  // 2. 천간 관계 분석
  const stemAnalysis = analyzeFullStemRelations(pillars, todayPillar.heavenlyStem)

  // 3. 지지 관계 분석 (기존 함수 활용을 위해 여기서는 간단하게)
  let branchScore = 0
  const branches = [
    pillars.year.earthlyBranch,
    pillars.month.earthlyBranch,
    pillars.day.earthlyBranch,
    pillars.hour.earthlyBranch,
  ]

  for (const branch of branches) {
    const relation = checkBranchRelation(branch, todayPillar.earthlyBranch)
    if (relation === '합') branchScore += 8
    else if (relation === '삼합' || relation === '방합') branchScore += 6
    else if (relation === '충') branchScore -= 10
    else if (relation === '형') branchScore -= 8
    else if (relation === '파') branchScore -= 5
    else if (relation === '해') branchScore -= 5
  }

  // 4. 12운성 에너지
  const todayTwelveStage = calculateTwelveStage(dayMaster, todayPillar.earthlyBranch)
  const stageEnergy = TWELVE_STAGE_TRAITS[todayTwelveStage].energy
  const stageScore = (stageEnergy - 3) * 5  // -10 ~ +10

  // 5. 기본 점수 계산 (60점 기준)
  const baseScore = 60 + yongShinAnalysis.score + stemAnalysis.totalScore + branchScore + stageScore

  // 6. 십신별 카테고리 가중치
  const todayTenGod = calculateTenGod(dayMaster, todayPillar.heavenlyStem)
  const tenGodCategory = TEN_GOD_TRAITS[todayTenGod].category

  // 십신 카테고리에 따른 각 운세 가중치
  const categoryWeights: Record<string, PersonalizedScores> = {
    self: { love: 0, money: -5, health: 5, work: 0, overall: 0 },
    output: { love: 5, money: 5, health: -3, work: 5, overall: 0 },
    wealth: { love: 3, money: 10, health: -5, work: 5, overall: 0 },
    power: { love: -3, money: 3, health: -5, work: 10, overall: 0 },
    resource: { love: 5, money: -3, health: 8, work: 3, overall: 0 },
  }

  const weights = categoryWeights[tenGodCategory] || { love: 0, money: 0, health: 0, work: 0, overall: 0 }

  // 7. 최종 점수 계산
  const clamp = (val: number) => Math.max(30, Math.min(95, Math.round(val)))

  return {
    love: clamp(baseScore + weights.love),
    money: clamp(baseScore + weights.money),
    health: clamp(baseScore + weights.health),
    work: clamp(baseScore + weights.work),
    overall: clamp(baseScore),
  }
}
