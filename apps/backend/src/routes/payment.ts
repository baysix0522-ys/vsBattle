import { Router, type Request, type Response } from 'express'
import { sql } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'
import { chargeRice } from './user.js'

const router = Router()

// ========================================
// 상품 정의
// ========================================
const PRODUCTS = [
  { id: 'rice_500', name: '쌀 500개', rice: 500, bonus: 0, price: 500 },
  { id: 'rice_1000', name: '쌀 1000개', rice: 1000, bonus: 0, price: 1000 },
  { id: 'rice_2000', name: '쌀 2000개', rice: 2000, bonus: 0, price: 2000 },
] as const

type ProductId = typeof PRODUCTS[number]['id']

// 카카오페이 API 설정
const KAKAOPAY_CID = process.env.KAKAOPAY_CID || 'TC0ONETIME'
const KAKAOPAY_SECRET_KEY = process.env.KAKAOPAY_SECRET_KEY || ''
const KAKAOPAY_API_BASE = 'https://open-api.kakaopay.com/online/v1/payment'

// 프론트엔드 URL (콜백용)
const getFrontendUrl = () => {
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'
  // CORS_ORIGIN이 여러 개인 경우 첫 번째 사용
  return corsOrigin.split(',')[0].trim().replace(/\/+$/, '')
}

// ========================================
// 상품 목록 조회
// ========================================
router.get('/products', (_req: Request, res: Response) => {
  res.json({ products: PRODUCTS })
})

// ========================================
// 결제 준비 (Ready)
// ========================================
router.post('/ready', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  const { productId } = req.body

  // 상품 검증
  const product = PRODUCTS.find(p => p.id === productId)
  if (!product) {
    return res.status(400).json({ error: '유효하지 않은 상품입니다' })
  }

  // 주문 ID 생성
  const orderId = `ORDER_${userId.slice(0, 8)}_${Date.now()}`

  try {
    // 카카오페이 Ready API 호출
    const frontendUrl = getFrontendUrl()
    const readyResponse = await fetch(`${KAKAOPAY_API_BASE}/ready`, {
      method: 'POST',
      headers: {
        'Authorization': `SECRET_KEY ${KAKAOPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cid: KAKAOPAY_CID,
        partner_order_id: orderId,
        partner_user_id: userId,
        item_name: product.name,
        quantity: 1,
        total_amount: product.price,
        vat_amount: Math.floor(product.price / 11), // 부가세 10%
        tax_free_amount: 0,
        approval_url: `${frontendUrl}/payment/callback?status=success&orderId=${orderId}`,
        cancel_url: `${frontendUrl}/payment/callback?status=cancel&orderId=${orderId}`,
        fail_url: `${frontendUrl}/payment/callback?status=fail&orderId=${orderId}`,
      }),
    })

    if (!readyResponse.ok) {
      const errorData = await readyResponse.json()
      console.error('카카오페이 Ready 실패:', errorData)
      return res.status(500).json({ error: '결제 준비 중 오류가 발생했습니다' })
    }

    const readyData = await readyResponse.json()
    const tid = readyData.tid
    const redirectUrl = readyData.next_redirect_pc_url

    // payments 테이블에 pending 상태로 저장
    const pgResponseData = {
      orderId,
      productId: product.id,
      productName: product.name,
      rice: product.rice,
      bonus: product.bonus,
      readyResponse: readyData,
    }
    await sql`
      INSERT INTO payments (user_id, amount, rice_amount, pg_provider, pg_tid, status, pg_response)
      VALUES (
        ${userId},
        ${product.price},
        ${product.rice + product.bonus},
        'kakaopay',
        ${tid},
        'pending',
        ${sql.json(pgResponseData)}
      )
    `

    res.json({
      tid,
      orderId,
      redirectUrl,
      product: {
        id: product.id,
        name: product.name,
        rice: product.rice,
        bonus: product.bonus,
        price: product.price,
      },
    })
  } catch (error) {
    console.error('결제 준비 실패:', error)
    res.status(500).json({ error: '결제 준비 중 오류가 발생했습니다' })
  }
})

// ========================================
// 결제 승인 (Approve)
// ========================================
router.post('/approve', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  const { pgToken, orderId } = req.body

  console.log('=== 결제 승인 요청 ===')
  console.log('userId:', userId)
  console.log('orderId:', orderId)
  console.log('pgToken:', pgToken)

  if (!pgToken || !orderId) {
    return res.status(400).json({ error: 'pg_token과 orderId가 필요합니다' })
  }

  try {
    // pending 상태의 결제 정보 조회
    const [payment] = await sql`
      SELECT id, pg_tid, rice_amount, pg_response
      FROM payments
      WHERE user_id = ${userId}
        AND status = 'pending'
        AND pg_response->>'orderId' = ${orderId}
      ORDER BY created_at DESC
      LIMIT 1
    `

    console.log('조회된 payment:', payment)

    if (!payment) {
      // 디버깅: 해당 유저의 모든 pending 결제 조회
      const allPending = await sql`
        SELECT id, pg_response->>'orderId' as order_id, status
        FROM payments
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 5
      `
      console.log('유저의 최근 결제 목록:', allPending)
      return res.status(404).json({ error: '결제 정보를 찾을 수 없습니다' })
    }

    const tid = payment.pg_tid

    // 카카오페이 Approve API 호출
    const approveResponse = await fetch(`${KAKAOPAY_API_BASE}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `SECRET_KEY ${KAKAOPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cid: KAKAOPAY_CID,
        tid,
        partner_order_id: orderId,
        partner_user_id: userId,
        pg_token: pgToken,
      }),
    })

    if (!approveResponse.ok) {
      const errorData = await approveResponse.json()
      console.error('카카오페이 Approve 실패:', errorData)

      // 결제 실패 처리
      await sql`
        UPDATE payments
        SET status = 'failed',
            pg_response = pg_response || ${JSON.stringify({ approveError: errorData })}::jsonb
        WHERE id = ${payment.id}
      `

      return res.status(500).json({ error: '결제 승인에 실패했습니다' })
    }

    const approveData = await approveResponse.json()
    const riceAmount = payment.rice_amount

    // 결제 상태 업데이트
    await sql`
      UPDATE payments
      SET status = 'completed',
          completed_at = NOW(),
          pg_response = pg_response || ${JSON.stringify({ approveResponse: approveData })}::jsonb
      WHERE id = ${payment.id}
    `

    // 쌀 충전
    const chargeResult = await chargeRice(
      userId,
      riceAmount,
      `카카오페이 결제 (${payment.pg_response?.productName || '쌀 충전'})`,
      'payment',
      payment.id
    )

    if (!chargeResult.success) {
      console.error('쌀 충전 실패:', chargeResult.error)
      return res.status(500).json({ error: '쌀 충전에 실패했습니다' })
    }

    res.json({
      success: true,
      riceAmount,
      newBalance: chargeResult.balance,
      paymentId: payment.id,
    })
  } catch (error) {
    console.error('결제 승인 처리 실패:', error)
    res.status(500).json({ error: '결제 승인 처리 중 오류가 발생했습니다' })
  }
})

// ========================================
// 결제 내역 조회
// ========================================
router.get('/history', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id
  const page = Math.max(1, Number(req.query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20))
  const offset = (page - 1) * limit

  try {
    const [countResult] = await sql`
      SELECT COUNT(*) as total FROM payments
      WHERE user_id = ${userId} AND status = 'completed'
    `

    const payments = await sql`
      SELECT id, amount, rice_amount, pg_provider, status, created_at, completed_at,
             pg_response->>'productName' as product_name
      FROM payments
      WHERE user_id = ${userId} AND status = 'completed'
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    res.json({
      total: Number(countResult?.total) || 0,
      page,
      limit,
      payments: payments.map(p => ({
        id: p.id,
        amount: p.amount,
        riceAmount: p.rice_amount,
        provider: p.pg_provider,
        productName: p.product_name,
        status: p.status,
        createdAt: p.created_at,
        completedAt: p.completed_at,
      })),
    })
  } catch (error) {
    console.error('결제 내역 조회 실패:', error)
    res.status(500).json({ error: '결제 내역을 불러올 수 없습니다' })
  }
})

export default router
