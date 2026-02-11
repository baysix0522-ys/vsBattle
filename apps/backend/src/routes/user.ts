import { Router, type Request, type Response } from 'express'
import { sql } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// JSON 문자열을 객체로 안전 파싱
function parseJson<T>(value: T | string | null | undefined): T | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T } catch { return null }
  }
  return value as T
}

// ========================================
// 마이페이지 데이터 조회
// ========================================
router.get('/mypage', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id

  try {
    // 1. 사용자 기본 정보 + 쌀 잔액
    const [user] = await sql`
      SELECT id, nickname, email, rice, profile_image, provider, created_at
      FROM users
      WHERE id = ${userId}
    `

    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' })
    }

    // 2. 내 사주 프로필 (활성 프로필)
    const [latestReport] = await sql`
      SELECT id, birth_date, birth_time, gender, day_master, day_master_element,
             pillars, basic_analysis, battle_stats, created_at
      FROM saju_reports
      WHERE user_id = ${userId} AND is_active = true
    `

    // 3. 대결 통계
    const battleStats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'completed') as total_battles,
        COUNT(*) FILTER (WHERE status = 'completed' AND winner_id = ${userId}) as wins,
        COUNT(*) FILTER (WHERE status = 'completed' AND winner_id IS NOT NULL AND winner_id != ${userId}) as losses,
        COUNT(*) FILTER (WHERE status = 'completed' AND winner_id IS NULL) as draws,
        COUNT(*) FILTER (WHERE status = 'pending' AND challenger_id = ${userId}) as pending_sent,
        COUNT(*) FILTER (WHERE status = 'pending' AND opponent_id = ${userId}) as pending_received
      FROM battles
      WHERE challenger_id = ${userId} OR opponent_id = ${userId}
    `

    // 4. 최근 대결 기록 (5개)
    const recentBattles = await sql`
      SELECT
        b.id,
        b.status,
        b.winner_id,
        b.created_at,
        b.completed_at,
        challenger.nickname as challenger_nickname,
        opponent.nickname as opponent_nickname,
        cr.day_master as challenger_day_master,
        cr.day_master_element as challenger_element,
        opr.day_master as opponent_day_master,
        opr.day_master_element as opponent_element,
        CASE
          WHEN b.challenger_id = ${userId} THEN 'challenger'
          ELSE 'opponent'
        END as my_role
      FROM battles b
      JOIN users challenger ON b.challenger_id = challenger.id
      LEFT JOIN users opponent ON b.opponent_id = opponent.id
      JOIN saju_reports cr ON b.challenger_report_id = cr.id
      LEFT JOIN saju_reports opr ON b.opponent_report_id = opr.id
      WHERE b.challenger_id = ${userId} OR b.opponent_id = ${userId}
      ORDER BY b.created_at DESC
      LIMIT 5
    `

    // 5. 최근 이용 서비스 내역 (운세, 대결 등 통합)
    const recentActivities = await sql`
      SELECT * FROM (
        -- 오늘의 운세
        SELECT
          id,
          'fortune' as service_type,
          '오늘의 운세' as service_name,
          '🌅' as service_icon,
          fortune_date::text as detail,
          created_at
        FROM fortune_records
        WHERE user_id = ${userId}

        UNION ALL

        -- 사주 대결
        SELECT
          b.id,
          'battle' as service_type,
          '사주 대결' as service_name,
          '⚔️' as service_icon,
          CASE
            WHEN b.status = 'pending' THEN '대기중'
            WHEN b.winner_id = ${userId} THEN '승리'
            WHEN b.winner_id IS NULL THEN '무승부'
            ELSE '패배'
          END as detail,
          b.created_at
        FROM battles b
        WHERE b.challenger_id = ${userId} OR b.opponent_id = ${userId}

        UNION ALL

        -- 사주 분석 (리포트 생성)
        SELECT
          id,
          'saju' as service_type,
          '사주 분석' as service_name,
          '📜' as service_icon,
          day_master || '일간' as detail,
          created_at
        FROM saju_reports
        WHERE user_id = ${userId}
      ) activities
      ORDER BY created_at DESC
      LIMIT 10
    `

    res.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        email: user.email,
        rice: user.rice,
        profileImage: user.profile_image,
        provider: user.provider,
        createdAt: user.created_at,
      },
      saju: latestReport ? {
        id: latestReport.id,
        birthDate: latestReport.birth_date,
        birthTime: latestReport.birth_time,
        gender: latestReport.gender,
        dayMaster: latestReport.day_master,
        dayMasterElement: latestReport.day_master_element,
        pillars: parseJson(latestReport.pillars),
        basicAnalysis: parseJson(latestReport.basic_analysis),
        battleStats: parseJson(latestReport.battle_stats),
        createdAt: latestReport.created_at,
      } : null,
      battleStats: {
        total: Number(battleStats[0]?.total_battles) || 0,
        wins: Number(battleStats[0]?.wins) || 0,
        losses: Number(battleStats[0]?.losses) || 0,
        draws: Number(battleStats[0]?.draws) || 0,
        pendingSent: Number(battleStats[0]?.pending_sent) || 0,
        pendingReceived: Number(battleStats[0]?.pending_received) || 0,
      },
      recentBattles: recentBattles.map(b => ({
        id: b.id,
        status: b.status,
        winnerId: b.winner_id,
        createdAt: b.created_at,
        completedAt: b.completed_at,
        myRole: b.my_role,
        challenger: {
          nickname: b.challenger_nickname,
          dayMaster: b.challenger_day_master,
          element: b.challenger_element,
        },
        opponent: b.opponent_nickname ? {
          nickname: b.opponent_nickname,
          dayMaster: b.opponent_day_master,
          element: b.opponent_element,
        } : null,
      })),
      recentActivities: recentActivities.map(a => ({
        id: a.id,
        serviceType: a.service_type,
        serviceName: a.service_name,
        serviceIcon: a.service_icon,
        detail: a.detail,
        createdAt: a.created_at,
      })),
    })
  } catch (error) {
    console.error('마이페이지 조회 실패:', error)
    res.status(500).json({ error: '마이페이지 데이터를 불러올 수 없습니다' })
  }
})

// ========================================
// 일일 보너스 상태 확인
// ========================================
router.get('/daily-bonus', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  // 한국 시간 기준 오늘 시작/끝
  const now = new Date()
  const koreaOffset = 9 * 60 * 60 * 1000
  const koreaTime = new Date(now.getTime() + koreaOffset)
  const todayStart = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  // UTC로 변환
  const todayStartUTC = new Date(todayStart.getTime() - koreaOffset)
  const todayEndUTC = new Date(todayEnd.getTime() - koreaOffset)

  try {
    // 오늘 로그인 보너스 받았는지 확인
    const [loginBonus] = await sql`
      SELECT id FROM rice_transactions
      WHERE user_id = ${userId}
        AND reference_type = 'daily_login'
        AND created_at >= ${todayStartUTC.toISOString()}
        AND created_at < ${todayEndUTC.toISOString()}
    `

    // 오늘 운세 보너스 받았는지 확인
    const [fortuneBonus] = await sql`
      SELECT id FROM rice_transactions
      WHERE user_id = ${userId}
        AND reference_type = 'daily_fortune'
        AND created_at >= ${todayStartUTC.toISOString()}
        AND created_at < ${todayEndUTC.toISOString()}
    `

    res.json({
      loginBonus: {
        claimed: !!loginBonus,
        amount: 20,
      },
      fortuneBonus: {
        claimed: !!fortuneBonus,
        amount: 30,
      },
    })
  } catch (error) {
    console.error('일일 보너스 확인 실패:', error)
    res.status(500).json({ error: '보너스 상태를 확인할 수 없습니다' })
  }
})

// ========================================
// 일일 로그인 보너스 수령
// ========================================
router.post('/daily-bonus/login', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  const BONUS_AMOUNT = 20

  // 한국 시간 기준 오늘 시작/끝
  const now = new Date()
  const koreaOffset = 9 * 60 * 60 * 1000
  const koreaTime = new Date(now.getTime() + koreaOffset)
  const todayStart = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
  const todayStartUTC = new Date(todayStart.getTime() - koreaOffset)
  const todayEndUTC = new Date(todayEnd.getTime() - koreaOffset)

  try {
    // 이미 받았는지 확인
    const [existing] = await sql`
      SELECT id FROM rice_transactions
      WHERE user_id = ${userId}
        AND reference_type = 'daily_login'
        AND created_at >= ${todayStartUTC.toISOString()}
        AND created_at < ${todayEndUTC.toISOString()}
    `

    if (existing) {
      return res.status(400).json({ error: '오늘 로그인 보너스를 이미 받았습니다' })
    }

    // 쌀 충전
    const [user] = await sql`SELECT rice FROM users WHERE id = ${userId} FOR UPDATE`
    const newBalance = (user?.rice || 0) + BONUS_AMOUNT

    await sql`UPDATE users SET rice = ${newBalance}, updated_at = NOW() WHERE id = ${userId}`

    await sql`
      INSERT INTO rice_transactions (user_id, type, amount, balance_after, description, reference_type)
      VALUES (${userId}, 'bonus', ${BONUS_AMOUNT}, ${newBalance}, '일일 로그인 보너스', 'daily_login')
    `

    res.json({
      success: true,
      amount: BONUS_AMOUNT,
      balance: newBalance,
    })
  } catch (error) {
    console.error('로그인 보너스 지급 실패:', error)
    res.status(500).json({ error: '보너스 지급에 실패했습니다' })
  }
})

// ========================================
// 쌀 거래 내역 조회
// ========================================
router.get('/rice/transactions', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
  const offset = (page - 1) * limit

  try {
    // 현재 잔액
    const [user] = await sql`SELECT rice FROM users WHERE id = ${userId}`

    // 총 거래 수
    const [countResult] = await sql`
      SELECT COUNT(*) as total FROM rice_transactions WHERE user_id = ${userId}
    `

    // 거래 내역
    const transactions = await sql`
      SELECT id, type, amount, balance_after, description, reference_type, reference_id, created_at
      FROM rice_transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    res.json({
      balance: user?.rice || 0,
      total: Number(countResult?.total) || 0,
      page,
      limit,
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balance_after,
        description: t.description,
        referenceType: t.reference_type,
        referenceId: t.reference_id,
        createdAt: t.created_at,
      })),
    })
  } catch (error) {
    console.error('쌀 내역 조회 실패:', error)
    res.status(500).json({ error: '쌀 내역을 불러올 수 없습니다' })
  }
})

// ========================================
// 쌀 소비 (내부용 - 사주 리포트 생성 등에서 호출)
// ========================================
export async function consumeRice(
  userId: string,
  amount: number,
  description: string,
  referenceType?: string,
  referenceId?: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    // 현재 잔액 확인
    const [user] = await sql`SELECT rice FROM users WHERE id = ${userId} FOR UPDATE`

    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없습니다' }
    }

    if (user.rice < amount) {
      return { success: false, error: '쌀이 부족합니다', balance: user.rice }
    }

    const newBalance = user.rice - amount

    // 잔액 차감
    await sql`UPDATE users SET rice = ${newBalance}, updated_at = NOW() WHERE id = ${userId}`

    // 거래 내역 기록
    await sql`
      INSERT INTO rice_transactions (user_id, type, amount, balance_after, description, reference_type, reference_id)
      VALUES (${userId}, 'consume', ${-amount}, ${newBalance}, ${description}, ${referenceType || null}, ${referenceId || null})
    `

    return { success: true, balance: newBalance }
  } catch (error) {
    console.error('쌀 소비 실패:', error)
    return { success: false, error: '쌀 소비 처리 중 오류가 발생했습니다' }
  }
}

// ========================================
// 쌀 충전 (내부용 - 결제 완료 시 호출)
// ========================================
export async function chargeRice(
  userId: string,
  amount: number,
  description: string,
  referenceType?: string,
  referenceId?: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const [user] = await sql`SELECT rice FROM users WHERE id = ${userId} FOR UPDATE`

    if (!user) {
      return { success: false, error: '사용자를 찾을 수 없습니다' }
    }

    const newBalance = user.rice + amount

    // 잔액 증가
    await sql`UPDATE users SET rice = ${newBalance}, updated_at = NOW() WHERE id = ${userId}`

    // 거래 내역 기록
    await sql`
      INSERT INTO rice_transactions (user_id, type, amount, balance_after, description, reference_type, reference_id)
      VALUES (${userId}, 'charge', ${amount}, ${newBalance}, ${description}, ${referenceType || null}, ${referenceId || null})
    `

    return { success: true, balance: newBalance }
  } catch (error) {
    console.error('쌀 충전 실패:', error)
    return { success: false, error: '쌀 충전 처리 중 오류가 발생했습니다' }
  }
}

// ========================================
// 회원 탈퇴
// ========================================
router.delete('/withdraw', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id

  try {
    // 1. 사용자 관련 데이터 삭제 (순서 중요 - FK 제약)
    // 쌀 거래 내역
    await sql`DELETE FROM rice_transactions WHERE user_id = ${userId}`

    // 결제 내역
    await sql`DELETE FROM payments WHERE user_id = ${userId}`

    // 이름 분석 기록
    await sql`DELETE FROM name_analyses WHERE user_id = ${userId}`

    // 운세 기록
    await sql`DELETE FROM fortune_records WHERE user_id = ${userId}`

    // 대결 기록 (참가한 대결)
    await sql`DELETE FROM battles WHERE challenger_id = ${userId} OR opponent_id = ${userId}`

    // 사주 리포트
    await sql`DELETE FROM saju_reports WHERE user_id = ${userId}`

    // 2. 사용자 삭제
    await sql`DELETE FROM users WHERE id = ${userId}`

    res.json({ success: true, message: '회원 탈퇴가 완료되었습니다' })
  } catch (error) {
    console.error('회원 탈퇴 실패:', error)
    res.status(500).json({ error: '회원 탈퇴 처리 중 오류가 발생했습니다' })
  }
})

// ========================================
// 닉네임 변경
// ========================================
router.patch('/nickname', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  const { nickname } = req.body

  if (!nickname || typeof nickname !== 'string') {
    return res.status(400).json({ error: '닉네임을 입력해주세요' })
  }

  const trimmed = nickname.trim()
  if (trimmed.length < 2 || trimmed.length > 20) {
    return res.status(400).json({ error: '닉네임은 2~20자 사이여야 합니다' })
  }

  try {
    await sql`UPDATE users SET nickname = ${trimmed}, updated_at = NOW() WHERE id = ${userId}`
    res.json({ success: true, nickname: trimmed })
  } catch (error) {
    console.error('닉네임 변경 실패:', error)
    res.status(500).json({ error: '닉네임 변경에 실패했습니다' })
  }
})

// ========================================
// 대결 히스토리 전체 조회
// ========================================
router.get('/battles', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
  const offset = (page - 1) * limit
  const status = req.query.status as string | undefined

  try {
    // 총 개수
    const countQuery = status
      ? sql`SELECT COUNT(*) as total FROM battles WHERE (challenger_id = ${userId} OR opponent_id = ${userId}) AND status = ${status}`
      : sql`SELECT COUNT(*) as total FROM battles WHERE challenger_id = ${userId} OR opponent_id = ${userId}`

    const [countResult] = await countQuery

    // 대결 목록
    const baseQuery = `
      SELECT
        b.id,
        b.status,
        b.winner_id,
        b.share_code,
        b.result,
        b.chemistry,
        b.created_at,
        b.completed_at,
        challenger.nickname as challenger_nickname,
        opponent.nickname as opponent_nickname,
        cr.day_master as challenger_day_master,
        cr.day_master_element as challenger_element,
        opr.day_master as opponent_day_master,
        opr.day_master_element as opponent_element,
        CASE
          WHEN b.challenger_id = $1 THEN 'challenger'
          ELSE 'opponent'
        END as my_role
      FROM battles b
      JOIN users challenger ON b.challenger_id = challenger.id
      LEFT JOIN users opponent ON b.opponent_id = opponent.id
      JOIN saju_reports cr ON b.challenger_report_id = cr.id
      LEFT JOIN saju_reports opr ON b.opponent_report_id = opr.id
      WHERE (b.challenger_id = $1 OR b.opponent_id = $1)
    `

    const battles = status
      ? await sql.unsafe(`${baseQuery} AND b.status = $2 ORDER BY b.created_at DESC LIMIT $3 OFFSET $4`, [userId, status, limit, offset])
      : await sql.unsafe(`${baseQuery} ORDER BY b.created_at DESC LIMIT $2 OFFSET $3`, [userId, limit, offset])

    res.json({
      total: Number(countResult?.total) || 0,
      page,
      limit,
      battles: battles.map((b: Record<string, unknown>) => ({
        id: b.id,
        status: b.status,
        winnerId: b.winner_id,
        shareCode: b.share_code,
        result: b.result,
        chemistry: b.chemistry,
        createdAt: b.created_at,
        completedAt: b.completed_at,
        myRole: b.my_role,
        challenger: {
          nickname: b.challenger_nickname,
          dayMaster: b.challenger_day_master,
          element: b.challenger_element,
        },
        opponent: b.opponent_nickname ? {
          nickname: b.opponent_nickname,
          dayMaster: b.opponent_day_master,
          element: b.opponent_element,
        } : null,
      })),
    })
  } catch (error) {
    console.error('대결 히스토리 조회 실패:', error)
    res.status(500).json({ error: '대결 기록을 불러올 수 없습니다' })
  }
})

export default router
