import {
  calculateFourPillars,
  type BirthInfo,
  type FourPillarsDetail,
  type HeavenlyStem,
  type FiveElement,
} from 'manseryeok'

export type { BirthInfo, FourPillarsDetail, HeavenlyStem, FiveElement }

// 사주 계산
export function getSaju(birthInfo: BirthInfo): FourPillarsDetail {
  return calculateFourPillars(birthInfo)
}

// 오늘의 사주 계산
export function getTodaySaju(): FourPillarsDetail {
  const now = new Date()
  return calculateFourPillars({
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes(),
  })
}

// 일간(日干) - 자신을 나타내는 천간
export function getDayMaster(saju: FourPillarsDetail): HeavenlyStem {
  return saju.day.heavenlyStem
}

// 오행 상생 관계
const GENERATING_CYCLE: Record<FiveElement, FiveElement> = {
  목: '화', // 목생화
  화: '토', // 화생토
  토: '금', // 토생금
  금: '수', // 금생수
  수: '목', // 수생목
}

// 오행 상극 관계
const OVERCOMING_CYCLE: Record<FiveElement, FiveElement> = {
  목: '토', // 목극토
  토: '수', // 토극수
  수: '화', // 수극화
  화: '금', // 화극금
  금: '목', // 금극목
}

// 오행 상성 체크
export function checkElementRelation(
  myElement: FiveElement,
  otherElement: FiveElement
): 'generating' | 'overcoming' | 'generated' | 'overcome' | 'same' {
  if (myElement === otherElement) return 'same'
  if (GENERATING_CYCLE[myElement] === otherElement) return 'generating' // 내가 생해줌
  if (GENERATING_CYCLE[otherElement] === myElement) return 'generated' // 나를 생해줌
  if (OVERCOMING_CYCLE[myElement] === otherElement) return 'overcoming' // 내가 극함
  if (OVERCOMING_CYCLE[otherElement] === myElement) return 'overcome' // 나를 극함
  return 'same'
}

// 오행별 특성 (사용자 지정 색상: 목=그린, 화=레드, 토=브라운, 금=옐로우, 수=파랑)
export const ELEMENT_TRAITS: Record<FiveElement, {
  color: string
  direction: string
  season: string
  personality: string
  luckyColor: string
}> = {
  목: {
    color: '녹색',
    direction: '동쪽',
    season: '봄',
    personality: '성장, 발전, 창의력',
    luckyColor: '초록색',
  },
  화: {
    color: '빨간색',
    direction: '남쪽',
    season: '여름',
    personality: '열정, 활력, 표현력',
    luckyColor: '빨간색',
  },
  토: {
    color: '갈색',
    direction: '중앙',
    season: '환절기',
    personality: '안정, 신뢰, 중재력',
    luckyColor: '갈색',
  },
  금: {
    color: '노란색',
    direction: '서쪽',
    season: '가을',
    personality: '결단력, 정의감, 실행력',
    luckyColor: '노란색',
  },
  수: {
    color: '파란색',
    direction: '북쪽',
    season: '겨울',
    personality: '지혜, 유연함, 적응력',
    luckyColor: '파란색',
  },
}

// 천간별 오행 매핑
export const STEM_TO_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  갑: '목',
  을: '목',
  병: '화',
  정: '화',
  무: '토',
  기: '토',
  경: '금',
  신: '금',
  임: '수',
  계: '수',
}
