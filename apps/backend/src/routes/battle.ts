import { Router } from 'express'
import { sql } from '../db/index.js'
import { requireAuth, requireMember } from '../middleware/auth.js'
import {
  analyzeSaju,
  calculateBattleResult,
  type BirthInfo,
  type BattleResult,
} from '../services/saju.js'
import crypto from 'crypto'

const router = Router()

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

// 유료 서비스이므로 회원만 가능
router.use(requireMember)

// ============================================
// 사주 분석 API
// ============================================

/**
 * POST /api/battle/analyze
 * 사주 분석 요청 (LLM 호출)
 */
router.post('/analyze', async (req, res) => {
  try {
    // requireMember 미들웨어에서 이미 인증 및 회원 확인 완료
    const userId = req.user!.id
    const body = req.body || {}
    const birthDate = body.birthDate || null
    const birthTime = body.birthTime || null
    const isTimeUnknown = body.isTimeUnknown ?? true
    const gender = body.gender || null

    console.log('[BATTLE] 분석 요청:', { userId, birthDate, birthTime, isTimeUnknown, gender })

    if (!birthDate || !gender) {
      return res.status(400).json({ error: '생년월일과 성별은 필수입니다' })
    }

    // 기존 리포트 확인
    const existingReports = await sql`
      SELECT id, pillars, day_master, day_master_element, basic_analysis, battle_stats, detailed_report, advice, created_at
      FROM saju_reports
      WHERE user_id = ${userId}
        AND birth_date = ${birthDate}
        AND COALESCE(birth_time, '') = COALESCE(${birthTime}, '')
        AND gender = ${gender}
    `

    if (existingReports.length > 0) {
      const existing = existingReports[0]!
      return res.json({
        reportId: existing.id,
        isExisting: true,
        result: {
          birthInfo: { birthDate, birthTime, isTimeUnknown, gender },
          pillars: parseJsonField(existing.pillars),
          basic: parseJsonField(existing.basic_analysis),
          battleStats: parseJsonField(existing.battle_stats),
          report: parseJsonField(existing.detailed_report),
          advice: parseJsonField(existing.advice),
        },
      })
    }

    // LLM 사주 분석 실행
    const birthInfo: BirthInfo = {
      birthDate,
      birthTime: isTimeUnknown ? undefined : (birthTime || undefined),
      isTimeUnknown,
      gender,
    }

    const result = await analyzeSaju(birthInfo)

    // DB에 저장
    const [inserted] = await sql`
      INSERT INTO saju_reports (
        user_id, birth_date, birth_time, is_time_unknown, gender,
        pillars, day_master, day_master_element, yin_yang,
        basic_analysis, battle_stats, detailed_report, advice
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
        ${JSON.stringify(result.basic)},
        ${JSON.stringify(result.battleStats)},
        ${JSON.stringify(result.report)},
        ${JSON.stringify(result.advice)}
      )
      RETURNING id
    `

    res.json({
      reportId: inserted?.id,
      isExisting: false,
      result,
    })
  } catch (error) {
    console.error('사주 분석 실패:', error)
    res.status(500).json({ error: '사주 분석 중 오류가 발생했습니다' })
  }
})

/**
 * GET /api/battle/my-reports
 * 내 사주 리포트 목록
 */
router.get('/my-reports', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다' })
    }

    const reports = await sql`
      SELECT
        id, birth_date, birth_time, is_time_unknown, gender,
        pillars, day_master, day_master_element, yin_yang,
        basic_analysis, battle_stats, detailed_report, advice,
        created_at
      FROM saju_reports
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    res.json({ reports })
  } catch (error) {
    console.error('리포트 목록 조회 실패:', error)
    res.status(500).json({ error: '리포트 목록 조회 중 오류가 발생했습니다' })
  }
})

/**
 * GET /api/battle/report/:reportId
 * 특정 사주 리포트 조회
 */
router.get('/report/:reportId', async (req, res) => {
  try {
    const userId = req.user?.id
    const { reportId } = req.params

    const [report] = await sql`
      SELECT
        id, user_id, birth_date, birth_time, is_time_unknown, gender,
        pillars, day_master, day_master_element, yin_yang,
        basic_analysis, battle_stats, detailed_report, advice,
        created_at
      FROM saju_reports
      WHERE id = ${reportId}
    `

    if (!report) {
      return res.status(404).json({ error: '리포트를 찾을 수 없습니다' })
    }

    // 본인 리포트만 상세 조회 가능
    if (report.user_id !== userId) {
      return res.status(403).json({ error: '접근 권한이 없습니다' })
    }

    res.json({ report })
  } catch (error) {
    console.error('리포트 조회 실패:', error)
    res.status(500).json({ error: '리포트 조회 중 오류가 발생했습니다' })
  }
})

// ============================================
// 대결 생성/관리 API
// ============================================

/**
 * POST /api/battle/create
 * 대결 생성 (공유 코드 발급)
 */
router.post('/create', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다' })
    }

    const { reportId } = req.body

    if (!reportId) {
      return res.status(400).json({ error: '사주 리포트 ID가 필요합니다' })
    }

    // 리포트 존재 및 소유권 확인
    const [report] = await sql`
      SELECT id, user_id FROM saju_reports WHERE id = ${reportId}
    `

    if (!report) {
      return res.status(404).json({ error: '리포트를 찾을 수 없습니다' })
    }

    if (report.user_id !== userId) {
      return res.status(403).json({ error: '본인의 리포트만 사용할 수 있습니다' })
    }

    // 공유 코드 생성 (8자리 영숫자)
    const shareCode = crypto.randomBytes(4).toString('hex').toUpperCase()

    // 대결 생성
    const [battle] = await sql`
      INSERT INTO battles (
        challenger_id, challenger_report_id, share_code, status
      ) VALUES (
        ${userId}, ${reportId}, ${shareCode}, 'pending'
      )
      RETURNING id, share_code, created_at
    `

    res.json({
      battleId: battle?.id,
      shareCode: battle?.share_code,
      shareUrl: `/battle/join/${battle?.share_code}`,
      createdAt: battle?.created_at,
    })
  } catch (error) {
    console.error('대결 생성 실패:', error)
    res.status(500).json({ error: '대결 생성 중 오류가 발생했습니다' })
  }
})

/**
 * GET /api/battle/join/:shareCode
 * 공유 코드로 대결 정보 조회 (참가 전)
 */
router.get('/join/:shareCode', async (req, res) => {
  try {
    const { shareCode } = req.params

    const [battle] = await sql`
      SELECT
        b.id, b.status, b.share_code, b.created_at,
        b.challenger_id, b.opponent_id,
        u.nickname as challenger_nickname,
        sr.day_master as challenger_day_master,
        sr.day_master_element as challenger_day_master_element,
        sr.pillars as challenger_pillars
      FROM battles b
      JOIN users u ON b.challenger_id = u.id
      JOIN saju_reports sr ON b.challenger_report_id = sr.id
      WHERE b.share_code = ${shareCode.toUpperCase()}
    `

    if (!battle) {
      return res.status(404).json({ error: '대결을 찾을 수 없습니다' })
    }

    if (battle.status !== 'pending') {
      return res.status(400).json({ error: '이미 완료된 대결입니다' })
    }

    // 도전자의 일주 정보만 공개 (상세 스탯은 비공개)
    res.json({
      battleId: battle.id,
      status: battle.status,
      challenger: {
        nickname: battle.challenger_nickname,
        dayMaster: battle.challenger_day_master,
        dayMasterElement: battle.challenger_day_master_element,
        ilju: `${battle.challenger_pillars?.day?.heavenlyStem || ''}${battle.challenger_pillars?.day?.earthlyBranch || ''}`,
      },
      createdAt: battle.created_at,
    })
  } catch (error) {
    console.error('대결 조회 실패:', error)
    res.status(500).json({ error: '대결 조회 중 오류가 발생했습니다' })
  }
})

/**
 * POST /api/battle/join/:shareCode
 * 대결 참가 (상대방)
 */
router.post('/join/:shareCode', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다' })
    }

    const { shareCode } = req.params
    const { reportId } = req.body

    if (!reportId) {
      return res.status(400).json({ error: '사주 리포트 ID가 필요합니다' })
    }

    // 대결 조회
    const [battle] = await sql`
      SELECT
        b.id, b.status, b.challenger_id, b.challenger_report_id
      FROM battles b
      WHERE b.share_code = ${shareCode.toUpperCase()}
    `

    if (!battle) {
      return res.status(404).json({ error: '대결을 찾을 수 없습니다' })
    }

    if (battle.status !== 'pending') {
      return res.status(400).json({ error: '이미 완료된 대결입니다' })
    }

    // TODO: 프로덕션에서는 자기 대결 금지 활성화
    // if (battle.challenger_id === userId) {
    //   return res.status(400).json({ error: '자기 자신과는 대결할 수 없습니다' })
    // }

    // 상대방 리포트 확인
    const [opponentReport] = await sql`
      SELECT id, user_id, day_master, battle_stats
      FROM saju_reports WHERE id = ${reportId}
    `

    if (!opponentReport) {
      return res.status(404).json({ error: '리포트를 찾을 수 없습니다' })
    }

    // 본인의 리포트만 사용 가능 (자기 대결 테스트 시에도 본인 리포트 사용)
    if (opponentReport.user_id !== userId) {
      return res.status(403).json({ error: '본인의 리포트만 사용할 수 있습니다' })
    }

    // 같은 리포트로 대결하는 것은 불가
    if (opponentReport.id === battle.challenger_report_id) {
      return res.status(400).json({ error: '도전자와 다른 사주 정보로 대결해야 합니다' })
    }

    // 도전자 리포트 조회
    const [challengerReport] = await sql`
      SELECT day_master, battle_stats
      FROM saju_reports WHERE id = ${battle.challenger_report_id}
    `

    if (!challengerReport) {
      return res.status(500).json({ error: '도전자 리포트를 찾을 수 없습니다' })
    }

    // battle_stats 파싱 및 디버깅
    const challengerStats = parseJsonField(challengerReport.battle_stats)
    const opponentStats = parseJsonField(opponentReport.battle_stats)

    console.log('[BATTLE] 도전자 battle_stats:', JSON.stringify(challengerStats))
    console.log('[BATTLE] 상대방 battle_stats:', JSON.stringify(opponentStats))

    // battle_stats가 없거나 올바른 형식이 아닌 경우 체크
    if (!challengerStats || !opponentStats) {
      return res.status(500).json({ error: '사주 분석 데이터가 올바르지 않습니다' })
    }

    // 대결 결과 계산
    const battleResult = calculateBattleResult(
      challengerStats,
      opponentStats,
      challengerReport.day_master,
      opponentReport.day_master
    )

    // 승자 ID 결정
    let winnerId: string | null = null
    if (battleResult.winner === 'challenger') {
      winnerId = battle.challenger_id
    } else if (battleResult.winner === 'opponent') {
      winnerId = userId
    }

    // 대결 완료 업데이트
    await sql`
      UPDATE battles SET
        opponent_id = ${userId},
        opponent_report_id = ${reportId},
        status = 'completed',
        result = ${JSON.stringify(battleResult)},
        winner_id = ${winnerId},
        chemistry = ${JSON.stringify(battleResult.chemistry)},
        completed_at = NOW()
      WHERE id = ${battle.id}
    `

    res.json({
      battleId: battle.id,
      status: 'completed',
      result: battleResult,
    })
  } catch (error) {
    console.error('대결 참가 실패:', error)
    res.status(500).json({ error: '대결 참가 중 오류가 발생했습니다' })
  }
})

/**
 * GET /api/battle/:battleId/result
 * 대결 결과 조회 (참가자만)
 */
router.get('/:battleId/result', async (req, res) => {
  try {
    const userId = req.user?.id
    const { battleId } = req.params

    const [battle] = await sql`
      SELECT
        b.*,
        cu.nickname as challenger_nickname,
        ou.nickname as opponent_nickname,
        cr.day_master as challenger_day_master,
        cr.day_master_element as challenger_day_master_element,
        cr.pillars as challenger_pillars,
        cr.basic_analysis as challenger_basic,
        cr.battle_stats as challenger_stats,
        cr.detailed_report as challenger_report,
        orr.day_master as opponent_day_master,
        orr.day_master_element as opponent_day_master_element,
        orr.pillars as opponent_pillars,
        orr.basic_analysis as opponent_basic,
        orr.battle_stats as opponent_stats,
        orr.detailed_report as opponent_report
      FROM battles b
      JOIN users cu ON b.challenger_id = cu.id
      LEFT JOIN users ou ON b.opponent_id = ou.id
      JOIN saju_reports cr ON b.challenger_report_id = cr.id
      LEFT JOIN saju_reports orr ON b.opponent_report_id = orr.id
      WHERE b.id = ${battleId}
    `

    if (!battle) {
      return res.status(404).json({ error: '대결을 찾을 수 없습니다' })
    }

    // 참가자만 조회 가능
    const isParticipant = battle.challenger_id === userId || battle.opponent_id === userId
    if (!isParticipant) {
      return res.status(403).json({ error: '참가자만 결과를 볼 수 있습니다' })
    }

    if (battle.status !== 'completed') {
      return res.status(400).json({ error: '아직 완료되지 않은 대결입니다' })
    }

    // JSON 문자열을 객체로 파싱
    const parsedResult = parseJsonField<BattleResult>(battle.result)
    const parsedChemistry = parseJsonField(battle.chemistry)
    const challengerPillars = parseJsonField(battle.challenger_pillars)
    const opponentPillars = parseJsonField(battle.opponent_pillars)

    res.json({
      battleId: battle.id,
      status: battle.status,
      result: parsedResult,
      chemistry: parsedChemistry,
      winnerId: battle.winner_id,
      challenger: {
        id: battle.challenger_id,
        nickname: battle.challenger_nickname,
        dayMaster: battle.challenger_day_master,
        dayMasterElement: battle.challenger_day_master_element,
        ilju: `${challengerPillars?.day?.heavenlyStem || ''}${challengerPillars?.day?.earthlyBranch || ''}`,
        stats: parseJsonField(battle.challenger_stats),
        // 참가자에게만 상세 리포트 제공
        basic: parseJsonField(battle.challenger_basic),
        report: parseJsonField(battle.challenger_report),
      },
      opponent: {
        id: battle.opponent_id,
        nickname: battle.opponent_nickname,
        dayMaster: battle.opponent_day_master,
        dayMasterElement: battle.opponent_day_master_element,
        ilju: `${opponentPillars?.day?.heavenlyStem || ''}${opponentPillars?.day?.earthlyBranch || ''}`,
        stats: parseJsonField(battle.opponent_stats),
        basic: parseJsonField(battle.opponent_basic),
        report: parseJsonField(battle.opponent_report),
      },
      completedAt: battle.completed_at,
    })
  } catch (error) {
    console.error('대결 결과 조회 실패:', error)
    res.status(500).json({ error: '대결 결과 조회 중 오류가 발생했습니다' })
  }
})

/**
 * GET /api/battle/my-battles
 * 내 대결 목록
 */
router.get('/my-battles', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다' })
    }

    const battles = await sql`
      SELECT
        b.id, b.status, b.share_code, b.winner_id, b.created_at, b.completed_at,
        b.challenger_id, b.opponent_id,
        cu.nickname as challenger_nickname,
        ou.nickname as opponent_nickname,
        cr.day_master as challenger_day_master,
        orr.day_master as opponent_day_master,
        b.chemistry
      FROM battles b
      JOIN users cu ON b.challenger_id = cu.id
      LEFT JOIN users ou ON b.opponent_id = ou.id
      JOIN saju_reports cr ON b.challenger_report_id = cr.id
      LEFT JOIN saju_reports orr ON b.opponent_report_id = orr.id
      WHERE b.challenger_id = ${userId} OR b.opponent_id = ${userId}
      ORDER BY b.created_at DESC
      LIMIT 50
    `

    res.json({ battles })
  } catch (error) {
    console.error('대결 목록 조회 실패:', error)
    res.status(500).json({ error: '대결 목록 조회 중 오류가 발생했습니다' })
  }
})

export default router
