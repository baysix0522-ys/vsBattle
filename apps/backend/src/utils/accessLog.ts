import { sql } from '../db/index.js'
import type { Request } from 'express'

export type AccessType = 'login' | 'guest' | 'visit' | 'logout'

type AccessLogData = {
  userId?: string | null
  sessionId?: string
  accessType: AccessType
  provider?: string
  req: Request
}

// User-Agent 파싱 (간단 버전)
function parseUserAgent(ua: string | undefined) {
  if (!ua) return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' }

  // 디바이스 타입
  let deviceType = 'desktop'
  if (/mobile/i.test(ua)) deviceType = 'mobile'
  else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet'

  // 브라우저
  let browser = 'unknown'
  if (/chrome/i.test(ua) && !/edge|edg/i.test(ua)) browser = 'Chrome'
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari'
  else if (/firefox/i.test(ua)) browser = 'Firefox'
  else if (/edge|edg/i.test(ua)) browser = 'Edge'
  else if (/msie|trident/i.test(ua)) browser = 'IE'
  else if (/samsung/i.test(ua)) browser = 'Samsung'
  else if (/kakao/i.test(ua)) browser = 'KakaoTalk'

  // OS
  let os = 'unknown'
  if (/windows/i.test(ua)) os = 'Windows'
  else if (/macintosh|mac os/i.test(ua)) os = 'macOS'
  else if (/android/i.test(ua)) os = 'Android'
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS'
  else if (/linux/i.test(ua)) os = 'Linux'

  return { deviceType, browser, os }
}

// IP 주소 가져오기
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    const forwardedStr = typeof forwarded === 'string' ? forwarded : forwarded[0] || ''
    const ips = forwardedStr.split(',')
    return ips[0]?.trim() || 'unknown'
  }
  return req.socket.remoteAddress || 'unknown'
}

// 접속 로그 기록
export async function logAccess(data: AccessLogData): Promise<void> {
  try {
    const { userId, sessionId, accessType, provider, req } = data
    const userAgent = req.headers['user-agent']
    const { deviceType, browser, os } = parseUserAgent(userAgent)
    const ipAddress = getClientIp(req)
    const referer = req.headers.referer || req.headers.referrer || null

    await sql`
      INSERT INTO access_logs (
        user_id, session_id, access_type, provider,
        ip_address, user_agent, device_type, browser, os, referer
      ) VALUES (
        ${userId || null},
        ${sessionId || null},
        ${accessType},
        ${provider || null},
        ${ipAddress},
        ${userAgent || null},
        ${deviceType},
        ${browser},
        ${os},
        ${referer}
      )
    `
  } catch (error) {
    console.error('접속 로그 기록 실패:', error)
    // 로그 실패해도 메인 로직에 영향 주지 않음
  }
}

// 접속 로그 조회 (관리자용)
export async function getAccessLogs(options: {
  page?: number
  limit?: number
  accessType?: AccessType
  userId?: string
  startDate?: Date
  endDate?: Date
}) {
  const { page = 1, limit = 50, accessType, userId, startDate, endDate } = options
  const offset = (page - 1) * limit

  // 동적 WHERE 절 구성
  const conditions: string[] = []
  if (accessType) conditions.push(`access_type = '${accessType}'`)
  if (userId) conditions.push(`user_id = '${userId}'`)
  if (startDate) conditions.push(`created_at >= '${startDate.toISOString()}'`)
  if (endDate) conditions.push(`created_at <= '${endDate.toISOString()}'`)

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const [countResult] = await sql.unsafe(`
    SELECT COUNT(*) as total FROM access_logs ${whereClause}
  `)

  const logs = await sql.unsafe(`
    SELECT
      al.*,
      u.nickname,
      u.email
    FROM access_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `)

  return {
    total: Number(countResult?.total) || 0,
    page,
    limit,
    logs,
  }
}
