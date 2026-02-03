import 'dotenv/config'
import { sql } from './index.js'

async function migrate() {
  console.log('Running migrations...')

  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        nickname VARCHAR(50) NOT NULL,
        is_guest BOOLEAN DEFAULT FALSE,
        rice INTEGER DEFAULT 100,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log('Users table created/verified')

    // Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_is_guest ON users(is_guest)`
    console.log('Indexes created/verified')

    // Fortune records table (로그인 사용자만)
    await sql`
      CREATE TABLE IF NOT EXISTS fortune_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        fortune_date DATE NOT NULL,
        birth_info JSONB NOT NULL,
        fortune_result JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, fortune_date)
      )
    `
    console.log('Fortune records table created/verified')

    // Fortune records indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_fortune_records_user_id ON fortune_records(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_fortune_records_date ON fortune_records(fortune_date)`
    console.log('Fortune records indexes created/verified')

    console.log('Migrations completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

migrate()
