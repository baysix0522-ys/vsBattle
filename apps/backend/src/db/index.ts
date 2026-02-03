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
    console.log('Database connected:', result[0].now)
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}
