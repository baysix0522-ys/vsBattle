import { Router, type Request, type Response } from 'express'
import { sql } from '../db/index.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

// ========================================
// 마이페이지 데이터 조회
// ========================================
router.get('/mypage', authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest

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

    // 2. 내 사주 리포트 (가장 최근 것)
    const [latestReport] = await sql`
      SELECT id, birth_date, birth_time, gender, day_master, day_master_element,
             pillars, basic_analysis, battle_stats, created_at
      FROM saju_reports
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 1
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
        pillars: latestReport.pillars,
        basicAnalysis: latestReport.basic_analysis,
        battleStats: latestReport.battle_stats,
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
    })
  } catch (error) {
    console.error('마이페이지 조회 실패:', error)
    res.status(500).json({ error: '마이페이지 데이터를 불러올 수 없습니다' })
  }
})

// ========================================
// 쌀 거래 내역 조회
// ========================================
router.get('/rice/transactions', authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest
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
// 닉네임 변경
// ========================================
router.patch('/nickname', authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest
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
router.get('/battles', authMiddleware, async (req: Request, res: Response) => {
  const { userId } = req as AuthRequest
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
