export interface User {
  id: string
  email: string
  passwordHash: string
  nickname: string
  createdAt: Date
  isGuest: boolean
  rice: number // 재화(쌀)
}

export interface UserPublic {
  id: string
  email: string
  nickname: string
  isGuest: boolean
  rice: number
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
  }
}
