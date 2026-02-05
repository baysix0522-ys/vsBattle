import { sql } from '../db/index.js'
import type { User, AuthProvider } from '../types/user.js'

// DB row를 User 타입으로 변환
function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: (row.email as string) ?? '',
    passwordHash: (row.password_hash as string) ?? '',
    nickname: row.nickname as string,
    isGuest: row.is_guest as boolean,
    rice: row.rice as number,
    provider: ((row.provider as string) || 'local') as AuthProvider,
    providerId: (row.provider_id as string | null) ?? null,
    profileImage: (row.profile_image as string | null) ?? null,
    createdAt: row.created_at as Date,
  }
}

const USER_SELECT_FIELDS = sql`id, email, password_hash, nickname, is_guest, rice, provider, provider_id, profile_image, created_at`

export const userStore = {
  async findById(id: string): Promise<User | undefined> {
    const rows = await sql`
      SELECT ${USER_SELECT_FIELDS}
      FROM users
      WHERE id = ${id}
    `
    return rows[0] ? rowToUser(rows[0]) : undefined
  },

  async findByEmail(email: string): Promise<User | undefined> {
    const rows = await sql`
      SELECT ${USER_SELECT_FIELDS}
      FROM users
      WHERE email = ${email}
    `
    return rows[0] ? rowToUser(rows[0]) : undefined
  },

  async findByProvider(provider: AuthProvider, providerId: string): Promise<User | undefined> {
    const rows = await sql`
      SELECT ${USER_SELECT_FIELDS}
      FROM users
      WHERE provider = ${provider} AND provider_id = ${providerId}
    `
    return rows[0] ? rowToUser(rows[0]) : undefined
  },

  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const rows = await sql`
      INSERT INTO users (email, password_hash, nickname, is_guest, rice, provider, provider_id, profile_image)
      VALUES (
        ${user.email || null},
        ${user.passwordHash || null},
        ${user.nickname},
        ${user.isGuest},
        ${user.rice},
        ${user.provider || 'local'},
        ${user.providerId || null},
        ${user.profileImage || null}
      )
      RETURNING ${USER_SELECT_FIELDS}
    `
    return rowToUser(rows[0]!)
  },

  async createSocial(data: {
    provider: AuthProvider
    providerId: string
    nickname: string
    email?: string
    profileImage?: string
  }): Promise<User> {
    const rows = await sql`
      INSERT INTO users (email, nickname, is_guest, rice, provider, provider_id, profile_image)
      VALUES (
        ${data.email || null},
        ${data.nickname},
        false,
        100,
        ${data.provider},
        ${data.providerId},
        ${data.profileImage || null}
      )
      RETURNING ${USER_SELECT_FIELDS}
    `
    return rowToUser(rows[0]!)
  },

  async update(id: string, updates: Partial<User>): Promise<User | undefined> {
    const rows = await sql`
      UPDATE users
      SET
        nickname = COALESCE(${updates.nickname ?? null}, nickname),
        rice = COALESCE(${updates.rice ?? null}, rice),
        profile_image = COALESCE(${updates.profileImage ?? null}, profile_image),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING ${USER_SELECT_FIELDS}
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
