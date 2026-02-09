import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

export const sql = postgres(connectionString, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

// 연결 테스트
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as now`
    console.log('Database connected:', result[0]?.now)
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

// rice_transactions 테이블 생성 (없으면)
export async function ensureRiceTransactionsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS rice_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) NOT NULL CHECK (type IN ('charge', 'consume', 'refund', 'bonus')),
        amount INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        description VARCHAR(255) NOT NULL,
        reference_type VARCHAR(50),
        reference_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_rice_transactions_user_id ON rice_transactions(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_rice_transactions_created_at ON rice_transactions(created_at)`
    await sql`CREATE INDEX IF NOT EXISTS idx_rice_transactions_reference ON rice_transactions(reference_type, created_at)`
    console.log('rice_transactions table ready')
  } catch (error) {
    console.error('Failed to create rice_transactions table:', error)
  }
}

// name_analysis_records 테이블 생성 (없으면)
export async function ensureNameAnalysisTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS name_analysis_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        korean_name VARCHAR(10) NOT NULL,
        surname VARCHAR(5),
        surname_hanja VARCHAR(5),
        selected_hanja VARCHAR(30) NOT NULL,
        analysis_result JSONB NOT NULL,
        overall_score INTEGER NOT NULL,
        overall_grade VARCHAR(10) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_name_analysis_user ON name_analysis_records(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_name_analysis_name ON name_analysis_records(korean_name, selected_hanja)`
    console.log('name_analysis_records table ready')
  } catch (error) {
    console.error('Failed to create name_analysis_records table:', error)
  }
}

// access_logs 테이블 생성 (접속 로그)
export async function ensureAccessLogsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS access_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(100),
        access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('login', 'guest', 'visit', 'logout')),
        provider VARCHAR(20),
        ip_address VARCHAR(45),
        user_agent TEXT,
        device_type VARCHAR(20),
        browser VARCHAR(50),
        os VARCHAR(50),
        country VARCHAR(50),
        city VARCHAR(100),
        referer TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_access_logs_type ON access_logs(access_type)`
    await sql`CREATE INDEX IF NOT EXISTS idx_access_logs_session ON access_logs(session_id)`
    console.log('access_logs table ready')
  } catch (error) {
    console.error('Failed to create access_logs table:', error)
  }
}
