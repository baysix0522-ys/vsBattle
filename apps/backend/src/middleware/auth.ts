import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { userStore } from '../store/userStore.js'
import type { AuthPayload, User } from '../types/user.js'

const JWT_SECRET = process.env.JWT_SECRET || 'saju-battle-secret-key-change-in-production'

// Request에 user 추가
declare global {
  namespace Express {
    interface Request {
      user?: User
      authPayload?: AuthPayload
    }
  }
}

// 인증 필수 미들웨어
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: '인증이 필요합니다.' })
      return
    }

    const token = authHeader.slice(7)
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload

    const user = await userStore.findById(payload.userId)
    if (!user) {
      res.status(401).json({ error: '사용자를 찾을 수 없습니다.' })
      return
    }

    req.user = user
    req.authPayload = payload
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: '유효하지 않은 토큰입니다.' })
      return
    }
    res.status(500).json({ error: '인증 중 오류가 발생했습니다.' })
  }
}

// 회원만 (게스트 불가)
export async function requireMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: '인증이 필요합니다.' })
      return
    }

    const token = authHeader.slice(7)
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload

    const user = await userStore.findById(payload.userId)
    if (!user) {
      res.status(401).json({ error: '사용자를 찾을 수 없습니다.' })
      return
    }

    if (user.isGuest) {
      res.status(403).json({ error: '회원 전용 기능입니다. 로그인해주세요.' })
      return
    }

    req.user = user
    req.authPayload = payload
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: '유효하지 않은 토큰입니다.' })
      return
    }
    res.status(500).json({ error: '인증 중 오류가 발생했습니다.' })
  }
}

// 인증 선택적 (있으면 파싱, 없어도 통과)
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      next()
      return
    }

    const token = authHeader.slice(7)
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload

    const user = await userStore.findById(payload.userId)
    if (user) {
      req.user = user
      req.authPayload = payload
    }

    next()
  } catch {
    // 토큰이 유효하지 않아도 통과 (선택적이므로)
    next()
  }
}
