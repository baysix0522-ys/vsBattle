import { Router, type Request, type Response } from 'express'
import { sql } from '../db/index.js'
import { requireMember } from '../middleware/auth.js'
import { analyzeSaju, generatePremiumAnalysis, type BirthInfo } from '../services/saju.js'
import { consumeRice } from './user.js'

const router = Router()

// 사주 분석은 회원 전용
router.use(requireMember)

const SAJU_ANALYSIS_COST = 50

// JSON 문자열을 객체로 파싱하는 헬퍼 함수
function parseJsonField<T>(value: T | string | null | undefined): T | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
  return value as T
}

// ============================================
// GET /api/saju/profile - 내 활성 사주 프로필 조회
// ============================================
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id

    const [report] = await sql`
      SELECT
        id, birth_date, birth_time, is_time_unknown, gender,
        pillars, day_master, day_master_element, yin_yang,
        basic_analysis, battle_stats, detailed_report, advice,
        premium_analysis,
        created_at
      FROM saju_reports
      WHERE user_id = ${userId} AND is_active = true
    `

    if (!report) {
      return res.json({ hasProfile: false, profile: null })
    }

    const basicAnalysis = parseJsonField<Record<string, unknown>>(report.basic_analysis) || {}
    // 새 필드들은 basic_analysis JSONB에 함께 저장됨
    const twelveStages = basicAnalysis.twelveStages || null
    const specialStars = basicAnalysis.specialStars || null
    const noblePeople = basicAnalysis.noblePeople || null
    const daewoonTable = basicAnalysis.daewoonTable || null
    const balanceScore = basicAnalysis.balanceScore ?? null
    const premiumAnalysis = parseJsonField(report.premium_analysis) || null

    res.json({
      hasProfile: true,
      profile: {
        reportId: report.id,
        birthDate: report.birth_date,
        birthTime: report.birth_time,
        isTimeUnknown: report.is_time_unknown,
        gender: report.gender,
        pillars: parseJsonField(report.pillars),
        basic: basicAnalysis,
        battleStats: parseJsonField(report.battle_stats),
        report: parseJsonField(report.detailed_report),
        advice: parseJsonField(report.advice),
        dayMaster: report.day_master,
        dayMasterElement: report.day_master_element,
        yinYang: report.yin_yang,
        createdAt: report.created_at,
        twelveStages,
        specialStars,
        noblePeople,
        daewoonTable,
        balanceScore,
        premiumAnalysis,
      },
    })
  } catch (error) {
    console.error('사주 프로필 조회 실패:', error)
    res.status(500).json({ error: '사주 프로필 조회 중 오류가 발생했습니다' })
  }
})

// ============================================
// POST /api/saju/analyze - 사주 분석 (생성/재분석)
// ============================================
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const body = req.body || {}
    const birthDate = body.birthDate || null
    const birthTime = body.birthTime || null
    const isTimeUnknown = body.isTimeUnknown ?? true
    const gender = body.gender || null

    console.log('[SAJU] 분석 요청:', { userId, birthDate, birthTime, isTimeUnknown, gender })

    if (!birthDate || !gender) {
      return res.status(400).json({ error: '생년월일과 성별은 필수입니다' })
    }

    // 유저 닉네임 조회
    const [userRow] = await sql`SELECT nickname FROM users WHERE id = ${userId}`
    const nickname = userRow?.nickname || '회원'

    // 기존 활성 프로필 확인
    const [existingActive] = await sql`
      SELECT id FROM saju_reports
      WHERE user_id = ${userId} AND is_active = true
    `
    const isReanalysis = !!existingActive

    // 쌀 잔액 확인 및 차감
    const riceResult = await consumeRice(userId, SAJU_ANALYSIS_COST, '사주 분석', 'saju_analysis')
    if (!riceResult.success) {
      return res.status(400).json({
        error: riceResult.error || '쌀이 부족합니다',
        code: 'INSUFFICIENT_RICE',
        balance: riceResult.balance,
      })
    }

    // 기존 활성 프로필 비활성화
    if (existingActive) {
      await sql`
        UPDATE saju_reports SET is_active = false, updated_at = NOW()
        WHERE id = ${existingActive.id}
      `
    }

    // LLM 사주 분석 실행
    const birthInfo: BirthInfo = {
      birthDate,
      birthTime: isTimeUnknown ? undefined : (birthTime || undefined),
      isTimeUnknown,
      gender,
    }

    const result = await analyzeSaju(birthInfo, nickname)

    // DB에 저장 (새 활성 프로필)
    const [inserted] = await sql`
      INSERT INTO saju_reports (
        user_id, birth_date, birth_time, is_time_unknown, gender,
        pillars, day_master, day_master_element, yin_yang,
        basic_analysis, battle_stats, detailed_report, advice,
        is_active
      ) VALUES (
        ${userId},
        ${birthDate},
        ${birthTime},
        ${isTimeUnknown},
        ${gender},
        ${JSON.stringify(result.pillars)},
        ${result.basic.dayMaster},
        ${result.basic.dayMasterElement},
        ${result.basic.yinYang},
        ${JSON.stringify({
          ...result.basic,
          twelveStages: result.twelveStages,
          specialStars: result.specialStars,
          noblePeople: result.noblePeople,
          daewoonTable: result.daewoonTable,
          balanceScore: result.balanceScore,
        })},
        ${JSON.stringify(result.battleStats)},
        ${JSON.stringify(result.report)},
        ${JSON.stringify(result.advice)},
        true
      )
      RETURNING id
    `

    res.json({
      reportId: inserted?.id,
      isReanalysis,
      result: {
        birthInfo: { birthDate, birthTime, isTimeUnknown, gender },
        pillars: result.pillars,
        sipsin: result.sipsin,
        basic: result.basic,
        currentFortune: result.currentFortune,
        battleStats: result.battleStats,
        report: result.report,
        advice: result.advice,
        twelveStages: result.twelveStages,
        specialStars: result.specialStars,
        noblePeople: result.noblePeople,
        daewoonTable: result.daewoonTable,
        balanceScore: result.balanceScore,
      },
      riceBalance: riceResult.balance,
    })
  } catch (error) {
    console.error('사주 분석 실패:', error)
    res.status(500).json({ error: '사주 분석 중 오류가 발생했습니다' })
  }
})

// ============================================
// POST /api/saju/premium - 프리미엄 분석 (운명의짝, 시기별재산, 찾아올위기)
// ============================================
const PREMIUM_ANALYSIS_COST = 30

router.post('/premium', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id

    // 활성 프로필 확인
    const [report] = await sql`
      SELECT
        id, birth_date, gender,
        pillars, basic_analysis, premium_analysis
      FROM saju_reports
      WHERE user_id = ${userId} AND is_active = true
    `

    if (!report) {
      return res.status(400).json({
        error: '먼저 사주 분석을 진행해주세요.',
        code: 'NO_PROFILE',
      })
    }

    // 이미 프리미엄 분석이 있으면 캐시된 결과 반환
    const existingPremium = parseJsonField(report.premium_analysis)
    if (existingPremium) {
      return res.json({
        premiumAnalysis: existingPremium,
        cached: true,
      })
    }

    // 쌀 차감
    const riceResult = await consumeRice(userId, PREMIUM_ANALYSIS_COST, '프리미엄 사주 분석', 'saju_premium')
    if (!riceResult.success) {
      return res.status(400).json({
        error: riceResult.error || '쌀이 부족합니다',
        code: 'INSUFFICIENT_RICE',
        balance: riceResult.balance,
      })
    }

    // 유저 닉네임 조회
    const [userRow] = await sql`SELECT nickname FROM users WHERE id = ${userId}`
    const nickname = userRow?.nickname || '회원'

    const pillars = parseJsonField<{ year: { heavenlyStem: string; earthlyBranch: string }; month: { heavenlyStem: string; earthlyBranch: string }; day: { heavenlyStem: string; earthlyBranch: string }; hour: { heavenlyStem: string; earthlyBranch: string } | null }>(report.pillars)
    const basicAnalysis = parseJsonField<Record<string, unknown>>(report.basic_analysis)

    if (!pillars || !basicAnalysis) {
      return res.status(500).json({ error: '사주 데이터를 불러올 수 없습니다.' })
    }

    // GPT 프리미엄 분석 실행
    const premiumResult = await generatePremiumAnalysis(
      pillars,
      basicAnalysis as never,
      nickname,
      report.gender,
      report.birth_date
    )

    // DB에 저장
    await sql`
      UPDATE saju_reports
      SET premium_analysis = ${JSON.stringify(premiumResult)}, updated_at = NOW()
      WHERE id = ${report.id}
    `

    res.json({
      premiumAnalysis: premiumResult,
      cached: false,
      riceBalance: riceResult.balance,
    })
  } catch (error) {
    console.error('프리미엄 분석 실패:', error)
    res.status(500).json({ error: '프리미엄 분석 중 오류가 발생했습니다' })
  }
})

export default router
