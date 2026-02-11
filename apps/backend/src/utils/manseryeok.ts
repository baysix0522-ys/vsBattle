/**
 * 만세력 기반 사주 원국 계산 유틸리티
 * manseryeok npm 패키지를 래핑하여 백엔드 BirthInfo → 정확한 사주 원국 반환
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
import * as manseryeokLib from 'manseryeok'

// 타입만 별도 import
type ManseryeokBirthInfo = import('manseryeok').BirthInfo
type FourPillarsDetail = import('manseryeok').FourPillarsDetail
type HeavenlyStem = import('manseryeok').HeavenlyStem
type FiveElement = import('manseryeok').FiveElement

// manseryeok 패키지의 CJS/ESM 호환: 런타임에서 안전하게 함수 추출
function getCalculateFourPillars(): (birthInfo: ManseryeokBirthInfo) => FourPillarsDetail {
  const lib = manseryeokLib as any
  // default export가 있는 경우 (CJS interop)
  if (lib.default?.calculateFourPillars) return lib.default.calculateFourPillars
  // 직접 named export인 경우
  if (typeof lib.calculateFourPillars === 'function') return lib.calculateFourPillars
  throw new Error('manseryeok 패키지에서 calculateFourPillars를 찾을 수 없습니다')
}

// 백엔드에서 사용하는 BirthInfo 타입
type BackendBirthInfo = {
  birthDate: string   // YYYY-MM-DD
  birthTime?: string | undefined  // HH:MM
  isTimeUnknown: boolean
  gender: 'male' | 'female'
}

// 천간 → 오행
const STEM_TO_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  갑: '목', 을: '목',
  병: '화', 정: '화',
  무: '토', 기: '토',
  경: '금', 신: '금',
  임: '수', 계: '수',
}

// 천간 음양
const STEM_YIN_YANG: Record<HeavenlyStem, 'yang' | 'yin'> = {
  갑: 'yang', 을: 'yin',
  병: 'yang', 정: 'yin',
  무: 'yang', 기: 'yin',
  경: 'yang', 신: 'yin',
  임: 'yang', 계: 'yin',
}

// 지지 타입
type EarthlyBranch = '자' | '축' | '인' | '묘' | '진' | '사' | '오' | '미' | '신' | '유' | '술' | '해'

// 지지 → 오행
const BRANCH_TO_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  자: '수', 축: '토', 인: '목', 묘: '목',
  진: '토', 사: '화', 오: '화', 미: '토',
  신: '금', 유: '금', 술: '토', 해: '수',
}

// 지장간 (地藏干) - 지지 안에 숨어있는 천간
const BRANCH_HIDDEN_STEMS: Record<EarthlyBranch, HeavenlyStem[]> = {
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

// 십신 타입
type TenGod = '비견' | '겁재' | '식신' | '상관' | '편재' | '정재' | '편관' | '정관' | '편인' | '정인'

// 오행 관계 판별
function getElementRelation(
  my: FiveElement,
  other: FiveElement
): 'same' | 'generates' | 'generated' | 'controls' | 'controlled' {
  if (my === other) return 'same'
  const gen: Record<FiveElement, FiveElement> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' }
  const ctrl: Record<FiveElement, FiveElement> = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' }
  if (gen[my] === other) return 'generates'
  if (gen[other] === my) return 'generated'
  if (ctrl[my] === other) return 'controls'
  if (ctrl[other] === my) return 'controlled'
  return 'same'
}

// 십신 계산 (일간 기준)
function calculateTenGod(dayMaster: HeavenlyStem, targetStem: HeavenlyStem): TenGod {
  const myElement = STEM_TO_ELEMENT[dayMaster]
  const targetElement = STEM_TO_ELEMENT[targetStem]
  const sameYinYang = STEM_YIN_YANG[dayMaster] === STEM_YIN_YANG[targetStem]
  const relation = getElementRelation(myElement, targetElement)
  switch (relation) {
    case 'same': return sameYinYang ? '비견' : '겁재'
    case 'generates': return sameYinYang ? '식신' : '상관'
    case 'generated': return sameYinYang ? '편인' : '정인'
    case 'controls': return sameYinYang ? '편재' : '정재'
    case 'controlled': return sameYinYang ? '편관' : '정관'
    default: return '비견'
  }
}

// 지지 본기의 십신 계산
function calculateBranchTenGod(dayMaster: HeavenlyStem, branch: EarthlyBranch): TenGod {
  const mainStem = BRANCH_HIDDEN_STEMS[branch][0]!
  return calculateTenGod(dayMaster, mainStem)
}

// ============================================
// 오행 분포 계산 (천간 + 지지 본기)
// ============================================

export type ElementDistribution = {
  wood: number
  fire: number
  earth: number
  metal: number
  water: number
}

const ELEMENT_TO_KEY: Record<FiveElement, keyof ElementDistribution> = {
  목: 'wood', 화: 'fire', 토: 'earth', 금: 'metal', 수: 'water',
}

function calculateElementDistribution(
  pillars: FourPillarsDetail,
  includeHour: boolean
): ElementDistribution {
  const dist: ElementDistribution = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }

  // 천간 오행
  const stems: HeavenlyStem[] = [
    pillars.year.heavenlyStem,
    pillars.month.heavenlyStem,
    pillars.day.heavenlyStem,
  ]
  if (includeHour) stems.push(pillars.hour.heavenlyStem)

  for (const stem of stems) {
    dist[ELEMENT_TO_KEY[STEM_TO_ELEMENT[stem]]]++
  }

  // 지지 오행 (본기 기준)
  const branches: EarthlyBranch[] = [
    pillars.year.earthlyBranch as EarthlyBranch,
    pillars.month.earthlyBranch as EarthlyBranch,
    pillars.day.earthlyBranch as EarthlyBranch,
  ]
  if (includeHour) branches.push(pillars.hour.earthlyBranch as EarthlyBranch)

  for (const branch of branches) {
    dist[ELEMENT_TO_KEY[BRANCH_TO_ELEMENT[branch]]]++
  }

  return dist
}

// ============================================
// 십신 매핑 계산
// ============================================

export type SipsinMapping = {
  year: { stem: string; branch: string }
  month: { stem: string; branch: string }
  day: { stem: string; branch: string }
  hour: { stem: string; branch: string } | null
}

function calculateSipsinMapping(
  pillars: FourPillarsDetail,
  includeHour: boolean
): SipsinMapping {
  const dayMaster = pillars.day.heavenlyStem

  return {
    year: {
      stem: calculateTenGod(dayMaster, pillars.year.heavenlyStem),
      branch: calculateBranchTenGod(dayMaster, pillars.year.earthlyBranch as EarthlyBranch),
    },
    month: {
      stem: calculateTenGod(dayMaster, pillars.month.heavenlyStem),
      branch: calculateBranchTenGod(dayMaster, pillars.month.earthlyBranch as EarthlyBranch),
    },
    day: {
      stem: '비견(본인)',
      branch: calculateBranchTenGod(dayMaster, pillars.day.earthlyBranch as EarthlyBranch),
    },
    hour: includeHour
      ? {
          stem: calculateTenGod(dayMaster, pillars.hour.heavenlyStem),
          branch: calculateBranchTenGod(dayMaster, pillars.hour.earthlyBranch as EarthlyBranch),
        }
      : null,
  }
}

// ============================================
// 메인: 사주 원국 계산
// ============================================

export type PreCalculatedSaju = {
  pillars: {
    year: { heavenlyStem: string; earthlyBranch: string }
    month: { heavenlyStem: string; earthlyBranch: string }
    day: { heavenlyStem: string; earthlyBranch: string }
    hour: { heavenlyStem: string; earthlyBranch: string } | null
  }
  dayMaster: string
  dayMasterElement: string   // 목/화/토/금/수
  dayMasterElementEn: string // wood/fire/earth/metal/water
  yinYang: 'yang' | 'yin'
  elementDistribution: ElementDistribution
  sipsin: SipsinMapping
  hanjaStrings: {
    year: string  // ex: "갑진"
    month: string
    day: string
    hour: string | null
  }
}

const ELEMENT_KR_TO_EN: Record<FiveElement, string> = {
  목: 'wood', 화: 'fire', 토: 'earth', 금: 'metal', 수: 'water',
}

export function calculateSajuFromBirthInfo(birthInfo: BackendBirthInfo): PreCalculatedSaju {
  const [yearStr, monthStr, dayStr] = birthInfo.birthDate.split('-')
  const year = parseInt(yearStr!, 10)
  const month = parseInt(monthStr!, 10)
  const day = parseInt(dayStr!, 10)

  let hour = 12
  let minute = 0
  if (!birthInfo.isTimeUnknown && birthInfo.birthTime) {
    const [h, m] = birthInfo.birthTime.split(':')
    hour = parseInt(h!, 10)
    minute = parseInt(m!, 10)
  }

  const manseryeokInput: ManseryeokBirthInfo = { year, month, day, hour, minute }
  const calcFn = getCalculateFourPillars()
  const result = calcFn(manseryeokInput)

  const includeHour = !birthInfo.isTimeUnknown
  const dayMaster = result.day.heavenlyStem
  const dayMasterElement = STEM_TO_ELEMENT[dayMaster]

  return {
    pillars: {
      year: { heavenlyStem: result.year.heavenlyStem, earthlyBranch: result.year.earthlyBranch },
      month: { heavenlyStem: result.month.heavenlyStem, earthlyBranch: result.month.earthlyBranch },
      day: { heavenlyStem: result.day.heavenlyStem, earthlyBranch: result.day.earthlyBranch },
      hour: includeHour
        ? { heavenlyStem: result.hour.heavenlyStem, earthlyBranch: result.hour.earthlyBranch }
        : null,
    },
    dayMaster,
    dayMasterElement,
    dayMasterElementEn: ELEMENT_KR_TO_EN[dayMasterElement],
    yinYang: STEM_YIN_YANG[dayMaster],
    elementDistribution: calculateElementDistribution(result, includeHour),
    sipsin: calculateSipsinMapping(result, includeHour),
    hanjaStrings: {
      year: `${result.year.heavenlyStem}${result.year.earthlyBranch}`,
      month: `${result.month.heavenlyStem}${result.month.earthlyBranch}`,
      day: `${result.day.heavenlyStem}${result.day.earthlyBranch}`,
      hour: includeHour ? `${result.hour.heavenlyStem}${result.hour.earthlyBranch}` : null,
    },
  }
}
