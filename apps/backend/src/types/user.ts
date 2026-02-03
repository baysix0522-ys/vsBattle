export type AuthProvider = 'local' | 'kakao' | 'naver'

export interface User {
  id: string
  email: string
  passwordHash: string
  nickname: string
  createdAt: Date
  isGuest: boolean
  rice: number // 재화(쌀)
  provider: AuthProvider
  providerId: string | null
  profileImage: string | null
}

export interface UserPublic {
  id: string
  email: string
  nickname: string
  isGuest: boolean
  rice: number
  provider: AuthProvider
  profileImage: string | null
}

export interface AuthPayload {
  userId: string
  isGuest: boolean
}

export function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    isGuest: user.isGuest,
    rice: user.rice,
    provider: user.provider,
    profileImage: user.profileImage,
  }
}
