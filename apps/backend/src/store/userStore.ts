import { sql } from '../db/index.js'
import type { User } from '../types/user.js'

// DB row를 User 타입으로 변환
function rowToUser(row: {
  id: string
  email: string | null
  password_hash: string | null
  nickname: string
  is_guest: boolean
  rice: number
  created_at: Date
}): User {
  return {
    id: row.id,
    email: row.email ?? '',
    passwordHash: row.password_hash ?? '',
    nickname: row.nickname,
    isGuest: row.is_guest,
    rice: row.rice,
    createdAt: row.created_at,
  }
}

export const userStore = {
  async findById(id: string): Promise<User | undefined> {
    const rows = await sql`
      SELECT id, email, password_hash, nickname, is_guest, rice, created_at
      FROM users
      WHERE id = ${id}
    `
    return rows[0] ? rowToUser(rows[0]) : undefined
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const rows = await sql`
      SELECT id, email, password_hash, nickname, is_guest, rice, created_at
      FROM users
      WHERE email = ${email}
    `
    return rows[0] ? rowToUser(rows[0]) : undefined
  },

  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const rows = await sql`
      INSERT INTO users (email, password_hash, nickname, is_guest, rice)
      VALUES (
        ${user.email || null},
        ${user.passwordHash || null},
        ${user.nickname},
        ${user.isGuest},
        ${user.rice}
      )
      RETURNING id, email, password_hash, nickname, is_guest, rice, created_at
    `
    return rowToUser(rows[0])
  },

  async update(id: string, updates: Partial<User>): Promise<User | undefined> {
    const rows = await sql`
      UPDATE users
      SET
        nickname = COALESCE(${updates.nickname ?? null}, nickname),
        rice = COALESCE(${updates.rice ?? null}, rice),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, email, password_hash, nickname, is_guest, rice, created_at
    `
    return rows[0] ? rowToUser(rows[0]) : undefined
  },

  async delete(id: string): Promise<boolean> {
    const result = await sql`
      DELETE FROM users
      WHERE id = ${id}
    `
    return result.count > 0
  },
}
