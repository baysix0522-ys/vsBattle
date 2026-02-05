import OpenAI from 'openai'

// API 키가 유효한지 체크 (플레이스홀더가 아닌지)
function isValidApiKey(key: string | undefined): boolean {
  if (!key) return false
  // 플레이스홀더 패턴 체크
  if (key.includes('your') || key.includes('YOUR')) return false
  if (key === 'sk-your-openai-api-key') return false
  if (!key.startsWith('sk-')) return false
  return true
}

// 더미 데이터 사용 여부 (USE_DUMMY_DATA=true이거나 유효한 API 키가 없는 경우)
const USE_DUMMY_DATA = process.env.USE_DUMMY_DATA === 'true' || !isValidApiKey(process.env.OPENAI_API_KEY)

console.log('[SAJU] 더미 데이터 모드:', USE_DUMMY_DATA, '(API Key valid:', isValidApiKey(process.env.OPENAI_API_KEY), ')')

// Lazy initialization - API 호출 시점에 클라이언트 생성
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

export type BirthInfo = {
  birthDate: string  // YYYY-MM-DD
  birthTime?: string | undefined // HH:MM (nullable if unknown)
  isTimeUnknown: boolean
  gender: 'male' | 'female'
}

export type SajuPillar = {
  heavenlyStem: string  // 천간 (갑을병정무기경신임계)
  earthlyBranch: string // 지지 (자축인묘진사오미신유술해)
}

export type SajuPillars = {
  year: SajuPillar
  month: SajuPillar
  day: SajuPillar
  hour: SajuPillar | null // 시주 (시간 모를 경우 null)
}

export type BasicAnalysis = {
  dayMaster: string           // 일간 (갑을병정무기경신임계)
  dayMasterElement: string    // 일간 오행 (목화토금수)
  yinYang: 'yang' | 'yin'     // 음양
  balance: 'strong' | 'weak' | 'balanced'  // 신강/신약/중화
  yongShin: string            // 용신 (필요한 오행)
  heeShin: string             // 희신 (보조 오행)
  giShin: string              // 기신 (피해야 할 오행)
  geukGuk: string             // 격국 (ex: 정관격, 편재격 등)
  elementDistribution: {
    wood: number   // 목
    fire: number   // 화
    earth: number  // 토
    metal: number  // 금
    water: number  // 수
  }
}

export type BattleStat = {
  score: number    // 0-100
  grade: string    // 대길, 길, 중길, 소길, 평
}

export type BattleStats = {
  money: BattleStat    // 금전운
  love: BattleStat     // 연애운/부부운
  children: BattleStat // 자식운
  career: BattleStat   // 직장/명예운
  study: BattleStat    // 학업/지혜운
  health: BattleStat   // 건강운
}

export type DetailedReport = {
  summary: string           // 전체 사주 요약 (2-3문장)
  personality: string       // 성격 분석
  moneyAnalysis: string     // 금전운 상세
  loveAnalysis: string      // 연애/부부운 상세
  childrenAnalysis: string  // 자식운 상세
  careerAnalysis: string    // 직장/명예운 상세
  studyAnalysis: string     // 학업/지혜운 상세
  healthAnalysis: string    // 건강운 상세
}

export type Advice = {
  mainAdvice: string      // 주요 조언
  luckyColor: string      // 행운의 색
  luckyNumber: number     // 행운의 숫자
  luckyDirection: string  // 좋은 방향
}

export type SajuAnalysisResult = {
  birthInfo: BirthInfo
  pillars: SajuPillars
  basic: BasicAnalysis
  battleStats: BattleStats
  report: DetailedReport
  advice: Advice
}

// ============================================
// OpenAI 프롬프트
// ============================================

function buildSajuPrompt(birthInfo: BirthInfo): string {
  const timeInfo = birthInfo.isTimeUnknown
    ? '태어난 시간: 모름 (시주 제외하고 분석)'
    : `태어난 시간: ${birthInfo.birthTime}`

  return `당신은 40년 경력의 명리학(사주팔자) 전문가입니다.
다음 생년월일시 정보를 바탕으로 사주를 분석해주세요.

생년월일: ${birthInfo.birthDate}
${timeInfo}
성별: ${birthInfo.gender === 'male' ? '남성' : '여성'}

다음 JSON 형식으로 정확히 응답해주세요. JSON 외 다른 텍스트는 포함하지 마세요:

{
  "pillars": {
    "year": { "heavenlyStem": "천간(갑~계)", "earthlyBranch": "지지(자~해)" },
    "month": { "heavenlyStem": "천간", "earthlyBranch": "지지" },
    "day": { "heavenlyStem": "천간", "earthlyBranch": "지지" },
    "hour": ${birthInfo.isTimeUnknown ? 'null' : '{ "heavenlyStem": "천간", "earthlyBranch": "지지" }'}
  },
  "basic": {
    "dayMaster": "일간(갑~계 중 하나)",
    "dayMasterElement": "오행(목/화/토/금/수)",
    "yinYang": "yang 또는 yin",
    "balance": "strong/weak/balanced 중 하나",
    "yongShin": "용신 오행",
    "heeShin": "희신 오행",
    "giShin": "기신 오행",
    "geukGuk": "격국 이름(ex: 정관격)",
    "elementDistribution": {
      "wood": 0-8,
      "fire": 0-8,
      "earth": 0-8,
      "metal": 0-8,
      "water": 0-8
    }
  },
  "battleStats": {
    "money": { "score": 0-100, "grade": "대길/길/중길/소길/평" },
    "love": { "score": 0-100, "grade": "대길/길/중길/소길/평" },
    "children": { "score": 0-100, "grade": "대길/길/중길/소길/평" },
    "career": { "score": 0-100, "grade": "대길/길/중길/소길/평" },
    "study": { "score": 0-100, "grade": "대길/길/중길/소길/평" },
    "health": { "score": 0-100, "grade": "대길/길/중길/소길/평" }
  },
  "report": {
    "summary": "전체 사주를 2-3문장으로 요약",
    "personality": "성격과 기질 분석 (50-100자)",
    "moneyAnalysis": "금전운/재물운 분석 (50-100자)",
    "loveAnalysis": "연애운/부부운 분석 (50-100자)",
    "childrenAnalysis": "자식운 분석 (50-100자)",
    "careerAnalysis": "직장운/명예운 분석 (50-100자)",
    "studyAnalysis": "학업운/지혜운 분석 (50-100자)",
    "healthAnalysis": "건강운 분석, 주의할 부위 포함 (50-100자)"
  },
  "advice": {
    "mainAdvice": "인생에서 가장 중요한 조언 1-2문장",
    "luckyColor": "행운의 색(용신에 맞게)",
    "luckyNumber": 1-99,
    "luckyDirection": "좋은 방향(동/서/남/북/동남/동북/서남/서북)"
  }
}

점수 기준:
- 85-100: 대길 (매우 좋은 운)
- 70-84: 길 (좋은 운)
- 55-69: 중길 (보통 좋음)
- 40-54: 소길 (약간 좋음)
- 0-39: 평 (보통/주의 필요)

분석 시 다음 사항을 고려해주세요:
1. 사주 원국의 오행 균형과 신강/신약
2. 십신 배치와 격국
3. 천간 합충, 지지 합충형파해
4. 12운성
5. 시주가 없는 경우, 년월일주만으로 분석하되 시주 관련 판단은 보수적으로

정확한 만세력 계산을 기반으로 분석해주세요.`
}

// ============================================
// 더미 데이터 생성기
// ============================================

const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계']
const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해']
const ELEMENTS = ['목', '화', '토', '금', '수']
const DIRECTIONS = ['동', '서', '남', '북', '동남', '동북', '서남', '서북']
const COLORS = ['빨강', '파랑', '초록', '노랑', '흰색', '검정', '보라', '주황']
const GEUK_GUKS = ['정관격', '편관격', '정재격', '편재격', '정인격', '편인격', '식신격', '상관격', '비견격', '겁재격']

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function getRandomScore(): { score: number; grade: string } {
  const score = Math.floor(Math.random() * 60) + 40  // 40-99 범위
  let grade: string
  if (score >= 85) grade = '대길'
  else if (score >= 70) grade = '길'
  else if (score >= 55) grade = '중길'
  else if (score >= 40) grade = '소길'
  else grade = '평'
  return { score, grade }
}

function generateDummySajuResult(birthInfo: BirthInfo): SajuAnalysisResult {
  // 생년월일 기반으로 시드 생성 (같은 생년월일은 같은 결과)
  const dateNum = parseInt(birthInfo.birthDate.replace(/-/g, ''))
  const seed = dateNum % 10

  const dayMaster = HEAVENLY_STEMS[(dateNum % 10)]!
  const dayBranch = EARTHLY_BRANCHES[(dateNum % 12)]!

  const pillars: SajuPillars = {
    year: {
      heavenlyStem: HEAVENLY_STEMS[(seed + 0) % 10]!,
      earthlyBranch: EARTHLY_BRANCHES[(seed + 0) % 12]!,
    },
    month: {
      heavenlyStem: HEAVENLY_STEMS[(seed + 3) % 10]!,
      earthlyBranch: EARTHLY_BRANCHES[(seed + 4) % 12]!,
    },
    day: {
      heavenlyStem: dayMaster,
      earthlyBranch: dayBranch,
    },
    hour: birthInfo.isTimeUnknown ? null : {
      heavenlyStem: HEAVENLY_STEMS[(seed + 7) % 10]!,
      earthlyBranch: EARTHLY_BRANCHES[(seed + 9) % 12]!,
    },
  }

  // 오행 분포 생성
  const totalElements = birthInfo.isTimeUnknown ? 6 : 8
  const distribution = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  const keys = Object.keys(distribution) as (keyof typeof distribution)[]
  let remaining = totalElements
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!
    const value = Math.floor(Math.random() * (remaining - (keys.length - i - 1)))
    distribution[key] = value
    remaining -= value
  }
  distribution[keys[keys.length - 1]!] = remaining

  const basic: BasicAnalysis = {
    dayMaster,
    dayMasterElement: ELEMENTS[(seed + 2) % 5]!,
    yinYang: seed % 2 === 0 ? 'yang' : 'yin',
    balance: (['strong', 'weak', 'balanced'] as const)[seed % 3]!,
    yongShin: ELEMENTS[(seed + 3) % 5]!,
    heeShin: ELEMENTS[(seed + 4) % 5]!,
    giShin: ELEMENTS[(seed + 1) % 5]!,
    geukGuk: GEUK_GUKS[(seed) % GEUK_GUKS.length]!,
    elementDistribution: distribution,
  }

  // 배틀 스탯 생성 (생년월일 기반으로 일관된 값)
  const moneyScore = 40 + ((dateNum * 7) % 60)
  const loveScore = 40 + ((dateNum * 11) % 60)
  const childrenScore = 40 + ((dateNum * 13) % 60)
  const careerScore = 40 + ((dateNum * 17) % 60)
  const studyScore = 40 + ((dateNum * 19) % 60)
  const healthScore = 40 + ((dateNum * 23) % 60)

  const getGrade = (s: number) => {
    if (s >= 85) return '대길'
    if (s >= 70) return '길'
    if (s >= 55) return '중길'
    if (s >= 40) return '소길'
    return '평'
  }

  const battleStats: BattleStats = {
    money: { score: moneyScore, grade: getGrade(moneyScore) },
    love: { score: loveScore, grade: getGrade(loveScore) },
    children: { score: childrenScore, grade: getGrade(childrenScore) },
    career: { score: careerScore, grade: getGrade(careerScore) },
    study: { score: studyScore, grade: getGrade(studyScore) },
    health: { score: healthScore, grade: getGrade(healthScore) },
  }

  const report: DetailedReport = {
    summary: `${dayMaster}일간으로 ${basic.dayMasterElement}의 기운을 타고나셨습니다. ${basic.geukGuk}의 사주로, ${basic.balance === 'strong' ? '신강한 기운' : basic.balance === 'weak' ? '신약한 기운' : '중화된 기운'}을 지니고 있습니다.`,
    personality: `${DAY_MASTER_TRAITS[dayMaster] ?? ''} 기본적으로 ${basic.yinYang === 'yang' ? '활동적이고 적극적인' : '신중하고 내향적인'} 성향이 강합니다.`,
    moneyAnalysis: `${basic.yongShin}의 기운을 잘 활용하면 재물운이 상승합니다. ${battleStats.money.grade}의 금전운으로, ${moneyScore >= 70 ? '재물 복이 있는' : '꾸준한 노력이 필요한'} 사주입니다.`,
    loveAnalysis: `${battleStats.love.grade}의 연애운입니다. ${loveScore >= 70 ? '좋은 인연을 만날 가능성이 높으며' : '인연 복을 키우기 위해 노력이 필요하며'}, 상대방을 이해하는 자세가 중요합니다.`,
    childrenAnalysis: `자식운은 ${battleStats.children.grade}입니다. ${childrenScore >= 70 ? '자녀와 좋은 관계를 유지할 수 있는' : '자녀 교육에 특별한 관심이 필요한'} 사주입니다.`,
    careerAnalysis: `직장운/명예운은 ${battleStats.career.grade}입니다. ${basic.geukGuk}의 특성상 ${careerScore >= 70 ? '리더십을 발휘하기 좋은' : '꾸준한 실력 향상이 필요한'} 직장 생활이 예상됩니다.`,
    studyAnalysis: `학업운은 ${battleStats.study.grade}입니다. ${studyScore >= 70 ? '지적 호기심이 강하고 학습 능력이 뛰어난' : '집중력을 키우면 더 좋은 성과를 낼 수 있는'} 사주입니다.`,
    healthAnalysis: `건강운은 ${battleStats.health.grade}입니다. ${basic.giShin}의 기운이 과할 경우 건강에 유의해야 하며, 특히 ${healthScore < 60 ? '스트레스 관리와 충분한 휴식이' : '규칙적인 운동이'} 중요합니다.`,
  }

  const advice: Advice = {
    mainAdvice: `${basic.yongShin}의 기운을 보충하는 것이 좋습니다. ${basic.giShin}의 기운은 피하시고, 매사에 긍정적인 마음가짐을 유지하세요.`,
    luckyColor: COLORS[(seed + 2) % COLORS.length]!,
    luckyNumber: ((dateNum % 9) + 1) * ((seed % 9) + 1),
    luckyDirection: DIRECTIONS[(seed) % DIRECTIONS.length]!,
  }

  console.log('[SAJU] 더미 데이터 사용 - 생년월일:', birthInfo.birthDate, '일주:', dayMaster + dayBranch)

  return {
    birthInfo,
    pillars,
    basic,
    battleStats,
    report,
    advice,
  }
}

// ============================================
// 메인 분석 함수
// ============================================

export async function analyzeSaju(birthInfo: BirthInfo): Promise<SajuAnalysisResult> {
  // 더미 데이터 모드인 경우 바로 반환
  if (USE_DUMMY_DATA) {
    console.log('[SAJU] 더미 데이터 모드로 실행 중...')
    // 약간의 딜레이를 줘서 실제 분석하는 느낌
    await new Promise(resolve => setTimeout(resolve, 1000))
    return generateDummySajuResult(birthInfo)
  }

  const prompt = buildSajuPrompt(birthInfo)

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: '당신은 정확한 사주팔자 분석을 제공하는 명리학 전문가입니다. 항상 유효한 JSON 형식으로만 응답합니다.',
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
    const result = JSON.parse(content) as {
      pillars: SajuPillars
      basic: BasicAnalysis
      battleStats: BattleStats
      report: DetailedReport
      advice: Advice
    }

    return {
      birthInfo,
      pillars: result.pillars,
      basic: result.basic,
      battleStats: result.battleStats,
      report: result.report,
      advice: result.advice,
    }
  } catch {
    throw new Error('사주 분석 결과 파싱 실패')
  }
}

// ============================================
// 대결 케미스트리 분석
// ============================================

export type ChemistryResult = {
  type: '천생연분' | '숙명의라이벌' | '일반'
  stemRelation: {
    type: '합' | '충' | '없음'
    description: string
  }
  compatibility: number  // 0-100
  description: string
}

// 천간합 (갑기, 을경, 병신, 정임, 무계)
const STEM_COMBINATIONS: [string, string][] = [
  ['갑', '기'], ['을', '경'], ['병', '신'], ['정', '임'], ['무', '계']
]

// 천간충 (갑경, 을신, 병임, 정계)
const STEM_CLASHES: [string, string][] = [
  ['갑', '경'], ['을', '신'], ['병', '임'], ['정', '계']
]

export function analyzeChemistry(
  dayMaster1: string,
  dayMaster2: string
): ChemistryResult {
  // 천간합 체크
  for (const [a, b] of STEM_COMBINATIONS) {
    if ((dayMaster1 === a && dayMaster2 === b) || (dayMaster1 === b && dayMaster2 === a)) {
      return {
        type: '천생연분',
        stemRelation: {
          type: '합',
          description: `${dayMaster1}${dayMaster2}합 - 서로를 완성시키는 운명적 조합`,
        },
        compatibility: 95,
        description: '두 사람의 일간이 천간합을 이룹니다. 서로의 부족한 점을 채워주는 천생연분의 인연입니다!',
      }
    }
  }

  // 천간충 체크
  for (const [a, b] of STEM_CLASHES) {
    if ((dayMaster1 === a && dayMaster2 === b) || (dayMaster1 === b && dayMaster2 === a)) {
      return {
        type: '숙명의라이벌',
        stemRelation: {
          type: '충',
          description: `${dayMaster1}${dayMaster2}충 - 강렬한 에너지가 부딪히는 관계`,
        },
        compatibility: 45,
        description: '두 사람의 일간이 천간충을 이룹니다. 서로 자극을 주고받는 숙명의 라이벌 관계입니다!',
      }
    }
  }

  // 일반적인 관계
  return {
    type: '일반',
    stemRelation: {
      type: '없음',
      description: '특별한 천간 관계 없음',
    },
    compatibility: 65,
    description: '두 사람 사이에 특별한 천간합이나 충은 없지만, 각자의 장점을 발휘할 수 있는 관계입니다.',
  }
}

// ============================================
// 대결 결과 계산
// ============================================

export type BattleRound = {
  id: string
  name: string
  icon: string
  challenger: BattleStat
  opponent: BattleStat
  winner: 'challenger' | 'opponent' | 'draw'
  scoreDiff: number
}

export type BattleResult = {
  rounds: BattleRound[]
  challengerWins: number
  opponentWins: number
  draws: number
  winner: 'challenger' | 'opponent' | 'draw'
  chemistry: ChemistryResult
}

const BATTLE_ROUNDS = [
  { id: 'money', name: '금전운', icon: '💰', statKey: 'money' as const },
  { id: 'love', name: '연애운', icon: '💕', statKey: 'love' as const },
  { id: 'children', name: '자식운', icon: '👶', statKey: 'children' as const },
  { id: 'career', name: '직장운', icon: '💼', statKey: 'career' as const },
  { id: 'study', name: '학업운', icon: '📚', statKey: 'study' as const },
  { id: 'health', name: '건강운', icon: '💪', statKey: 'health' as const },
]

export function calculateBattleResult(
  challengerStats: BattleStats,
  opponentStats: BattleStats,
  challengerDayMaster: string,
  opponentDayMaster: string
): BattleResult {
  const rounds: BattleRound[] = []
  let challengerWins = 0
  let opponentWins = 0
  let draws = 0

  // 디버깅용 로그
  console.log('[CALC] challengerStats type:', typeof challengerStats)
  console.log('[CALC] opponentStats type:', typeof opponentStats)

  for (const round of BATTLE_ROUNDS) {
    const challengerStat = challengerStats?.[round.statKey] || { score: 50, grade: '평' }
    const opponentStat = opponentStats?.[round.statKey] || { score: 50, grade: '평' }
    const scoreDiff = (challengerStat?.score || 50) - (opponentStat?.score || 50)

    let winner: 'challenger' | 'opponent' | 'draw'
    if (Math.abs(scoreDiff) <= 3) {
      winner = 'draw'
      draws++
    } else if (scoreDiff > 0) {
      winner = 'challenger'
      challengerWins++
    } else {
      winner = 'opponent'
      opponentWins++
    }

    rounds.push({
      id: round.id,
      name: round.name,
      icon: round.icon,
      challenger: challengerStat,
      opponent: opponentStat,
      winner,
      scoreDiff: Math.abs(scoreDiff),
    })
  }

  // 최종 승자 결정
  let finalWinner: 'challenger' | 'opponent' | 'draw'
  if (challengerWins > opponentWins) {
    finalWinner = 'challenger'
  } else if (opponentWins > challengerWins) {
    finalWinner = 'opponent'
  } else {
    finalWinner = 'draw'
  }

  // 케미스트리 분석
  const chemistry = analyzeChemistry(challengerDayMaster, opponentDayMaster)

  return {
    rounds,
    challengerWins,
    opponentWins,
    draws,
    winner: finalWinner,
    chemistry,
  }
}

// ============================================
// 일주 표현 (60갑자)
// ============================================

export function formatIlju(dayMaster: string, dayBranch: string): string {
  return `${dayMaster}${dayBranch}`
}

// 일간 심볼
export const DAY_MASTER_SYMBOLS: Record<string, string> = {
  갑: '🌲',
  을: '🌿',
  병: '☀️',
  정: '🕯️',
  무: '⛰️',
  기: '🌾',
  경: '⚔️',
  신: '💎',
  임: '🌊',
  계: '💧',
}

// 일간 특성 간단 설명
export const DAY_MASTER_TRAITS: Record<string, string> = {
  갑: '나무의 기운, 강직하고 진취적',
  을: '풀의 기운, 유연하고 적응력 있음',
  병: '태양의 기운, 밝고 열정적',
  정: '촛불의 기운, 섬세하고 지적',
  무: '산의 기운, 묵직하고 신뢰감',
  기: '밭의 기운, 포용적이고 실용적',
  경: '쇠의 기운, 결단력 있고 강인',
  신: '보석의 기운, 예리하고 완벽주의',
  임: '바다의 기운, 지혜롭고 포용력',
  계: '비의 기운, 총명하고 민첩',
}
