import {
  getSaju,
  getTodaySaju,
  getDayMaster,
  STEM_TO_ELEMENT,
  ELEMENT_TRAITS,
  type BirthInfo,
  type FiveElement,
  type HeavenlyStem,
} from './saju'

import {
  analyzeComprehensiveFortune,
  calculateTenGod,
  calculateBranchTenGod,
  calculateTwelveStage,
  checkBranchRelation,
  calculatePersonalizedBaseScores,
  analyzeYongShin,
  analyzeFullStemRelations,
  BRANCH_ORDER,
  type EarthlyBranch,
  type FourPillars,
  type Pillar,
  type TenGod,
  type TwelveStage,
  type SpiritStar,
  type BranchRelation,
  TEN_GOD_TRAITS,
  TWELVE_STAGE_TRAITS,
  BRANCH_RELATION_DESCRIPTIONS,
  SPIRIT_STAR_FORTUNE,
  BRANCH_TO_ELEMENT,
} from './myeongri'

// ============================================
// 강화된 운세 결과 타입
// ============================================

export type FortuneResult = {
  // 기본 정보
  date: string
  dayMaster: HeavenlyStem
  dayMasterElement: FiveElement
  todayStem: HeavenlyStem
  todayBranch: EarthlyBranch
  todayElement: FiveElement

  // 종합 점수
  overall: {
    score: number
    grade: string
    gradeDescription: string
    summary: string
    detailedReading: string
  }

  // 사주 분석 정보
  sajuAnalysis: {
    dayMasterDescription: string
    dayMasterPersonality: string
    dayMasterStrength: string
    balance: 'strong' | 'weak' | 'balanced'
    balanceDescription: string
  }

  // 오늘의 기운 분석
  todayEnergy: {
    tenGod: TenGod
    tenGodDescription: string
    tenGodKeyword: string
    twelveStage: TwelveStage
    twelveStageDescription: string
    twelveStageEnergy: number
    elementRelation: string
  }

  // 합충형파해 분석
  branchAnalysis: {
    hasRelation: boolean
    relations: {
      type: BranchRelation
      pillars: string
      effect: 'positive' | 'negative' | 'neutral'
      description: string
    }[]
    summary: string
  }

  // 신살 분석
  spiritStars: {
    active: SpiritStar[]
    descriptions: { star: SpiritStar; description: string }[]
    interpretation: string
  }

  // 카테고리별 운세 (강화)
  categories: {
    love: CategoryFortune
    money: CategoryFortune
    health: CategoryFortune
    work: CategoryFortune
  }

  // 행운 정보 (강화)
  lucky: {
    color: string
    colorReason: string
    number: number
    numberReason: string
    direction: string
    directionReason: string
    time: string
    timeReason: string
    item: string
    activity: string
  }

  // 오늘의 조언 (강화)
  advice: {
    main: string
    dos: string[]
    donts: string[]
    mindset: string
  }
}

export type CategoryFortune = {
  score: number
  grade: string
  mainMessage: string
  detailMessages: string[]
  tip: string
}

// ============================================
// 일간별 상세 정보
// ============================================

const DAY_MASTER_INFO: Record<HeavenlyStem, {
  name: string
  symbol: string
  personality: string
  strength: string
  weakness: string
  description: string
}> = {
  갑: {
    name: '갑목(甲木)',
    symbol: '🌲',
    personality: '큰 나무처럼 굳건하고 곧은 성격',
    strength: '결단력, 추진력, 리더십',
    weakness: '융통성 부족, 고집',
    description: '하늘을 향해 곧게 뻗어 올라가는 큰 나무의 기운을 지녔습니다. 정의롭고 당당하며, 어떤 역경에도 굴하지 않는 강인한 의지가 있습니다.',
  },
  을: {
    name: '을목(乙木)',
    symbol: '🌿',
    personality: '덩굴처럼 유연하고 적응력 있는 성격',
    strength: '협조성, 인내력, 적응력',
    weakness: '우유부단, 의존적',
    description: '바람에 휘어도 꺾이지 않는 풀과 덩굴의 기운입니다. 부드러움 속에 강인함이 있고, 어떤 환경에도 잘 적응합니다.',
  },
  병: {
    name: '병화(丙火)',
    symbol: '☀️',
    personality: '태양처럼 밝고 열정적인 성격',
    strength: '표현력, 사교성, 낙천적',
    weakness: '다혈질, 산만함',
    description: '세상을 밝히는 태양의 기운을 지녔습니다. 활력이 넘치고 주변을 환하게 만드는 매력이 있습니다.',
  },
  정: {
    name: '정화(丁火)',
    symbol: '🕯️',
    personality: '촛불처럼 따뜻하고 섬세한 성격',
    strength: '배려심, 창의력, 집중력',
    weakness: '예민함, 소심함',
    description: '어둠을 밝히는 촛불의 기운입니다. 작지만 꺼지지 않는 열정으로 주변을 따뜻하게 감싸는 힘이 있습니다.',
  },
  무: {
    name: '무토(戊土)',
    symbol: '⛰️',
    personality: '산처럼 듬직하고 신뢰감 있는 성격',
    strength: '안정감, 포용력, 신뢰성',
    weakness: '보수적, 느림',
    description: '우뚝 솟은 산의 기운을 지녔습니다. 변함없는 신뢰감으로 많은 사람들이 의지하는 존재입니다.',
  },
  기: {
    name: '기토(己土)',
    symbol: '🌾',
    personality: '정원처럼 부드럽고 조화로운 성격',
    strength: '중재력, 실용성, 배려심',
    weakness: '자기희생, 우유부단',
    description: '만물을 기르는 대지의 기운입니다. 모든 것을 품어 안는 포용력으로 조화를 이루어 냅니다.',
  },
  경: {
    name: '경금(庚金)',
    symbol: '⚔️',
    personality: '강철처럼 단단하고 정의로운 성격',
    strength: '실행력, 결단력, 정의감',
    weakness: '냉정함, 공격적',
    description: '담금질된 강철의 기운을 지녔습니다. 불의에 타협하지 않고 결단력 있게 행동합니다.',
  },
  신: {
    name: '신금(辛金)',
    symbol: '💎',
    personality: '보석처럼 섬세하고 완벽을 추구하는 성격',
    strength: '분석력, 심미안, 꼼꼼함',
    weakness: '까다로움, 완벽주의',
    description: '빛나는 보석의 기운입니다. 세련되고 아름다운 것을 추구하며 섬세한 감각이 뛰어납니다.',
  },
  임: {
    name: '임수(壬水)',
    symbol: '🌊',
    personality: '바다처럼 넓고 포용력 있는 성격',
    strength: '지혜, 적응력, 포용력',
    weakness: '방종, 게으름',
    description: '광대한 바다의 기운을 지녔습니다. 깊은 지혜와 포용력으로 모든 것을 담아냅니다.',
  },
  계: {
    name: '계수(癸水)',
    symbol: '💧',
    personality: '이슬처럼 맑고 순수한 성격',
    strength: '직관력, 감수성, 끈기',
    weakness: '소극적, 우울함',
    description: '맑은 샘물의 기운입니다. 순수하고 깨끗한 마음으로 깊은 통찰력을 발휘합니다.',
  },
}

// ============================================
// 신강/신약 설명
// ============================================

const BALANCE_DESCRIPTIONS = {
  strong: '사주에 비겁(비견, 겁재)과 인성(정인, 편인)이 많아 신강한 사주입니다. 자아가 강하고 독립적이며, 도전을 두려워하지 않습니다. 다만 고집이 센 면이 있으니 타인의 의견에도 귀 기울여보세요.',
  weak: '사주에 식상(식신, 상관), 재성(정재, 편재), 관성(정관, 편관)이 많아 신약한 사주입니다. 섬세하고 협조적이며, 타인을 배려하는 마음이 깊습니다. 자신의 가치를 더 인정하고 자신감을 가져보세요.',
  balanced: '사주의 오행이 비교적 균형 잡혀 중화된 사주입니다. 상황에 따라 유연하게 대처하는 능력이 있습니다. 이 균형을 잘 유지하는 것이 중요합니다.',
}

// ============================================
// 행운 아이템 & 활동
// ============================================

const LUCKY_ITEMS: Record<FiveElement, string[]> = {
  목: ['녹색 식물', '나무 소품', '책', '민트향 아이템'],
  화: ['빨간 액세서리', '양초', '핸드폰 케이스', '따뜻한 음료'],
  토: ['노란 손수건', '도자기', '황토 제품', '견과류'],
  금: ['은반지', '시계', '금속 펜', '하얀 셔츠'],
  수: ['검은 가방', '물병', '해산물', '블루 아이템'],
}

const LUCKY_ACTIVITIES: Record<FiveElement, string[]> = {
  목: ['산책하기', '독서하기', '계획 세우기', '새로운 것 배우기'],
  화: ['운동하기', '친구 만나기', '자기표현하기', '프레젠테이션'],
  토: ['정리정돈', '저축하기', '중재하기', '맛있는 식사'],
  금: ['결단 내리기', '정의로운 행동', '단호하게 거절', '명상하기'],
  수: ['휴식취하기', '수영/목욕', '여행계획', '창의적 사고'],
}

// ============================================
// 유틸리티 함수
// ============================================

// 등급 계산
function getGrade(score: number): { grade: string; description: string } {
  if (score >= 90) return { grade: '대길', description: '최고의 운! 모든 일이 순조롭습니다' }
  if (score >= 80) return { grade: '길', description: '좋은 기운이 함께합니다' }
  if (score >= 70) return { grade: '중길', description: '무난하게 좋은 하루입니다' }
  if (score >= 60) return { grade: '소길', description: '작은 행운이 함께합니다' }
  if (score >= 50) return { grade: '평', description: '평범한 하루, 신중함이 필요합니다' }
  return { grade: '주의', description: '조심해야 할 날, 무리하지 마세요' }
}

// 카테고리 등급
function getCategoryGrade(score: number): string {
  if (score >= 85) return '최상'
  if (score >= 75) return '상'
  if (score >= 65) return '중상'
  if (score >= 55) return '중'
  if (score >= 45) return '중하'
  return '하'
}

// 행운의 시간 상세
function getLuckyTimeDetail(element: FiveElement): { time: string; reason: string } {
  const times: Record<FiveElement, { time: string; reason: string }> = {
    목: { time: '오전 5시-9시 (인시~진시)', reason: '목의 기운이 가장 활발한 아침 시간대' },
    화: { time: '오전 9시-오후 1시 (사시~오시)', reason: '화의 기운이 정점에 이르는 한낮' },
    토: { time: '오후 1시-3시, 7시-9시', reason: '토의 기운이 안정되는 전환 시간대' },
    금: { time: '오후 3시-7시 (신시~유시)', reason: '금의 기운이 결실을 맺는 저녁' },
    수: { time: '오후 9시-오전 1시 (해시~자시)', reason: '수의 기운이 깊어지는 밤 시간대' },
  }
  return times[element]
}

// 행운의 숫자 상세
function getLuckyNumberDetail(dayMaster: HeavenlyStem, date: Date): { number: number; reason: string } {
  const stemIndex = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'].indexOf(dayMaster)
  const dateNum = date.getDate()
  const number = ((stemIndex + dateNum) % 9) + 1

  const element = STEM_TO_ELEMENT[dayMaster]
  const reasons: Record<FiveElement, string> = {
    목: '새로운 시작과 성장을 상징하는 숫자',
    화: '열정과 활력을 불러일으키는 숫자',
    토: '안정과 신뢰를 의미하는 숫자',
    금: '결단과 성취를 돕는 숫자',
    수: '지혜와 통찰을 부르는 숫자',
  }

  return { number, reason: reasons[element] }
}

// 사주 데이터를 FourPillars 형태로 변환
function convertToFourPillars(saju: ReturnType<typeof getSaju>): FourPillars {
  return {
    year: {
      heavenlyStem: saju.year.heavenlyStem,
      earthlyBranch: saju.year.earthlyBranch as EarthlyBranch,
    },
    month: {
      heavenlyStem: saju.month.heavenlyStem,
      earthlyBranch: saju.month.earthlyBranch as EarthlyBranch,
    },
    day: {
      heavenlyStem: saju.day.heavenlyStem,
      earthlyBranch: saju.day.earthlyBranch as EarthlyBranch,
    },
    hour: {
      heavenlyStem: saju.hour.heavenlyStem,
      earthlyBranch: saju.hour.earthlyBranch as EarthlyBranch,
    },
  }
}

// ============================================
// 카테고리별 운세 생성
// ============================================

function generateCategoryFortune(
  category: 'love' | 'money' | 'health' | 'work',
  tenGod: TenGod,
  twelveStage: TwelveStage,
  branchRelations: { type: BranchRelation; effect: string }[],
  spiritStars: SpiritStar[],
  baseScore: number
): CategoryFortune {
  const tenGodTraits = TEN_GOD_TRAITS[tenGod]
  const stageTraits = TWELVE_STAGE_TRAITS[twelveStage]

  // 기본 점수에 변동 추가
  let score = baseScore
  const detailMessages: string[] = []

  // 십신 기반 메시지
  detailMessages.push(tenGodTraits.fortune[category])

  // 12운성 에너지 반영
  const energyMod = (stageTraits.energy - 3) * 4
  score += energyMod

  // 합충형파해 반영
  for (const rel of branchRelations) {
    const relDesc = BRANCH_RELATION_DESCRIPTIONS[rel.type as BranchRelation]
    if (relDesc && relDesc.fortune[category]) {
      detailMessages.push(relDesc.fortune[category])
      if (rel.effect === 'positive') score += 5
      else if (rel.effect === 'negative') score -= 5
    }
  }

  // 신살 반영
  for (const star of spiritStars) {
    const starFortune = SPIRIT_STAR_FORTUNE[star]
    if (starFortune) {
      detailMessages.push(starFortune.fortune[category])
      if (starFortune.type === 'auspicious') score += 5
      else if (starFortune.type === 'inauspicious') score -= 5
    }
  }

  // 점수 범위 제한
  score = Math.max(30, Math.min(100, score))

  // 카테고리별 팁 생성
  const tips: Record<string, Record<string, string>> = {
    love: {
      high: '적극적으로 마음을 표현해보세요',
      medium: '상대의 마음을 먼저 헤아려보세요',
      low: '오늘은 관계보다 자기 자신에게 집중하세요',
    },
    money: {
      high: '투자나 새로운 기회를 모색해보세요',
      medium: '계획적인 소비가 좋습니다',
      low: '지출을 줄이고 저축에 집중하세요',
    },
    health: {
      high: '새로운 운동을 시작하기 좋습니다',
      medium: '규칙적인 생활 리듬을 유지하세요',
      low: '충분한 휴식이 필요합니다',
    },
    work: {
      high: '새 프로젝트를 시작하기 좋습니다',
      medium: '팀워크에 집중해보세요',
      low: '무리하지 말고 기본에 충실하세요',
    },
  }

  const tipLevel = score >= 75 ? 'high' : score >= 55 ? 'medium' : 'low'
  const tip = tips[category]?.[tipLevel] || '평온하게 하루를 보내세요'

  return {
    score,
    grade: getCategoryGrade(score),
    mainMessage: detailMessages[0] || '좋은 하루 되세요',
    detailMessages: detailMessages.slice(0, 3),
    tip,
  }
}

// ============================================
// 메인 운세 계산 함수
// ============================================

export function calculateTodayFortune(birthInfo: BirthInfo): FortuneResult {
  const userSaju = getSaju(birthInfo)
  const todaySaju = getTodaySaju()

  const dayMaster = getDayMaster(userSaju)
  const dayMasterElement = STEM_TO_ELEMENT[dayMaster]
  const todayStem = todaySaju.day.heavenlyStem
  const todayBranch = todaySaju.day.earthlyBranch as EarthlyBranch
  const todayElement = STEM_TO_ELEMENT[todayStem]

  // 사주를 FourPillars 형태로 변환
  const userPillars = convertToFourPillars(userSaju)
  const todayPillar: Pillar = {
    heavenlyStem: todayStem,
    earthlyBranch: todayBranch,
  }

  // 종합 분석 실행
  const analysis = analyzeComprehensiveFortune(dayMaster, userPillars, todayPillar)

  // 날짜 문자열
  const today = new Date()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${weekdays[today.getDay()]}요일`

  // 일간 정보
  const dayMasterInfo = DAY_MASTER_INFO[dayMaster]
  const elementTraits = ELEMENT_TRAITS[dayMasterElement]

  // 오늘의 십신
  const todayTenGod = calculateTenGod(dayMaster, todayStem)
  const todayTenGodTraits = TEN_GOD_TRAITS[todayTenGod]

  // 오늘의 12운성
  const todayTwelveStage = analysis.twelveStageAnalysis.todayStage
  const twelveStageTraits = TWELVE_STAGE_TRAITS[todayTwelveStage]

  // 합충형파해 정리
  const branchRelationsFormatted = analysis.branchRelationAnalysis.todayRelations.map(r => ({
    type: r.type,
    pillars: r.pillar,
    effect: r.effect,
    description: r.description,
  }))

  // 신살 정리
  const spiritStarsDescriptions = analysis.spiritStarAnalysis.todayActive.map(star => ({
    star,
    description: SPIRIT_STAR_FORTUNE[star]?.fortune.work || '',
  }))

  // ===== 개인화된 점수 계산 (사주 기반) =====
  const personalizedScores = calculatePersonalizedBaseScores(dayMaster, userPillars, todayPillar)

  // 용신/희신 분석
  const yongShinAnalysis = analyzeYongShin(dayMaster, userPillars, todayElement)

  // 천간 관계 분석
  const stemAnalysis = analyzeFullStemRelations(userPillars, todayStem)

  // 종합 점수 계산 (개인화된 점수 사용)
  const overallScore = personalizedScores.overall
  const gradeInfo = getGrade(overallScore)

  // 카테고리별 운세 생성 (개인화된 기본 점수 사용)
  const categories = {
    love: generateCategoryFortune('love', todayTenGod, todayTwelveStage, branchRelationsFormatted, analysis.spiritStarAnalysis.todayActive, personalizedScores.love),
    money: generateCategoryFortune('money', todayTenGod, todayTwelveStage, branchRelationsFormatted, analysis.spiritStarAnalysis.todayActive, personalizedScores.money),
    health: generateCategoryFortune('health', todayTenGod, todayTwelveStage, branchRelationsFormatted, analysis.spiritStarAnalysis.todayActive, personalizedScores.health),
    work: generateCategoryFortune('work', todayTenGod, todayTwelveStage, branchRelationsFormatted, analysis.spiritStarAnalysis.todayActive, personalizedScores.work),
  }

  // 행운 정보 (사주 기반 개인화)
  const luckyTimeInfo = getLuckyTimeDetail(dayMasterElement)
  const luckyNumberInfo = getLuckyNumberDetail(dayMaster, today)
  // 용신 오행 기반 행운 아이템 선택
  const luckyElement = yongShinAnalysis.neededElements[0] || dayMasterElement
  const luckyItems = LUCKY_ITEMS[luckyElement]
  const luckyActivities = LUCKY_ACTIVITIES[luckyElement]

  // 조언 생성
  const mainAdvice = analysis.advice[0] || twelveStageTraits.fortune.advice
  const dos: string[] = []
  const donts: string[] = []

  // 12운성 기반 조언
  if (twelveStageTraits.energy >= 4) {
    dos.push('새로운 시작을 두려워하지 마세요')
    dos.push('적극적으로 기회를 잡으세요')
  } else if (twelveStageTraits.energy <= 2) {
    dos.push('충분한 휴식을 취하세요')
    dos.push('내일을 위해 재충전하세요')
    donts.push('무리한 일정은 피하세요')
  }

  // 합충형파해 기반 조언
  const hasClash = branchRelationsFormatted.some(r => r.type === '충')
  const hasPunishment = branchRelationsFormatted.some(r => r.type === '형')
  const hasHarmony = branchRelationsFormatted.some(r => r.type === '합')

  if (hasClash) {
    donts.push('큰 결정은 미루세요')
    donts.push('갈등 상황을 피하세요')
  }
  if (hasPunishment) {
    donts.push('말실수에 주의하세요')
    donts.push('법적 문제에 조심하세요')
  }
  if (hasHarmony) {
    dos.push('협력과 팀워크가 빛나는 날입니다')
    dos.push('중요한 약속을 잡기 좋습니다')
  }

  // 신살 기반 조언
  if (analysis.spiritStarAnalysis.todayActive.includes('역마살')) {
    dos.push('여행이나 이동에 좋습니다')
  }
  if (analysis.spiritStarAnalysis.todayActive.includes('도화살')) {
    dos.push('사교 활동이 유리합니다')
    donts.push('유혹에 주의하세요')
  }
  if (analysis.spiritStarAnalysis.todayActive.includes('천을귀인')) {
    dos.push('귀인의 도움을 받을 수 있습니다')
  }

  // 용신/희신 기반 조언 추가
  if (yongShinAnalysis.todayElementEffect === 'very_good') {
    dos.push(`오늘은 용신(${todayElement})의 날! 적극적으로 행동하세요`)
  } else if (yongShinAnalysis.todayElementEffect === 'good') {
    dos.push(`${todayElement}의 기운이 당신을 돕습니다`)
  } else if (yongShinAnalysis.todayElementEffect === 'very_bad') {
    donts.push(`기신(${todayElement})의 영향이 있어 신중함이 필요합니다`)
  } else if (yongShinAnalysis.todayElementEffect === 'bad') {
    donts.push('오늘은 무리하지 않는 것이 좋습니다')
  }

  // 천간합/충 기반 조언 추가
  if (stemAnalysis.totalScore > 10) {
    dos.push('천간합의 좋은 기운이 있습니다')
  } else if (stemAnalysis.totalScore < -10) {
    donts.push('천간충의 기운이 있어 갈등에 주의하세요')
  }

  // 마인드셋 조언
  const mindsetByBalance = {
    strong: '때로는 양보하는 것도 지혜입니다. 주변의 의견에 귀 기울여보세요.',
    weak: '당신의 가치를 믿으세요. 오늘은 자신감을 가지고 행동해보세요.',
    balanced: '균형을 유지하며 상황에 맞게 유연하게 대처하세요.',
  }

  // 오행 관계 설명
  const elementRelationDesc = getElementRelationDescription(dayMasterElement, todayElement)

  // 상세 운세 텍스트 생성 (용신/희신 및 천간 관계 포함)
  const detailedReading = `
${dayMasterInfo.name}인 당신은 ${dayMasterInfo.personality}의 특성을 지니고 있습니다.
오늘은 ${todayStem}${todayBranch}일로, ${todayTenGod}의 기운이 작용합니다.
${todayTenGodTraits.positive}

【용신 분석】
${yongShinAnalysis.todayElementDescription}
당신에게 필요한 오행: ${yongShinAnalysis.neededElements.join(', ')}

【천간 관계】
${stemAnalysis.summary}

【12운성】
${todayTwelveStage}에 해당하여, ${twelveStageTraits.description}
${twelveStageTraits.fortune.general}

${branchRelationsFormatted.length > 0
  ? `【지지 관계】\n${branchRelationsFormatted.map(r => `${r.pillars}과 ${r.type}의 관계`).join(', ')}가 있습니다.\n${analysis.branchRelationAnalysis.summary}`
  : '오늘은 지지 간 특별한 충돌이 없어 무난합니다.'}

${analysis.spiritStarAnalysis.todayActive.length > 0
  ? `【발동 신살】\n${analysis.spiritStarAnalysis.todayActive.join(', ')}. ${analysis.spiritStarAnalysis.interpretation}`
  : ''}
`.trim()

  return {
    date: dateStr,
    dayMaster,
    dayMasterElement,
    todayStem,
    todayBranch,
    todayElement,

    overall: {
      score: overallScore,
      grade: gradeInfo.grade,
      gradeDescription: gradeInfo.description,
      summary: analysis.dailySummary,
      detailedReading,
    },

    sajuAnalysis: {
      dayMasterDescription: dayMasterInfo.description,
      dayMasterPersonality: dayMasterInfo.personality,
      dayMasterStrength: dayMasterInfo.strength,
      balance: analysis.tenGodAnalysis.balance,
      balanceDescription: BALANCE_DESCRIPTIONS[analysis.tenGodAnalysis.balance],
    },

    todayEnergy: {
      tenGod: todayTenGod,
      tenGodDescription: todayTenGodTraits.positive,
      tenGodKeyword: todayTenGodTraits.keyword,
      twelveStage: todayTwelveStage,
      twelveStageDescription: twelveStageTraits.description,
      twelveStageEnergy: twelveStageTraits.energy,
      elementRelation: elementRelationDesc,
    },

    branchAnalysis: {
      hasRelation: branchRelationsFormatted.length > 0,
      relations: branchRelationsFormatted,
      summary: analysis.branchRelationAnalysis.summary,
    },

    spiritStars: {
      active: analysis.spiritStarAnalysis.todayActive,
      descriptions: spiritStarsDescriptions,
      interpretation: analysis.spiritStarAnalysis.interpretation,
    },

    categories,

    lucky: {
      // 용신 오행 기반 행운의 색상
      color: ELEMENT_TRAITS[luckyElement].luckyColor,
      colorReason: `당신에게 필요한 ${luckyElement}의 기운을 북돋우는 색상`,
      number: luckyNumberInfo.number,
      numberReason: luckyNumberInfo.reason,
      // 용신 오행 기반 행운의 방향
      direction: ELEMENT_TRAITS[luckyElement].direction,
      directionReason: `${luckyElement}의 기운이 모이는 방향`,
      time: luckyTimeInfo.time,
      timeReason: luckyTimeInfo.reason,
      // 사주 기반 아이템 선택 (일지 인덱스 활용)
      item: luckyItems[BRANCH_ORDER.indexOf(userPillars.day.earthlyBranch) % luckyItems.length] || luckyItems[0]!,
      // 사주 기반 활동 선택 (월지 인덱스 활용)
      activity: luckyActivities[BRANCH_ORDER.indexOf(userPillars.month.earthlyBranch) % luckyActivities.length] || luckyActivities[0]!,
    },

    advice: {
      main: mainAdvice,
      dos: dos.slice(0, 3),
      donts: donts.slice(0, 3),
      mindset: mindsetByBalance[analysis.tenGodAnalysis.balance],
    },
  }
}

// 오행 관계 설명
function getElementRelationDescription(myElement: FiveElement, otherElement: FiveElement): string {
  if (myElement === otherElement) {
    return `오늘은 같은 ${myElement}의 기운으로, 자아가 강해지는 날입니다.`
  }

  const generating: Record<FiveElement, FiveElement> = {
    목: '화', 화: '토', 토: '금', 금: '수', 수: '목',
  }
  const controlling: Record<FiveElement, FiveElement> = {
    목: '토', 토: '수', 수: '화', 화: '금', 금: '목',
  }

  if (generating[myElement] === otherElement) {
    return `${myElement}이 ${otherElement}를 생(生)하는 날로, 표현과 결과물에 에너지가 쓰입니다.`
  }
  if (generating[otherElement] === myElement) {
    return `${otherElement}가 ${myElement}를 생(生)해주는 날로, 도움과 지원을 받기 좋습니다.`
  }
  if (controlling[myElement] === otherElement) {
    return `${myElement}이 ${otherElement}를 극(克)하는 날로, 재물이나 성과를 취하기 좋습니다.`
  }
  if (controlling[otherElement] === myElement) {
    return `${otherElement}가 ${myElement}를 극(克)하는 날로, 압박이나 책임이 따를 수 있습니다.`
  }

  return '오행이 조화를 이루는 날입니다.'
}

// 포맷된 날짜 문자열
export function getFormattedDate(): string {
  const today = new Date()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${weekdays[today.getDay()]}요일`
}

// 기존 호환성을 위한 re-export
export {
  STEM_TO_ELEMENT,
  ELEMENT_TRAITS,
  type BirthInfo,
  type FiveElement,
  type HeavenlyStem,
}

export type {
  TenGod,
  TwelveStage,
  SpiritStar,
  EarthlyBranch,
}
