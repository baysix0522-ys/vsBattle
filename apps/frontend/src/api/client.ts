const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  token?: string | null
  signal?: AbortSignal
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...(signal ? { signal } : {}),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(response.status, data.error || '요청 중 오류가 발생했습니다.')
  }

  return data as T
}

// Auth API
export type AuthProvider = 'local' | 'kakao' | 'naver'

export type User = {
  id: string
  email: string
  nickname: string
  isGuest: boolean
  rice: number
  provider: AuthProvider
  profileImage: string | null
}

export type AuthResponse = {
  message: string
  token: string
  user: User
}

export const authApi = {
  register: (email: string, password: string, nickname: string) =>
    apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: { email, password, nickname },
    }),

  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  guest: () =>
    apiRequest<AuthResponse>('/auth/guest', {
      method: 'POST',
    }),

  me: (token: string) =>
    apiRequest<{ user: User }>('/auth/me', {
      token,
    }),

  // 카카오 로그인 URL 가져오기
  getKakaoLoginUrl: () =>
    apiRequest<{ url: string }>('/auth/kakao'),

  // 카카오 콜백 처리
  kakaoCallback: (code: string) =>
    apiRequest<AuthResponse>('/auth/kakao/callback', {
      method: 'POST',
      body: { code },
    }),
}

// Fortune API
export type FortuneRecordResponse = {
  success: boolean
  recordId: string
  date: string
  riceReward: number
  totalRice: number
}

export type FortuneRecord = {
  id: string
  date: string
  birthInfo: unknown
  fortuneResult: unknown
  createdAt: string
}

export const fortuneApi = {
  saveRecord: (token: string, birthInfo: unknown, fortuneResult: unknown) =>
    apiRequest<FortuneRecordResponse>('/fortune/record', {
      method: 'POST',
      token,
      body: { birthInfo, fortuneResult },
    }),

  getTodayRecord: (token: string) =>
    apiRequest<{ record: FortuneRecord | null; isGuest?: boolean }>('/fortune/record/today', {
      token,
    }),

  getRecords: (token: string, limit?: number) =>
    apiRequest<{ records: FortuneRecord[] }>(`/fortune/records${limit ? `?limit=${limit}` : ''}`, {
      token,
    }),
}

// Battle API Types
export type BattleBirthInfo = {
  birthDate: string
  birthTime?: string
  isTimeUnknown: boolean
  gender: 'male' | 'female'
}

export type BattleStat = {
  score: number
  grade: string
}

export type BattleStats = {
  money: BattleStat
  love: BattleStat
  children: BattleStat
  career: BattleStat
  study: BattleStat
  health: BattleStat
}

export type SajuPillars = {
  year: { heavenlyStem: string; earthlyBranch: string }
  month: { heavenlyStem: string; earthlyBranch: string }
  day: { heavenlyStem: string; earthlyBranch: string }
  hour: { heavenlyStem: string; earthlyBranch: string } | null
}

export type SajuBasicAnalysis = {
  dayMaster: string
  dayMasterElement: string
  yinYang: string
  balance: string
  yongShin: string
  heeShin: string
  giShin: string
  geukGuk: string
  elementDistribution: {
    wood: number
    fire: number
    earth: number
    metal: number
    water: number
  }
}

export type SajuDetailedReport = {
  summary: string
  personality: string
  moneyAnalysis: string
  loveAnalysis: string
  childrenAnalysis: string
  careerAnalysis: string
  studyAnalysis: string
  healthAnalysis: string
}

export type SajuAdvice = {
  mainAdvice: string
  luckyColor: string
  luckyNumber: number
  luckyDirection: string
}

export type Chemistry = {
  type: '천생연분' | '숙명의라이벌' | '일반'
  stemRelation: {
    type: '합' | '충' | '없음'
    description: string
  }
  compatibility: number
  description: string
}

export type BattleRound = {
  id: string
  name: string
  icon: string
  challenger: BattleStat
  opponent: BattleStat
  winner: 'challenger' | 'opponent' | 'draw'
  scoreDiff: number
}

export type BattleResultData = {
  rounds: BattleRound[]
  challengerWins: number
  opponentWins: number
  draws: number
  winner: 'challenger' | 'opponent' | 'draw'
  chemistry: Chemistry
}

export type BattleListItem = {
  id: string
  status: 'pending' | 'completed'
  share_code: string
  winner_id: string | null
  challenger_id: string
  opponent_id: string | null
  challenger_nickname: string
  opponent_nickname: string | null
  challenger_day_master: string
  opponent_day_master: string | null
  chemistry: Chemistry | null
  created_at: string
  completed_at: string | null
}

// Battle API
export const battleApi = {
  // 사주 분석 요청
  analyze: (token: string, birthInfo: BattleBirthInfo) =>
    apiRequest<{
      reportId: string
      isExisting: boolean
      result: {
        birthInfo: BattleBirthInfo
        pillars: SajuPillars
        basic: SajuBasicAnalysis
        battleStats: BattleStats
        report: SajuDetailedReport
        advice: SajuAdvice
      }
    }>('/battle/analyze', {
      method: 'POST',
      token,
      body: birthInfo,
    }),

  // 내 사주 리포트 목록
  getMyReports: (token: string) =>
    apiRequest<{ reports: unknown[] }>('/battle/my-reports', { token }),

  // 대결 생성
  createBattle: (token: string, reportId: string) =>
    apiRequest<{
      battleId: string
      shareCode: string
      shareUrl: string
      createdAt: string
    }>('/battle/create', {
      method: 'POST',
      token,
      body: { reportId },
    }),

  // 대결 정보 조회 (공유 코드로)
  getBattleByCode: (token: string, shareCode: string) =>
    apiRequest<{
      battleId: string
      status: string
      challenger: {
        nickname: string
        dayMaster: string
        dayMasterElement: string
        ilju: string
      }
      createdAt: string
    }>(`/battle/join/${shareCode}`, { token }),

  // 대결 참가
  joinBattle: (token: string, shareCode: string, reportId: string) =>
    apiRequest<{
      battleId: string
      status: string
      result: BattleResultData
    }>(`/battle/join/${shareCode}`, {
      method: 'POST',
      token,
      body: { reportId },
    }),

  // 대결 결과 조회
  getBattleResult: (token: string, battleId: string) =>
    apiRequest<{
      battleId: string
      status: string
      result: BattleResultData
      chemistry: Chemistry
      winnerId: string | null
      challenger: {
        id: string
        nickname: string
        dayMaster: string
        dayMasterElement: string
        ilju: string
        stats: BattleStats
        basic: SajuBasicAnalysis
        report: SajuDetailedReport
      }
      opponent: {
        id: string
        nickname: string
        dayMaster: string
        dayMasterElement: string
        ilju: string
        stats: BattleStats
        basic: SajuBasicAnalysis
        report: SajuDetailedReport
      }
      completedAt: string
    }>(`/battle/${battleId}/result`, { token }),

  // 내 대결 목록
  getMyBattles: (token: string) =>
    apiRequest<{ battles: BattleListItem[] }>('/battle/my-battles', { token }),
}

// ========================================
// User/MyPage API Types
// ========================================
export type MyPageSaju = {
  id: string
  birthDate: string
  birthTime: string | null
  gender: string
  dayMaster: string
  dayMasterElement: string
  pillars: SajuPillars
  basicAnalysis: SajuBasicAnalysis
  battleStats: BattleStats
  createdAt: string
}

export type MyPageBattleStats = {
  total: number
  wins: number
  losses: number
  draws: number
  pendingSent: number
  pendingReceived: number
}

export type MyPageBattle = {
  id: string
  status: 'pending' | 'completed'
  winnerId: string | null
  shareCode?: string
  createdAt: string
  completedAt: string | null
  myRole: 'challenger' | 'opponent'
  challenger: {
    nickname: string
    dayMaster: string
    element: string
  }
  opponent: {
    nickname: string
    dayMaster: string
    element: string
  } | null
}

export type RecentActivity = {
  id: string
  serviceType: 'fortune' | 'battle' | 'saju' | 'tarot'
  serviceName: string
  serviceIcon: string
  detail: string
  createdAt: string
}

export type MyPageData = {
  user: {
    id: string
    nickname: string
    email: string | null
    rice: number
    profileImage: string | null
    provider: string
    createdAt: string
  }
  saju: MyPageSaju | null
  battleStats: MyPageBattleStats
  recentBattles: MyPageBattle[]
  recentActivities: RecentActivity[]
}

export type RiceTransaction = {
  id: string
  type: 'charge' | 'consume' | 'refund' | 'bonus'
  amount: number
  balanceAfter: number
  description: string
  referenceType: string | null
  referenceId: string | null
  createdAt: string
}

export type RiceTransactionsResponse = {
  balance: number
  total: number
  page: number
  limit: number
  transactions: RiceTransaction[]
}

export type BattleHistoryResponse = {
  total: number
  page: number
  limit: number
  battles: MyPageBattle[]
}

// Daily Bonus Types
export type DailyBonusStatus = {
  loginBonus: {
    claimed: boolean
    amount: number
  }
  fortuneBonus: {
    claimed: boolean
    amount: number
  }
}

export type ClaimBonusResponse = {
  success: boolean
  amount: number
  balance: number
}

// User API
export const userApi = {
  // 마이페이지 데이터 조회
  getMyPage: (token: string) =>
    apiRequest<MyPageData>('/user/mypage', { token }),

  // 쌀 거래 내역 조회
  getRiceTransactions: (token: string, page = 1, limit = 20) =>
    apiRequest<RiceTransactionsResponse>(`/user/rice/transactions?page=${page}&limit=${limit}`, { token }),

  // 닉네임 변경
  updateNickname: (token: string, nickname: string) =>
    apiRequest<{ success: boolean; nickname: string }>('/user/nickname', {
      method: 'PATCH',
      token,
      body: { nickname },
    }),

  // 대결 히스토리 전체 조회
  getBattleHistory: (token: string, page = 1, limit = 20, status?: string) =>
    apiRequest<BattleHistoryResponse>(
      `/user/battles?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`,
      { token }
    ),

  // 일일 보너스 상태 확인
  getDailyBonus: (token: string) =>
    apiRequest<DailyBonusStatus>('/user/daily-bonus', { token }),

  // 일일 로그인 보너스 수령
  claimLoginBonus: (token: string) =>
    apiRequest<ClaimBonusResponse>('/user/daily-bonus/login', {
      method: 'POST',
      token,
    }),

  // 회원 탈퇴
  withdraw: (token: string) =>
    apiRequest<{ success: boolean; message: string }>('/user/withdraw', {
      method: 'DELETE',
      token,
    }),
}

// ========================================
// Name Analysis API Types (이름 풀이)
// ========================================

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

export type SelectedHanja = {
  korean: string
  hanja: string
}

export type HanjaCharacter = {
  korean: string              // 한글 (영)
  hanja: string               // 한자 (泳)
  meaning: string             // 훈 (헤엄치다, 물에서 나아가다)
  interpretation: string      // 해석 (2-3문장)
  symbolism: string           // 상징 + 추가 설명
  fiveElement: '목' | '화' | '토' | '금' | '수'
  elementReason: string       // 오행 판단 근거
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
  breakdown: StrokeBreakdown[]  // 글자별 획수
  천격: OgyeokScore
  인격: OgyeokScore
  지격: OgyeokScore
  외격: OgyeokScore
  총격: OgyeokScore
  samjae: SamjaeAnalysis  // 삼재 분석
}

export type ShareableKeywords = {
  nickname: string
  keywords: string[]
  hashtags: string[]
  oneLineQuote: string
}

// 25개 고정 닉네임 타입
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

export type NameHistoryItem = {
  id: string
  fullName: string
  koreanName: string
  surname: string
  surnameHanja: string
  selectedHanja: string
  overallScore: number
  overallGrade: string
  createdAt: string
}

// Name Analysis API
export const nameApi = {
  // 한자 후보 제안
  suggestHanja: (koreanName: string, token?: string | null) =>
    apiRequest<{ success: boolean; suggestions: HanjaCandidates[] }>('/name/suggest-hanja', {
      method: 'POST',
      token: token ?? null,
      body: { koreanName },
    }),

  // 이름 분석
  analyze: (
    surname: string,
    surnameHanja: string,
    koreanName: string,
    selectedHanja: SelectedHanja[],
    token?: string | null,
    signal?: AbortSignal
  ) =>
    apiRequest<{
      success: boolean
      recordId: string
      isExisting: boolean
      result: NameAnalysisResult
    }>('/name/analyze', {
      method: 'POST',
      token: token ?? null,
      body: { surname, surnameHanja, koreanName, selectedHanja },
      ...(signal ? { signal } : {}),
    }),

  // 분석 기록 조회
  getRecord: (id: string, token?: string | null) =>
    apiRequest<{
      id: string
      koreanName: string
      surname: string
      surnameHanja: string
      selectedHanja: string
      result: NameAnalysisResult | string
      overallScore: number
      overallGrade: string
      createdAt: string
    }>(`/name/record/${id}`, {
      token: token ?? null,
    }),

  // 분석 히스토리
  getHistory: (token: string, page = 1, limit = 20) =>
    apiRequest<{
      total: number
      page: number
      limit: number
      records: NameHistoryItem[]
    }>(`/name/history?page=${page}&limit=${limit}`, { token }),
}

// ========================================
// Payment API Types (결제)
// ========================================

export type PaymentProduct = {
  id: string
  name: string
  rice: number
  bonus: number
  price: number
}

export type PaymentReadyResponse = {
  tid: string
  orderId: string
  redirectUrl: string
  product: PaymentProduct
}

export type PaymentApproveResponse = {
  success: boolean
  riceAmount: number
  newBalance: number
  paymentId: string
}

export type PaymentHistoryItem = {
  id: string
  amount: number
  riceAmount: number
  provider: string
  productName: string
  status: string
  createdAt: string
  completedAt: string
}

export type PaymentHistoryResponse = {
  total: number
  page: number
  limit: number
  payments: PaymentHistoryItem[]
}

// Payment API
export const paymentApi = {
  // 상품 목록 조회
  getProducts: () =>
    apiRequest<{ products: PaymentProduct[] }>('/payment/products'),

  // 결제 준비
  ready: (token: string, productId: string) =>
    apiRequest<PaymentReadyResponse>('/payment/ready', {
      method: 'POST',
      token,
      body: { productId },
    }),

  // 결제 승인
  approve: (token: string, pgToken: string, orderId: string) =>
    apiRequest<PaymentApproveResponse>('/payment/approve', {
      method: 'POST',
      token,
      body: { pgToken, orderId },
    }),

  // 결제 내역 조회
  getHistory: (token: string, page = 1, limit = 20) =>
    apiRequest<PaymentHistoryResponse>(`/payment/history?page=${page}&limit=${limit}`, { token }),
}

// ========================================
// Stats API (통계)
// ========================================
export const statsApi = {
  // 방문 기록
  recordVisit: () =>
    apiRequest<{ success: boolean }>('/stats/visit', { method: 'POST' }),

  // 오늘의 방문자 수 조회
  getTodayVisitors: () =>
    apiRequest<{ count: number }>('/stats/today'),
}
