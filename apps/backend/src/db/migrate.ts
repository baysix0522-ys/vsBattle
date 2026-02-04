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
        provider VARCHAR(20) DEFAULT 'local',
        provider_id VARCHAR(100),
        profile_image VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    console.log('Users table created/verified')

    // 기존 테이블에 소셜 로그인 컬럼 추가 (이미 존재하면 무시)
    await sql`
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'local';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(100);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(500);
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `
    console.log('Social login columns added/verified')

    // Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_is_guest ON users(is_guest)`
    await sql`CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id)`
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

    // Saju Reports table (LLM으로 생성된 사주 분석 결과 저장)
    await sql`
      CREATE TABLE IF NOT EXISTS saju_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        birth_date DATE NOT NULL,
        birth_time VARCHAR(5),
        is_time_unknown BOOLEAN DEFAULT FALSE,
        gender VARCHAR(10) NOT NULL,

        -- 사주 기둥
        pillars JSONB NOT NULL,

        -- 기본 분석
        day_master VARCHAR(2) NOT NULL,
        day_master_element VARCHAR(2) NOT NULL,
        yin_yang VARCHAR(4) NOT NULL,

        -- LLM 생성 분석 결과
        basic_analysis JSONB NOT NULL,
        battle_stats JSONB NOT NULL,
        detailed_report JSONB NOT NULL,
        advice JSONB NOT NULL,

        -- 메타
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

        UNIQUE(user_id, birth_date, birth_time, gender)
      )
    `
    console.log('Saju reports table created/verified')

    await sql`CREATE INDEX IF NOT EXISTS idx_saju_reports_user_id ON saju_reports(user_id)`
    console.log('Saju reports indexes created/verified')

    // Battles table (사주 대결)
    await sql`
      CREATE TABLE IF NOT EXISTS battles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        challenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        challenger_report_id UUID NOT NULL REFERENCES saju_reports(id) ON DELETE CASCADE,
        opponent_id UUID REFERENCES users(id) ON DELETE SET NULL,
        opponent_report_id UUID REFERENCES saju_reports(id) ON DELETE SET NULL,

        -- 대결 상태
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        share_code VARCHAR(20) UNIQUE NOT NULL,

        -- 대결 결과 (완료 시)
        result JSONB,
        winner_id UUID,

        -- 케미스트리 (천간합/충 분석)
        chemistry JSONB,

        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      )
    `
    console.log('Battles table created/verified')

    await sql`CREATE INDEX IF NOT EXISTS idx_battles_challenger_id ON battles(challenger_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_battles_opponent_id ON battles(opponent_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_battles_share_code ON battles(share_code)`
    await sql`CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status)`
    console.log('Battles indexes created/verified')

    console.log('Migrations completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

migrate()
