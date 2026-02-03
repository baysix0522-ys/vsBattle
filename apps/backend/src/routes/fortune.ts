import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { userStore } from '../store/userStore.js'
import { generateTodayFortune } from '../services/fortune.js'
import { sql } from '../db/index.js'
import type { AuthPayload } from '../types/user.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'saju-battle-secret-key-change-in-production'

// 인증 미들웨어
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다.' })
  }

  try {
    const token = authHeader.slice(7)
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload
    req.userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' })
  }
}

// 오늘의 운세 가져오기
router.get('/today', authenticate, async (req: any, res) => {
  try {
    const user = await userStore.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
    }

    // 쌀 체크 (운세 보기: 1쌀)
    const FORTUNE_COST = 1
    if (user.rice < FORTUNE_COST) {
      return res.status(402).json({
        error: '쌀이 부족합니다.',
        required: FORTUNE_COST,
        current: user.rice,
      })
    }

    // 운세 생성
    const fortune = await generateTodayFortune(user.nickname)

    // 쌀 차감
    await userStore.update(user.id, { rice: user.rice - FORTUNE_COST })

    res.json({
      fortune,
      riceUsed: FORTUNE_COST,
      riceRemaining: user.rice - FORTUNE_COST,
    })
  } catch (error) {
    console.error('Fortune error:', error)
    res.status(500).json({ error: '운세 생성 중 오류가 발생했습니다.' })
  }
})

// 무료 미리보기 (점수만)
router.get('/today/preview', authenticate, async (req: any, res) => {
  try {
    const user = await userStore.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
    }

    // 간단한 미리보기 (날짜 기반 랜덤 점수)
    const today = new Date()
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
    const score = 60 + ((seed * 7 + user.id.charCodeAt(0)) % 35) // 60-94 사이

    res.json({
      date: `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`,
      score,
      summary: '자세한 운세를 확인하려면 1쌀이 필요합니다.',
      userRice: user.rice,
    })
  } catch (error) {
    console.error('Preview error:', error)
    res.status(500).json({ error: '오류가 발생했습니다.' })
  }
})

// 운세 기록 저장 (로그인 사용자만)
router.post('/record', authenticate, async (req: any, res) => {
  try {
    const user = await userStore.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
    }

    // 게스트는 기록 저장 불가
    if (user.isGuest) {
      return res.status(403).json({
        error: '게스트는 운세를 기록할 수 없습니다.',
        message: '회원가입하면 운세 기록을 저장할 수 있어요!',
      })
    }

    const { birthInfo, fortuneResult } = req.body
    if (!birthInfo || !fortuneResult) {
      return res.status(400).json({ error: '생년월일 정보와 운세 결과가 필요합니다.' })
    }

    const today = new Date().toISOString().split('T')[0]! // YYYY-MM-DD

    // 오늘 이미 기록이 있는지 확인 (리워드 중복 지급 방지)
    const existingRecord = await sql`
      SELECT id FROM fortune_records
      WHERE user_id = ${user.id} AND fortune_date = ${today}
    `
    const isFirstViewToday = existingRecord.length === 0

    // UPSERT: 같은 날짜에 이미 기록이 있으면 업데이트
    // postgres 라이브러리가 JSONB 직렬화를 자동 처리함
    const result = await sql`
      INSERT INTO fortune_records (user_id, fortune_date, birth_info, fortune_result)
      VALUES (${user.id}, ${today}, ${sql.json(birthInfo)}, ${sql.json(fortuneResult)})
      ON CONFLICT (user_id, fortune_date)
      DO UPDATE SET
        birth_info = ${sql.json(birthInfo)},
        fortune_result = ${sql.json(fortuneResult)},
        created_at = NOW()
      RETURNING id, fortune_date
    `

    // 오늘 첫 운세 확인이면 쌀 10개 지급
    let riceReward = 0
    if (isFirstViewToday) {
      riceReward = 10
      await sql`
        UPDATE users SET rice = rice + ${riceReward}, updated_at = NOW()
        WHERE id = ${user.id}
      `
    }

    // 업데이트된 쌀 정보 조회
    const updatedUser = await userStore.findById(user.id)

    const record = result[0]
    res.json({
      success: true,
      recordId: record?.id ?? '',
      date: record?.fortune_date ?? today,
      riceReward,
      totalRice: updatedUser?.rice ?? user.rice,
    })
  } catch (error) {
    console.error('Fortune record save error:', error)
    res.status(500).json({ error: '운세 기록 저장 중 오류가 발생했습니다.' })
  }
})

// 운세 기록 조회 (로그인 사용자만)
router.get('/records', authenticate, async (req: any, res) => {
  try {
    const user = await userStore.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
    }

    if (user.isGuest) {
      return res.status(403).json({
        error: '게스트는 기록을 조회할 수 없습니다.',
      })
    }

    const limit = Math.min(Number(req.query.limit) || 30, 100)

    const records = await sql`
      SELECT id, fortune_date, birth_info, fortune_result, created_at
      FROM fortune_records
      WHERE user_id = ${user.id}
      ORDER BY fortune_date DESC
      LIMIT ${limit}
    `

    res.json({
      records: records.map((r) => ({
        id: r.id,
        date: r.fortune_date,
        birthInfo: r.birth_info,
        fortuneResult: r.fortune_result,
        createdAt: r.created_at,
      })),
    })
  } catch (error) {
    console.error('Fortune records fetch error:', error)
    res.status(500).json({ error: '운세 기록 조회 중 오류가 발생했습니다.' })
  }
})

// 오늘의 기록 조회
router.get('/record/today', authenticate, async (req: any, res) => {
  try {
    const user = await userStore.findById(req.userId)
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' })
    }

    if (user.isGuest) {
      return res.json({ record: null, isGuest: true })
    }

    const today = new Date().toISOString().split('T')[0]!

    const records = await sql`
      SELECT id, fortune_date, birth_info, fortune_result, created_at
      FROM fortune_records
      WHERE user_id = ${user.id} AND fortune_date = ${today}
    `

    res.json({
      record: records[0]
        ? {
            id: records[0].id,
            date: records[0].fortune_date,
            birthInfo: records[0].birth_info,
            fortuneResult: records[0].fortune_result,
            createdAt: records[0].created_at,
          }
        : null,
    })
  } catch (error) {
    console.error('Today record fetch error:', error)
    res.status(500).json({ error: '오늘의 기록 조회 중 오류가 발생했습니다.' })
  }
})

export default router
