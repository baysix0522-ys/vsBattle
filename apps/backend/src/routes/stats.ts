import { Router, type Request, type Response } from 'express'
import { sql } from '../db/index.js'

const router = Router()

// ========================================
// 테이블 생성 (앱 시작 시 호출)
// ========================================
export async function ensureStatsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS daily_visits (
      visit_date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
      visit_count INTEGER DEFAULT 0
    )
  `
}

// ========================================
// 방문 기록 (중복 방지는 프론트에서 세션스토리지로)
// ========================================
router.post('/visit', async (_req: Request, res: Response) => {
  try {
    // 오늘 날짜의 방문 수 증가 (없으면 생성)
    await sql`
      INSERT INTO daily_visits (visit_date, visit_count)
      VALUES (CURRENT_DATE, 1)
      ON CONFLICT (visit_date)
      DO UPDATE SET visit_count = daily_visits.visit_count + 1
    `
    res.json({ success: true })
  } catch (error) {
    console.error('방문 기록 실패:', error)
    res.status(500).json({ error: '방문 기록 실패' })
  }
})

// ========================================
// 오늘의 방문자 수 조회
// ========================================
router.get('/today', async (_req: Request, res: Response) => {
  try {
    const [result] = await sql`
      SELECT visit_count FROM daily_visits
      WHERE visit_date = CURRENT_DATE
    `
    res.json({ count: result?.visit_count || 0 })
  } catch (error) {
    console.error('방문자 수 조회 실패:', error)
    res.status(500).json({ error: '방문자 수 조회 실패' })
  }
})

export default router
