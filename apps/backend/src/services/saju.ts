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
  reason: string   // 원국의 어떤 요소에 근거한 1-2문장
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

// 십이운성 (12 stages of life)
export type TwelveStages = {
  year: string
  month: string
  day: string
  hour: string | null
}

// 신살 (special stars)
export type SpecialStars = {
  year: string[]
  month: string[]
  day: string[]
  hour: string[] | null
}

// 귀인 (noble people)
export type NoblePeople = {
  year: string[]
  month: string[]
  day: string[]
  hour: string[] | null
}

// 대운 항목
export type DaewoonEntry = {
  stem: string
  branch: string
  startAge: number
  endAge: number
  element: string
  brief: string
}

// 프리미엄 분석 결과
export type PremiumAnalysis = {
  destinyPartner: {
    personality: string
    occupation: string
    appearance: string
    traits: string[]
    compatibility: string
  }
  wealthByPeriod: {
    youth: { period: string; level: number; description: string }
    earlyAdult: { period: string; level: number; description: string }
    midLife: { period: string; level: number; description: string }
    lateLife: { period: string; level: number; description: string }
  }
  lifeCrises: Array<{
    title: string
    description: string
    period: string
  }>
}

export type SajuAnalysisResult = {
  birthInfo: BirthInfo
  pillars: SajuPillars
  sipsin: SipsinMapping | null
  basic: BasicAnalysis
  currentFortune: CurrentFortune | null
  battleStats: BattleStats
  report: DetailedReport
  advice: Advice
  twelveStages: TwelveStages | null
  specialStars: SpecialStars | null
  noblePeople: NoblePeople | null
  daewoonTable: DaewoonEntry[] | null
  balanceScore: number | null
}

// 십신 매핑
export type SipsinMapping = {
  year: { stem: string; branch: string }
  month: { stem: string; branch: string }
  day: { stem: string; branch: string }
  hour: { stem: string; branch: string } | null
}

// 현재 운세 (대운/세운)
export type CurrentFortune = {
  daewoon: {
    stem: string
    branch: string
    startAge: number
    endAge: number
    description: string
  }
  sewoon2026: {
    stem: string
    branch: string
    description: string
  }
}

// 대결 비교 분석 타입
export type ComparisonRound = {
  category: string
  narrative: string
  advantage: 'challenger' | 'opponent' | 'even'
}

export type ComparisonAnalysis = {
  rounds: ComparisonRound[]
  overallNarrative: string
  chemistryNarrative: string
  winnerCommentary: string
}

// ============================================
// OpenAI 프롬프트
// ============================================

function buildSajuPrompt(birthInfo: BirthInfo, nickname: string): string {
  const timeInfo = birthInfo.isTimeUnknown
    ? '태어난 시간: 모름 (시주 제외하고 분석)'
    : `태어난 시간: ${birthInfo.birthTime}`

  return `당신은 50년 경력의 명리학(사주팔자) 대가입니다.
정확한 만세력 계산을 기반으로 다음 생년월일시의 사주를 분석하세요.

## 입력 정보
- 이름(닉네임): ${nickname}
- 생년월일: ${birthInfo.birthDate} (양력)
- ${timeInfo}
- 성별: ${birthInfo.gender === 'male' ? '남성' : '여성'}

## 분석 요구사항

### 1단계: 사주 원국 세우기
- 만세력에 기반하여 년주, 월주, 일주${birthInfo.isTimeUnknown ? '' : ', 시주'}를 정확히 산출
- 각 기둥의 천간/지지 표기

### 2단계: 십신(十神) 배치
- 일간을 기준으로 모든 천간/지지의 십신 관계를 분석
- 십신: 비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인

### 3단계: 오행 분석
- 원국의 오행 분포(목화토금수)를 개수로 정확히 산출
- 신강/신약/중화 판단 근거
- 용신(用神), 희신(喜神), 기신(忌神) 도출 근거

### 4단계: 격국(格局)
- 월지 기준 격국 판단

### 5단계: 대운(大運) / 세운(歲運)
- 현재 대운 (10년 단위)
- 2026년 세운 분석

### 6단계: 배틀 스탯 (대결용 수치화)
- 6개 영역 점수(0-100)와 등급
- 점수는 원국 + 현재 대운/세운을 종합 반영
- 각 점수에 대한 근거를 1문장으로 작성

### 7단계: 십이운성 (十二運星)
- 일간 기준 각 지지(년지/월지/일지/시지)의 12운성 산출
- 장생/목욕/관대/건록/제왕/쇠/병/사/묘/절/태/양 중 하나

### 8단계: 신살 (神殺)
- 주요 신살 판별: 역마살, 화개살, 도화살, 망신살, 백호살, 겁살, 재살 등
- 각 기둥(년/월/일/시)별로 해당 신살 배열

### 9단계: 귀인 (貴人)
- 주요 귀인 판별: 천을귀인, 문창귀인, 태극귀인, 천주귀인, 월덕귀인, 천덕귀인 등
- 각 기둥(년/월/일/시)별로 해당 귀인 배열

### 10단계: 대운표 (大運表)
**대운 시작 나이 계산법:**
1. 양년생(갑/병/무/경/임) 남자 또는 음년생(을/정/기/신/계) 여자 → **순행** (월주 다음 간지부터)
2. 음년생 남자 또는 양년생 여자 → **역행** (월주 이전 간지부터)
3. 대운 시작 나이: 생일에서 다음(순행)/이전(역행) 절기까지의 일수 ÷ 3 = 대운 시작 나이 (반올림, 1~9세 범위)
4. 이후 10년 간격으로 8개 대운 산출
- 각 대운의 천간/지지, 시작나이, 종료나이(시작나이+9), 오행, 핵심 1문장
- **주의: 시작 나이는 사람마다 다릅니다 (1~9세). 반드시 위 계산법으로 산출하세요.**

### 11단계: 신강신약 점수
- balanceScore: 1(극약)~7(극왕) 사이 실수
- 4=중화, 1~3=신약 계열, 5~7=신강 계열
- 소수점 한 자리까지 (예: 5.5)

## 응답 형식 (JSON만, 다른 텍스트 금지)

★★★ 매우 중요: report 섹션 작성 규칙 ★★★
1. 모든 풀이에서 "${nickname}님"이라고 이름을 직접 불러서 작성하세요.
   - 나쁜 예: "이 사주는 부드럽고 유연한 성격입니다"
   - 좋은 예: "${nickname}님은 을목(乙木) 일간으로 태어나, 마치 봄날의 넝쿨처럼 부드럽고 유연한 적응력을 타고나셨습니다."
2. 반드시 사주 원국(천간/지지/십신/오행)을 인용하며 "왜 그런지" 근거를 밝혀주세요.
   - 나쁜 예: "금전운이 좋습니다"
   - 좋은 예: "${nickname}님의 월주에 정재(正財)가 자리잡고 있어 안정적 수입원이 형성되기 좋은 구조입니다. 다만 일지의 편인이 재성을 극하므로, 지나친 투자보다는 꾸준한 저축이 더 큰 재물을 만들어 줍니다."
3. 각 분석은 전문적이되 쉽게 읽히도록, 비유와 한자 원문을 적절히 섞어주세요.
4. personality, summary 등 모든 텍스트 필드에서 위 규칙을 지키세요.

{
  "pillars": {
    "year": { "heavenlyStem": "천간(갑~계)", "earthlyBranch": "지지(자~해)" },
    "month": { "heavenlyStem": "천간", "earthlyBranch": "지지" },
    "day": { "heavenlyStem": "천간", "earthlyBranch": "지지" },
    "hour": ${birthInfo.isTimeUnknown ? 'null' : '{ "heavenlyStem": "천간", "earthlyBranch": "지지" }'}
  },
  "sipsin": {
    "year": { "stem": "십신명", "branch": "십신명" },
    "month": { "stem": "십신명", "branch": "십신명" },
    "day": { "stem": "비견(본인)", "branch": "십신명" },
    "hour": ${birthInfo.isTimeUnknown ? 'null' : '{ "stem": "십신명", "branch": "십신명" }'}
  },
  "basic": {
    "dayMaster": "일간(갑~계 중 하나)",
    "dayMasterElement": "오행(목/화/토/금/수)",
    "yinYang": "yang 또는 yin",
    "balance": "strong/weak/balanced 중 하나",
    "balanceReason": "신강/신약 판단 근거 - 원국의 어떤 글자들이 일간을 돕거나 약화시키는지 구체적으로 2-3문장",
    "yongShin": "용신 오행",
    "yongShinReason": "용신 선정 근거 - 왜 이 오행이 필요한지 1-2문장",
    "heeShin": "희신 오행",
    "giShin": "기신 오행",
    "geukGuk": "격국 이름(ex: 정관격)",
    "geukGukReason": "격국 판단 근거 - 월지에서 어떤 십신이 투출했는지 1-2문장",
    "elementDistribution": {
      "wood": "원국의 목 개수 (정수)", "fire": "화 개수", "earth": "토 개수", "metal": "금 개수", "water": "수 개수"
    }
  },
  "currentFortune": {
    "daewoon": {
      "stem": "현재 대운 천간", "branch": "현재 대운 지지",
      "startAge": "현재 대운 시작 나이 (계산된 실제 값)", "endAge": "현재 대운 종료 나이 (시작+9)",
      "description": "현재 대운 해설 - ${nickname}님의 현재 운의 흐름을 원국과의 관계로 설명 3-4문장"
    },
    "sewoon2026": {
      "stem": "천간", "branch": "지지",
      "description": "2026년 세운 해설 - 병오(丙午)년이 ${nickname}님의 원국에 어떤 작용을 하는지 3-4문장"
    }
  },
  "battleStats": {
    "money": { "score": "0-100 사이 정수", "grade": "대길/길/중길/소길/평", "reason": "원국의 어떤 요소(재성 위치, 용신 관계 등)에 근거한 1-2문장" },
    "love": { "score": "0-100 사이 정수", "grade": "등급", "reason": "원국의 어떤 요소에 근거한 1-2문장" },
    "children": { "score": "0-100 사이 정수", "grade": "등급", "reason": "원국의 어떤 요소에 근거한 1-2문장" },
    "career": { "score": "0-100 사이 정수", "grade": "등급", "reason": "원국의 어떤 요소에 근거한 1-2문장" },
    "study": { "score": "0-100 사이 정수", "grade": "등급", "reason": "원국의 어떤 요소에 근거한 1-2문장" },
    "health": { "score": "0-100 사이 정수", "grade": "등급", "reason": "원국의 어떤 요소에 근거한 1-2문장" }
  },
  "report": {
    "summary": "${nickname}님의 사주 전체 요약. 일간·격국·용신을 인용하며 핵심 특징을 설명. 4-5문장, 200자 이상.",
    "personality": "${nickname}님의 성격/기질 분석. 일간의 특성, 십신 배치가 성격에 미치는 영향을 근거와 함께 설명. 200-300자.",
    "moneyAnalysis": "${nickname}님의 금전운. 재성(편재/정재)의 위치와 상태, 용신과의 관계를 근거로 설명. 200-300자.",
    "loveAnalysis": "${nickname}님의 연애/부부운. 관성(편관/정관) 또는 재성의 위치, 일지와 배우자궁 분석. 200-300자.",
    "childrenAnalysis": "${nickname}님의 자식운. 식상(식신/상관)의 위치와 상태 분석. 200-300자.",
    "careerAnalysis": "${nickname}님의 직장/명예운. 관성의 위치, 격국과의 관계로 분석. 200-300자.",
    "studyAnalysis": "${nickname}님의 학업/지혜운. 인성(편인/정인)의 위치와 상태 분석. 200-300자.",
    "healthAnalysis": "${nickname}님의 건강운. 오행 과다/부족에 따른 취약 장기, 주의사항. 200-300자."
  },
  "advice": {
    "mainAdvice": "${nickname}님에게 드리는 핵심 조언. 용신 활용법, 기신 회피법을 구체적으로 3-4문장.",
    "luckyColor": "행운의 색 (용신 오행에 대응하는 색)",
    "luckyNumber": "1~99 사이 정수",
    "luckyDirection": "좋은 방향(동/서/남/북/동남/동북/서남/서북)"
  },
  "twelveStages": {
    "year": "장생/목욕/관대/건록/제왕/쇠/병/사/묘/절/태/양 중 하나",
    "month": "12운성",
    "day": "12운성",
    "hour": ${birthInfo.isTimeUnknown ? 'null' : '"12운성"'}
  },
  "specialStars": {
    "year": ["해당 신살 목록 (빈 배열 가능)"],
    "month": ["해당 신살 목록"],
    "day": ["해당 신살 목록"],
    "hour": ${birthInfo.isTimeUnknown ? 'null' : '["해당 신살 목록"]'}
  },
  "noblePeople": {
    "year": ["해당 귀인 목록 (빈 배열 가능)"],
    "month": ["해당 귀인 목록"],
    "day": ["해당 귀인 목록"],
    "hour": ${birthInfo.isTimeUnknown ? 'null' : '["해당 귀인 목록"]'}
  },
  "daewoonTable": [
    { "stem": "천간", "branch": "지지", "startAge": "N (계산된 시작 나이, 1~9)", "endAge": "N+9", "element": "오행", "brief": "핵심 1문장" },
    { "stem": "천간", "branch": "지지", "startAge": "N+10", "endAge": "N+19", "element": "오행", "brief": "핵심 1문장" },
    "... 총 8개 대운 (시작 나이부터 10년 간격)"
  ],
  "balanceScore": "1.0~7.0 사이 실수 (분석 결과에 따라 산출, 4.0=중화)"
}

점수 기준:
- 85-100: 대길 (매우 좋은 운)
- 70-84: 길 (좋은 운)
- 55-69: 중길 (보통 좋음)
- 40-54: 소길 (약간 좋음)
- 0-39: 평 (보통/주의 필요)

분석 시 다음 사항을 반드시 고려:
1. 사주 원국의 오행 균형과 신강/신약 (일간의 에너지 강약)
2. 십신 배치와 격국 (월지 기준)
3. 천간 합충, 지지 합충형파해
4. 12운성 (일간 기준 지지의 왕쇠)
5. 대운/세운의 영향 (현재 운의 흐름)
6. 시주가 없는 경우, 년월일주만으로 분석하되 시주 관련 판단은 보수적으로

★ 다시 한번 강조: 모든 풀이 텍스트에서 반드시 "${nickname}님"으로 호칭하고,
"왜 그런지"를 사주 원국의 구체적 글자(천간/지지/십신)를 인용하여 설명하세요.
일반론이 아닌, 이 사람의 사주에서만 나올 수 있는 고유한 분석을 작성하세요.

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

function generateDummySajuResult(birthInfo: BirthInfo, nickname = '회원'): SajuAnalysisResult {
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
    money: { score: moneyScore, grade: getGrade(moneyScore), reason: `${dayMaster}일간 기준 재성(財星)이 ${moneyScore >= 70 ? '월주에 안정적으로 자리잡아 재물 축적에 유리한 구조' : '다소 약하여 꾸준한 저축이 필요한 구조'}입니다.` },
    love: { score: loveScore, grade: getGrade(loveScore), reason: `일지(배우자궁)의 ${pillars.day.earthlyBranch}가 일간 ${dayMaster}와 ${loveScore >= 70 ? '조화를 이루어 좋은 인연의 가능성이 높습니다' : '다소 긴장 관계에 있어 소통 노력이 필요합니다'}.` },
    children: { score: childrenScore, grade: getGrade(childrenScore), reason: `식상(食傷)의 기운이 원국에서 ${childrenScore >= 70 ? '안정적으로 작용하여 자녀와의 관계가 원만합니다' : '약한 편이라 자녀 양육에 세심한 관심이 필요합니다'}.` },
    career: { score: careerScore, grade: getGrade(careerScore), reason: `${basic.geukGuk} 구조에서 관성(官星)이 ${careerScore >= 70 ? '긍정적으로 작용하여 조직 내 인정 가능성이 높습니다' : '아직 충분히 발현되지 않아 내실을 다지는 것이 중요합니다'}.` },
    study: { score: studyScore, grade: getGrade(studyScore), reason: `인성(印星)이 일간을 ${studyScore >= 70 ? '잘 생(生)해주어 학습 능력과 지적 호기심이 뛰어납니다' : '충분히 돕지 못해 꾸준한 자기계발이 필요합니다'}.` },
    health: { score: healthScore, grade: getGrade(healthScore), reason: `${basic.giShin}(기신)의 기운이 ${healthScore >= 70 ? '적절히 제어되어 건강한 체질입니다' : '과다하여 관련 장기에 부담이 갈 수 있으니 주의가 필요합니다'}.` },
  }

  const report: DetailedReport = {
    summary: `${nickname}님은 ${dayMaster}일간(${basic.dayMasterElement})으로, ${basic.geukGuk}의 사주를 타고나셨습니다. 원국은 ${basic.balance === 'strong' ? '신강(身強)하여 일간의 힘이 강한 편' : basic.balance === 'weak' ? '신약(身弱)하여 일간을 도와줄 인성·비겁이 필요한 구조' : '중화(中和)를 이루어 안정적인 기운'}입니다. 용신은 ${basic.yongShin}이며, ${basic.yongShin}의 기운을 잘 활용하는 것이 ${nickname}님 인생의 핵심 열쇠입니다.`,
    personality: `${nickname}님은 ${dayMaster}일간 특유의 기질을 지니고 계십니다. ${DAY_MASTER_TRAITS[dayMaster] ?? ''} ${basic.yinYang === 'yang' ? '양(陽)의 기운으로 활동적이고 추진력이 강하며, 자신의 뜻을 관철시키는 리더형 기질' : '음(陰)의 기운으로 섬세하고 내면이 깊으며, 상황을 관찰한 뒤 정확하게 움직이는 전략형 기질'}을 보입니다. 이러한 성향은 월주와 일지의 십신 배치에 의해 더욱 두드러집니다.`,
    moneyAnalysis: `${nickname}님의 금전운은 ${battleStats.money.grade} 등급입니다. ${basic.yongShin}의 기운을 잘 활용하면 재물 축적에 유리하며, ${moneyScore >= 70 ? '원국에 재성(財星)이 안정적으로 자리잡아 꾸준한 수입원이 형성되기 좋은 구조입니다. 다만 기신인 ' + basic.giShin + '의 기운이 강해지는 시기에는 과도한 투자를 삼가는 것이 좋습니다.' : '재성의 힘이 다소 약한 편이므로, 한 번에 큰 재물보다는 꾸준한 저축과 안정적인 재테크를 통해 재물을 쌓아가는 것이 현명합니다. ' + basic.yongShin + ' 관련 분야에서 기회를 찾으시면 좋겠습니다.'}`,
    loveAnalysis: `${nickname}님의 연애·부부운은 ${battleStats.love.grade} 등급입니다. ${loveScore >= 70 ? '일지(배우자궁)의 기운이 일간과 조화를 이루어, 좋은 인연을 만날 가능성이 높습니다. 배우자와 정서적으로 깊은 교감을 나눌 수 있는 구조이며, 서로를 존중하는 관계가 형성됩니다.' : '일지의 기운이 일간과 다소 긴장 관계에 있어, 연인·배우자와의 소통에 노력이 필요합니다. 감정을 솔직하게 표현하고, 상대방의 입장을 이해하려는 자세가 좋은 인연을 이끌어 냅니다.'}`,
    childrenAnalysis: `${nickname}님의 자식운은 ${battleStats.children.grade} 등급입니다. ${childrenScore >= 70 ? '식상(食傷)의 기운이 원국에서 안정적으로 작용하여, 자녀와의 관계가 원만할 수 있는 구조입니다. 자녀가 재능을 발휘할 수 있도록 격려하시면 큰 기쁨을 얻으실 수 있습니다.' : '식상의 기운이 다소 약하거나 기신의 영향을 받고 있어, 자녀 양육에 있어 세심한 관심과 대화가 중요합니다. 아이의 성향을 잘 파악하고 맞춤형 교육을 하시면 좋은 결실을 맺을 수 있습니다.'}`,
    careerAnalysis: `${nickname}님의 직장·명예운은 ${battleStats.career.grade} 등급입니다. ${basic.geukGuk}의 특성상 ${careerScore >= 70 ? '관성(官星)이 원국에서 긍정적으로 작용하여, 조직 내에서 인정받고 승진할 가능성이 높습니다. 특히 ' + basic.yongShin + ' 관련 분야에서 두각을 나타낼 수 있으며, 리더십을 발휘할 기회가 찾아옵니다.' : '꾸준한 실력 배양이 명예를 높이는 열쇠입니다. 관성의 힘이 아직 충분히 발현되지 않은 시기이므로, 성급한 도전보다는 내실을 다지는 것이 장기적으로 더 큰 성공을 가져다줍니다.'}`,
    studyAnalysis: `${nickname}님의 학업·지혜운은 ${battleStats.study.grade} 등급입니다. ${studyScore >= 70 ? '인성(印星)이 원국에서 일간을 잘 생(生)해주어, 학습 능력과 지적 호기심이 뛰어납니다. 깊이 있는 연구나 전문 분야에서 탁월한 성과를 기대할 수 있습니다.' : '인성의 기운을 활성화하기 위해 꾸준한 독서와 자기계발이 필요합니다. 집중력을 높이는 환경을 조성하고, ' + basic.yongShin + '의 기운이 강한 시간대에 공부하면 효율이 올라갑니다.'}`,
    healthAnalysis: `${nickname}님의 건강운은 ${battleStats.health.grade} 등급입니다. ${basic.giShin}의 기운이 과다하면 관련 장기에 부담이 갈 수 있으니 주의가 필요합니다. ${healthScore < 60 ? '특히 스트레스가 쌓이지 않도록 정기적인 휴식과 명상이 도움이 됩니다. ' + basic.yongShin + '의 기운을 보강하는 음식과 활동을 생활에 접목하시면 건강 유지에 큰 도움이 됩니다.' : '전반적으로 건강한 체질이나, 과로를 피하고 규칙적인 운동을 병행하시면 더욱 활력 넘치는 생활을 영위할 수 있습니다.'}`,
  }

  const advice: Advice = {
    mainAdvice: `${nickname}님에게 가장 중요한 것은 ${basic.yongShin}의 기운을 일상에서 보충하는 것입니다. ${basic.giShin}의 기운이 강해지는 환경은 가급적 피하시고, ${basic.yongShin} 오행에 해당하는 색상·음식·방향을 생활에 활용하세요. 매사에 긍정적인 마음가짐을 유지하는 것이 운을 여는 열쇠입니다.`,
    luckyColor: COLORS[(seed + 2) % COLORS.length]!,
    luckyNumber: ((dateNum % 9) + 1) * ((seed % 9) + 1),
    luckyDirection: DIRECTIONS[(seed) % DIRECTIONS.length]!,
  }

  // 12운성 더미
  const TWELVE_STAGE_LIST = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양']
  const twelveStages: TwelveStages = {
    year: TWELVE_STAGE_LIST[(seed + 0) % 12]!,
    month: TWELVE_STAGE_LIST[(seed + 3) % 12]!,
    day: TWELVE_STAGE_LIST[(seed + 6) % 12]!,
    hour: birthInfo.isTimeUnknown ? null : TWELVE_STAGE_LIST[(seed + 9) % 12]!,
  }

  // 신살 더미
  const STAR_LIST = ['역마살', '화개살', '도화살', '망신살', '백호살', '겁살', '재살']
  const specialStars: SpecialStars = {
    year: seed % 3 === 0 ? [STAR_LIST[seed % 7]!] : [],
    month: seed % 2 === 0 ? [STAR_LIST[(seed + 1) % 7]!] : [],
    day: [STAR_LIST[(seed + 2) % 7]!],
    hour: birthInfo.isTimeUnknown ? null : (seed % 4 === 0 ? [STAR_LIST[(seed + 3) % 7]!] : []),
  }

  // 귀인 더미
  const NOBLE_LIST = ['천을귀인', '문창귀인', '태극귀인', '천주귀인', '월덕귀인', '천덕귀인']
  const noblePeople: NoblePeople = {
    year: seed % 2 === 0 ? [NOBLE_LIST[seed % 6]!] : [],
    month: [NOBLE_LIST[(seed + 1) % 6]!],
    day: seed % 3 === 0 ? [NOBLE_LIST[(seed + 2) % 6]!] : [],
    hour: birthInfo.isTimeUnknown ? null : (seed % 2 === 1 ? [NOBLE_LIST[(seed + 3) % 6]!] : []),
  }

  // 대운표 더미 - 성별+년간 음양에 따라 시작 나이 결정
  const yearStemIndex = (seed + 0) % 10
  const isYangYear = yearStemIndex % 2 === 0 // 갑(0)병(2)무(4)경(6)임(8)=양
  const isMale = birthInfo.gender === 'male'
  const isForward = (isYangYear && isMale) || (!isYangYear && !isMale) // 순행 조건
  // 더미 시작 나이: 생일~절기 거리를 시뮬레이션 (1~9 범위)
  const dummyStartAge = (seed % 9) + 1
  const monthStemIdx = (seed + 3) % 10
  const monthBranchIdx = (seed + 4) % 12

  const daewoonTable: DaewoonEntry[] = []
  for (let i = 0; i < 8; i++) {
    const startAge = dummyStartAge + i * 10
    // 순행이면 월주 다음 간지, 역행이면 이전 간지
    const direction = isForward ? 1 : -1
    const stemIdx = ((monthStemIdx + direction * (i + 1)) % 10 + 10) % 10
    const branchIdx = ((monthBranchIdx + direction * (i + 1)) % 12 + 12) % 12
    daewoonTable.push({
      stem: HEAVENLY_STEMS[stemIdx]!,
      branch: EARTHLY_BRANCHES[branchIdx]!,
      startAge,
      endAge: startAge + 9,
      element: ELEMENTS[stemIdx % 5]!,
      brief: `${ELEMENTS[stemIdx % 5]} 기운이 ${i < 4 ? '상승' : '안정'}하는 시기`,
    })
  }

  // 신강신약 점수 (1~7)
  const balanceScore = basic.balance === 'strong' ? 5.5
    : basic.balance === 'weak' ? 2.5
    : 4.0

  console.log('[SAJU] 더미 데이터 사용 - 생년월일:', birthInfo.birthDate, '일주:', dayMaster + dayBranch)

  return {
    birthInfo,
    pillars,
    sipsin: null,
    basic,
    currentFortune: null,
    battleStats,
    report,
    advice,
    twelveStages,
    specialStars,
    noblePeople,
    daewoonTable,
    balanceScore,
  }
}

// ============================================
// 메인 분석 함수
// ============================================

export async function analyzeSaju(birthInfo: BirthInfo, nickname = '회원'): Promise<SajuAnalysisResult> {
  // 더미 데이터 모드인 경우 바로 반환
  if (USE_DUMMY_DATA) {
    console.log('[SAJU] 더미 데이터 모드로 실행 중...')
    // 약간의 딜레이를 줘서 실제 분석하는 느낌
    await new Promise(resolve => setTimeout(resolve, 1000))
    return generateDummySajuResult(birthInfo, nickname)
  }

  const prompt = buildSajuPrompt(birthInfo, nickname)

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
      sipsin?: SipsinMapping
      basic: BasicAnalysis
      currentFortune?: CurrentFortune
      battleStats: BattleStats
      report: DetailedReport
      advice: Advice
      twelveStages?: TwelveStages
      specialStars?: SpecialStars
      noblePeople?: NoblePeople
      daewoonTable?: DaewoonEntry[]
      balanceScore?: number
    }

    return {
      birthInfo,
      pillars: result.pillars,
      sipsin: result.sipsin || null,
      basic: result.basic,
      currentFortune: result.currentFortune || null,
      battleStats: result.battleStats,
      report: result.report,
      advice: result.advice,
      twelveStages: result.twelveStages || null,
      specialStars: result.specialStars || null,
      noblePeople: result.noblePeople || null,
      daewoonTable: result.daewoonTable || null,
      balanceScore: result.balanceScore ?? null,
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

// ============================================
// 대결 비교 분석 (GPT)
// ============================================

function buildComparisonPrompt(
  challenger: { nickname: string; dayMaster: string; dayMasterElement: string; balance: string; geukGuk: string; yongShin: string; elementDistribution: Record<string, number>; battleStats: BattleStats },
  opponent: { nickname: string; dayMaster: string; dayMasterElement: string; balance: string; geukGuk: string; yongShin: string; elementDistribution: Record<string, number>; battleStats: BattleStats },
  battleResult: BattleResult
): string {
  const winnerName = battleResult.winner === 'challenger' ? challenger.nickname
    : battleResult.winner === 'opponent' ? opponent.nickname : '무승부'

  return `당신은 사주 대결 해설가입니다. 두 사람의 사주를 비교하여 재미있고 통찰력 있는 대결 해설을 작성하세요.

## 도전자: ${challenger.nickname}
- 일간: ${challenger.dayMaster} (${challenger.dayMasterElement})
- 격국: ${challenger.geukGuk}, 신강/신약: ${challenger.balance}
- 용신: ${challenger.yongShin}
- 오행분포: 목${challenger.elementDistribution.wood} 화${challenger.elementDistribution.fire} 토${challenger.elementDistribution.earth} 금${challenger.elementDistribution.metal} 수${challenger.elementDistribution.water}
- 배틀스탯: 금전${challenger.battleStats.money.score} 연애${challenger.battleStats.love.score} 자식${challenger.battleStats.children.score} 직장${challenger.battleStats.career.score} 학업${challenger.battleStats.study.score} 건강${challenger.battleStats.health.score}

## 상대방: ${opponent.nickname}
- 일간: ${opponent.dayMaster} (${opponent.dayMasterElement})
- 격국: ${opponent.geukGuk}, 신강/신약: ${opponent.balance}
- 용신: ${opponent.yongShin}
- 오행분포: 목${opponent.elementDistribution.wood} 화${opponent.elementDistribution.fire} 토${opponent.elementDistribution.earth} 금${opponent.elementDistribution.metal} 수${opponent.elementDistribution.water}
- 배틀스탯: 금전${opponent.battleStats.money.score} 연애${opponent.battleStats.love.score} 자식${opponent.battleStats.children.score} 직장${opponent.battleStats.career.score} 학업${opponent.battleStats.study.score} 건강${opponent.battleStats.health.score}

## 대결 결과
- 승자: ${winnerName}
- 전적: ${battleResult.challengerWins}승 ${battleResult.draws}무 ${battleResult.opponentWins}패
- 케미스트리: ${battleResult.chemistry.type} (${battleResult.chemistry.stemRelation.type})

## 작성 지침
- 각 라운드별로 왜 한쪽이 우세한지 사주학적 근거를 짧게 설명
- 명리학 용어를 사용하되 이해하기 쉽게 풀어서 설명
- 재미있고 극적인 톤으로 작성 (스포츠 해설처럼)
- 존댓말 사용

## 응답 (JSON만)
{
  "rounds": [
    { "category": "금전운", "narrative": "해설 2-3문장", "advantage": "challenger 또는 opponent 또는 even" },
    { "category": "연애운", "narrative": "해설 2-3문장", "advantage": "challenger/opponent/even" },
    { "category": "자식운", "narrative": "해설 2-3문장", "advantage": "challenger/opponent/even" },
    { "category": "직장운", "narrative": "해설 2-3문장", "advantage": "challenger/opponent/even" },
    { "category": "학업운", "narrative": "해설 2-3문장", "advantage": "challenger/opponent/even" },
    { "category": "건강운", "narrative": "해설 2-3문장", "advantage": "challenger/opponent/even" }
  ],
  "overallNarrative": "전체 대결 해설 3-4문장",
  "chemistryNarrative": "두 사주의 궁합/관계 해설 2-3문장",
  "winnerCommentary": "승자(또는 무승부)에 대한 코멘트 1-2문장"
}`
}

function generateDummyComparison(battleResult: BattleResult): ComparisonAnalysis {
  const categories = ['금전운', '연애운', '자식운', '직장운', '학업운', '건강운']
  return {
    rounds: categories.map((cat, i) => ({
      category: cat,
      narrative: `${cat} 라운드에서 치열한 접전이 벌어졌습니다. 양쪽 모두 강한 기운을 가지고 있어 팽팽한 대결이었습니다.`,
      advantage: battleResult.rounds[i]?.winner === 'draw' ? 'even' as const : battleResult.rounds[i]?.winner as 'challenger' | 'opponent',
    })),
    overallNarrative: '두 사람의 사주가 팽팽하게 맞서는 흥미진진한 대결이었습니다. 각자의 강점이 뚜렷하게 드러나는 좋은 매치업이었습니다.',
    chemistryNarrative: `두 사람은 ${battleResult.chemistry.type}의 관계입니다. ${battleResult.chemistry.description}`,
    winnerCommentary: battleResult.winner === 'draw'
      ? '무승부! 두 사람 모두 뛰어난 사주의 소유자입니다.'
      : '축하합니다! 이번 대결에서 좋은 기운이 빛을 발했습니다.',
  }
}

export async function generateBattleComparison(
  challenger: { nickname: string; dayMaster: string; dayMasterElement: string; basic: BasicAnalysis; battleStats: BattleStats },
  opponent: { nickname: string; dayMaster: string; dayMasterElement: string; basic: BasicAnalysis; battleStats: BattleStats },
  battleResult: BattleResult
): Promise<ComparisonAnalysis> {
  if (USE_DUMMY_DATA) {
    console.log('[SAJU] 더미 비교 분석 생성')
    await new Promise(resolve => setTimeout(resolve, 500))
    return generateDummyComparison(battleResult)
  }

  const prompt = buildComparisonPrompt(
    {
      nickname: challenger.nickname,
      dayMaster: challenger.dayMaster,
      dayMasterElement: challenger.dayMasterElement,
      balance: challenger.basic.balance,
      geukGuk: challenger.basic.geukGuk,
      yongShin: challenger.basic.yongShin,
      elementDistribution: challenger.basic.elementDistribution,
      battleStats: challenger.battleStats,
    },
    {
      nickname: opponent.nickname,
      dayMaster: opponent.dayMaster,
      dayMasterElement: opponent.dayMasterElement,
      balance: opponent.basic.balance,
      geukGuk: opponent.basic.geukGuk,
      yongShin: opponent.basic.yongShin,
      elementDistribution: opponent.basic.elementDistribution,
      battleStats: opponent.battleStats,
    },
    battleResult
  )

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: '당신은 사주 대결의 전문 해설가입니다. 두 사람의 사주를 비교하여 재미있고 전문적인 해설을 제공합니다. 항상 유효한 JSON으로만 응답합니다.',
      },
      { role: 'user', content: prompt },
    ],
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('비교 분석 응답이 비어있습니다')
  }

  try {
    return JSON.parse(content) as ComparisonAnalysis
  } catch {
    throw new Error('비교 분석 결과 파싱 실패')
  }
}

// ============================================
// 프리미엄 분석 (운명의 짝, 시기별 재산, 운명의 고비)
// ============================================

function buildPremiumPrompt(
  pillars: SajuPillars,
  basic: BasicAnalysis,
  nickname: string,
  gender: string,
  birthDate: string
): string {
  return `당신은 50년 경력의 명리학 전문가입니다.
다음 사주 원국을 바탕으로 심층 분석을 제공하세요.

## 사주 원국 정보
- 이름: ${nickname}
- 성별: ${gender === 'male' ? '남성' : '여성'}
- 생년월일: ${birthDate}
- 년주: ${pillars.year.heavenlyStem}${pillars.year.earthlyBranch}
- 월주: ${pillars.month.heavenlyStem}${pillars.month.earthlyBranch}
- 일주: ${pillars.day.heavenlyStem}${pillars.day.earthlyBranch}
${pillars.hour ? `- 시주: ${pillars.hour.heavenlyStem}${pillars.hour.earthlyBranch}` : '- 시주: 모름'}
- 일간: ${basic.dayMaster} (${basic.dayMasterElement})
- 격국: ${basic.geukGuk}
- 신강/신약: ${basic.balance}
- 용신: ${basic.yongShin}

## 분석 요청

### 1. 운명의 짝 (배우자상)
- ${nickname}님의 일지(배우자궁)와 관성/재성 배치를 분석하여 어울리는 배우자의 특성을 추론
- 성격, 직업, 외모 특성, 핵심 키워드, 궁합 근거를 사주학적으로 제시

### 2. 시기별 재산운
- 사주 원국과 대운 흐름을 기반으로 4개 시기의 재물 레벨(1~10)을 산출
- 각 시기별 재물 운의 변동 이유를 명리학적으로 설명

### 3. 운명의 고비 (5가지)
- 사주 원국의 충/형/파/해, 기신 작용, 오행 불균형 등에서 5가지 인생의 고비 도출
- 각 고비의 예상 시기, 제목, 상세 설명을 포함 (넘기면 더 강해진다는 뉘앙스로 작성)

## 작성 규칙
- 반드시 "${nickname}님"이라고 호칭
- 모든 분석에 사주학적 근거(천간/지지/십신/합충)를 인용
- 전문적이되 읽기 쉽게 서술

## 응답 (JSON만)
{
  "destinyPartner": {
    "personality": "${nickname}님의 배우자궁 분석을 근거로 한 배우자 성격 3-4문장",
    "occupation": "어울리는 직업/분야",
    "appearance": "외모 특성 2-3문장",
    "traits": ["키워드1", "키워드2", "키워드3", "키워드4"],
    "compatibility": "궁합 근거 설명 (어떤 합/충이 작용하는지) 2-3문장"
  },
  "wealthByPeriod": {
    "youth": { "period": "초년기 (0~20세)", "level": "1~10 사이 정수", "description": "명리학적 근거 포함 3-4문장" },
    "earlyAdult": { "period": "청년기 (21~35세)", "level": "1~10 사이 정수", "description": "3-4문장" },
    "midLife": { "period": "중년기 (36~55세)", "level": "1~10 사이 정수", "description": "3-4문장" },
    "lateLife": { "period": "말년기 (56세~)", "level": "1~10 사이 정수", "description": "3-4문장" }
  },
  "lifeCrises": [
    { "title": "고비 제목", "description": "사주학적 근거 포함 상세 설명 + 이 고비를 넘기면 어떻게 성장하는지 3-4문장", "period": "예상 시기 (예: 30대 초반)" },
    { "title": "고비 제목", "description": "설명", "period": "시기" },
    { "title": "고비 제목", "description": "설명", "period": "시기" },
    { "title": "고비 제목", "description": "설명", "period": "시기" },
    { "title": "고비 제목", "description": "설명", "period": "시기" }
  ]
}`
}

function generateDummyPremiumAnalysis(nickname: string): PremiumAnalysis {
  return {
    destinyPartner: {
      personality: `${nickname}님의 배우자궁에 안정적인 기운이 자리하고 있어, 따뜻하고 배려심이 깊은 성격의 배우자를 만날 가능성이 높습니다. 감정 표현이 풍부하고, 가정을 소중히 여기는 타입입니다.`,
      occupation: '교육/상담/의료 관련 직종',
      appearance: '단정하고 지적인 인상으로, 첫인상이 편안하며 중간 체형에 정돈된 스타일을 선호합니다.',
      traits: ['따뜻함', '배려심', '안정감', '지적'],
      compatibility: `${nickname}님의 일간과 일지의 조합이 상생 관계를 형성하여, 서로를 보완해주는 궁합이 기대됩니다. 특히 용신 오행을 가진 배우자를 만나면 인생의 흐름이 한층 좋아집니다.`,
    },
    wealthByPeriod: {
      youth: { period: '초년기 (0~20세)', level: 4, description: `${nickname}님의 초년기는 학업과 성장에 집중하는 시기로, 재물운보다는 지식과 경험을 쌓는 데 주력하게 됩니다. 가정의 도움으로 안정적인 기반은 마련됩니다.` },
      earlyAdult: { period: '청년기 (21~35세)', level: 6, description: `${nickname}님의 청년기에는 직업 활동이 본격화되면서 점차 재물이 축적됩니다. 이 시기의 노력이 중년기 재물운의 기반이 됩니다.` },
      midLife: { period: '중년기 (36~55세)', level: 8, description: `${nickname}님의 중년기는 재물운이 가장 왕성한 시기입니다. 그동안 쌓아온 역량이 빛을 발하며, 안정적인 수입과 함께 자산 형성의 기회가 찾아옵니다.` },
      lateLife: { period: '말년기 (56세~)', level: 6, description: `${nickname}님의 말년기는 축적된 자산을 관리하고 유지하는 시기입니다. 무리한 투자보다는 안정적인 운용이 중요하며, 건강 관리에도 신경 쓰시면 좋습니다.` },
    },
    lifeCrises: [
      { title: '대인관계의 갈등', description: `${nickname}님의 원국에서 비겁과 관성의 충돌이 작용하는 시기에 직장이나 사회적 관계에서 마찰이 발생할 수 있습니다. 자존심을 내세우기보다 유연한 대처가 필요합니다.`, period: '30대 초반' },
      { title: '직업적 전환점', description: `${nickname}님의 대운 전환기에 맞물려 직업적 변화가 찾아올 수 있습니다. 새로운 도전과 기존 안정 사이에서 신중한 판단이 요구됩니다.`, period: '35~40세' },
      { title: '가정 내 역할 변화', description: `가족 관계에서 역할이 변화하며 심리적 부담이 커질 수 있는 시기입니다. 가족과의 소통을 강화하고 서로의 입장을 이해하는 노력이 필요합니다.`, period: '40대 중반' },
      { title: '건강 관리 경보', description: `${nickname}님의 오행 불균형이 신체에 영향을 미치기 시작하는 시기입니다. 과로를 피하고 정기 검진을 받으시며, 기신 오행과 관련된 장기에 특히 주의하세요.`, period: '50대' },
      { title: '재정적 판단의 시기', description: `큰 규모의 재정적 결정이 필요한 시기가 찾아옵니다. 충동적인 투자나 보증은 삼가고, 전문가의 조언을 구하시면 안전하게 넘길 수 있습니다.`, period: '55~60세' },
    ],
  }
}

export async function generatePremiumAnalysis(
  pillars: SajuPillars,
  basic: BasicAnalysis,
  nickname: string,
  gender: string,
  birthDate: string
): Promise<PremiumAnalysis> {
  if (USE_DUMMY_DATA) {
    console.log('[SAJU] 더미 프리미엄 분석 생성')
    await new Promise(resolve => setTimeout(resolve, 1500))
    return generateDummyPremiumAnalysis(nickname)
  }

  const prompt = buildPremiumPrompt(pillars, basic, nickname, gender, birthDate)

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: '당신은 사주팔자 심층 분석을 제공하는 명리학 전문가입니다. 항상 유효한 JSON 형식으로만 응답합니다.',
      },
      { role: 'user', content: prompt },
    ],
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('프리미엄 분석 응답이 비어있습니다')
  }

  try {
    return JSON.parse(content) as PremiumAnalysis
  } catch {
    throw new Error('프리미엄 분석 결과 파싱 실패')
  }
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
