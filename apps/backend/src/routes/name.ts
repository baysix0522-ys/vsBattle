import { Router, type Request, type Response } from 'express'
import { sql } from '../db/index.js'
import { optionalAuth, requireAuth } from '../middleware/auth.js'
import { userStore } from '../store/userStore.js'
import { suggestHanja, analyzeName, type SelectedHanja, type NameAnalysisResult } from '../services/nameAnalysis.js'

const NAME_ANALYSIS_COST = 50

const router = Router()

// ========================================
// 한자 후보 제안
// ========================================
router.post('/suggest-hanja', optionalAuth, async (req: Request, res: Response) => {
  const { koreanName } = req.body

  if (!koreanName || typeof koreanName !== 'string') {
    return res.status(400).json({ error: '한글 이름을 입력해주세요' })
  }

  const trimmed = koreanName.trim()
  if (trimmed.length < 1 || trimmed.length > 5) {
    return res.status(400).json({ error: '이름은 1~5글자 사이여야 합니다' })
  }

  // 한글만 허용
  if (!/^[가-힣]+$/.test(trimmed)) {
    return res.status(400).json({ error: '한글만 입력 가능합니다' })
  }

  try {
    const suggestions = await suggestHanja(trimmed)
    res.json({ success: true, suggestions })
  } catch (error) {
    console.error('한자 후보 제안 실패:', error)
    res.status(500).json({ error: '한자 후보를 가져올 수 없습니다' })
  }
})

// ========================================
// 이름 분석
// ========================================
router.post('/analyze', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  const { surname, surnameHanja, koreanName, selectedHanja } = req.body as {
    surname: string
    surnameHanja: string
    koreanName: string
    selectedHanja: SelectedHanja[]
  }

  // 유효성 검사
  if (!surname || !surnameHanja || !koreanName || !selectedHanja) {
    return res.status(400).json({ error: '필수 정보가 누락되었습니다' })
  }

  if (!Array.isArray(selectedHanja) || selectedHanja.length === 0) {
    return res.status(400).json({ error: '한자를 선택해주세요' })
  }

  // 한글만 허용
  if (!/^[가-힣]+$/.test(surname) || !/^[가-힣]+$/.test(koreanName)) {
    return res.status(400).json({ error: '성과 이름은 한글만 입력 가능합니다' })
  }

  const hanjaString = selectedHanja.map(h => h.hanja).join('')

  try {
    // 캐시 확인 (동일한 이름+한자 조합)
    const [existing] = await sql`
      SELECT id, analysis_result, overall_score, overall_grade, created_at
      FROM name_analysis_records
      WHERE korean_name = ${koreanName}
        AND surname = ${surname}
        AND selected_hanja = ${hanjaString}
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (existing) {
      const cachedResult = existing.analysis_result as NameAnalysisResult
      // 새 필드(ogyeokScores.formula, shareable)가 있는지 확인 - 없으면 재분석
      const hasNewFields = cachedResult?.ogyeokScores?.천격?.formula && cachedResult?.shareable?.nickname
      if (hasNewFields) {
        console.log('[NAME] 캐시 히트:', surname + koreanName, hanjaString)
        return res.json({
          success: true,
          recordId: existing.id,
          isExisting: true,
          result: cachedResult,
        })
      }
      console.log('[NAME] 캐시 무효 (새 필드 없음), 재분석:', surname + koreanName, hanjaString)
    }

    // 쌀 체크
    const user = await userStore.findById(userId)
    if (!user || user.rice < NAME_ANALYSIS_COST) {
      return res.status(402).json({
        error: '쌀이 부족합니다.',
        required: NAME_ANALYSIS_COST,
        current: user?.rice || 0,
      })
    }

    // 새로 분석
    const result = await analyzeName(surname, surnameHanja, koreanName, selectedHanja)

    // 쌀 차감
    const newBalance = user.rice - NAME_ANALYSIS_COST
    await userStore.update(userId, { rice: newBalance })

    // 쌀 거래 기록
    await sql`
      INSERT INTO rice_transactions (user_id, type, amount, balance_after, description, reference_type)
      VALUES (${userId}, 'use', ${-NAME_ANALYSIS_COST}, ${newBalance}, '이름 풀이', 'name_analysis')
    `

    // DB에 저장
    const [record] = await sql`
      INSERT INTO name_analysis_records (
        user_id, korean_name, surname, surname_hanja, selected_hanja,
        analysis_result, overall_score, overall_grade
      ) VALUES (
        ${userId}, ${koreanName}, ${surname}, ${surnameHanja}, ${hanjaString},
        ${JSON.stringify(result)}, ${result.overallScore}, ${result.overallGrade}
      )
      RETURNING id
    `

    res.json({
      success: true,
      recordId: record?.id ?? '',
      isExisting: false,
      result,
      riceUsed: NAME_ANALYSIS_COST,
      riceRemaining: newBalance,
    })
  } catch (error) {
    console.error('이름 분석 실패:', error)
    res.status(500).json({ error: '이름 분석에 실패했습니다' })
  }
})

// ========================================
// 분석 기록 조회 (단일)
// ========================================
router.get('/record/:id', optionalAuth, async (req: Request, res: Response) => {
  const id = req.params.id as string

  try {
    const [record] = await sql`
      SELECT id, korean_name, surname, surname_hanja, selected_hanja,
             analysis_result, overall_score, overall_grade, created_at
      FROM name_analysis_records
      WHERE id = ${id}
    `

    if (!record) {
      return res.status(404).json({ error: '분석 기록을 찾을 수 없습니다' })
    }

    res.json({
      id: record.id,
      koreanName: record.korean_name,
      surname: record.surname,
      surnameHanja: record.surname_hanja,
      selectedHanja: record.selected_hanja,
      result: record.analysis_result as NameAnalysisResult,
      overallScore: record.overall_score,
      overallGrade: record.overall_grade,
      createdAt: record.created_at,
    })
  } catch (error) {
    console.error('분석 기록 조회 실패:', error)
    res.status(500).json({ error: '분석 기록을 불러올 수 없습니다' })
  }
})

// ========================================
// 내 분석 히스토리
// ========================================
router.get('/history', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
  const offset = (page - 1) * limit

  try {
    const [countResult] = await sql`
      SELECT COUNT(*) as total FROM name_analysis_records WHERE user_id = ${userId}
    `

    const records = await sql`
      SELECT id, korean_name, surname, surname_hanja, selected_hanja,
             overall_score, overall_grade, created_at
      FROM name_analysis_records
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    res.json({
      total: Number(countResult?.total) || 0,
      page,
      limit,
      records: records.map(r => ({
        id: r.id,
        fullName: r.surname + r.korean_name,
        koreanName: r.korean_name,
        surname: r.surname,
        surnameHanja: r.surname_hanja,
        selectedHanja: r.selected_hanja,
        overallScore: r.overall_score,
        overallGrade: r.overall_grade,
        createdAt: r.created_at,
      })),
    })
  } catch (error) {
    console.error('이름 분석 히스토리 조회 실패:', error)
    res.status(500).json({ error: '히스토리를 불러올 수 없습니다' })
  }
})

export default router
