const API_BASE = '/api'

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
export type User = {
  id: string
  email: string
  nickname: string
  isGuest: boolean
  rice: number
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
