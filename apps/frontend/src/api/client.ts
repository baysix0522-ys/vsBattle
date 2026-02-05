const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  token?: string | null
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
  const { method = 'GET', body, token } = options

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
