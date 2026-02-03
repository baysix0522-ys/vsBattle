import bcrypt from 'bcryptjs'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { userStore } from '../store/userStore.js'
import type { AuthPayload } from '../types/user.js'
import { toPublicUser } from '../types/user.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'saju-battle-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, nickname } = req.body

    if (!email || !password || !nickname) {
      res.status(400).json({ error: '이메일, 비밀번호, 닉네임을 모두 입력해주세요.' })
      return
    }

    // 이메일 중복 체크
    const existing = await userStore.findByEmail(email)
    if (existing) {
      res.status(409).json({ error: '이미 사용 중인 이메일입니다.' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await userStore.create({
      email,
      passwordHash,
      nickname,
      isGuest: false,
      rice: 100, // 신규 가입 보너스
    })

    const token = generateToken({ userId: user.id, isGuest: false })

    res.status(201).json({
      message: '회원가입 성공! 100쌀이 지급되었습니다.',
      token,
      user: toPublicUser(user),
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' })
  }
})

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' })
      return
    }

    const user = await userStore.findByEmail(email)
    if (!user) {
      res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' })
      return
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' })
      return
    }

    const token = generateToken({ userId: user.id, isGuest: false })

    res.json({
      message: '로그인 성공!',
      token,
      user: toPublicUser(user),
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' })
  }
})

// 게스트 로그인
router.post('/guest', async (_req, res) => {
  try {
    const guestNumber = Math.floor(Math.random() * 10000)

    const user = await userStore.create({
      email: '',
      passwordHash: '',
      nickname: `게스트${guestNumber}`,
      isGuest: true,
      rice: 10, // 게스트는 적은 쌀
    })

    const token = generateToken({ userId: user.id, isGuest: true })

    res.json({
      message: '게스트로 접속했습니다. 10쌀이 지급되었습니다.',
      token,
      user: toPublicUser(user),
    })
  } catch (error) {
    console.error('Guest login error:', error)
    res.status(500).json({ error: '게스트 로그인 중 오류가 발생했습니다.' })
  }
})

// 토큰 검증 & 내 정보
router.get('/me', async (req, res) => {
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

    res.json({ user: toPublicUser(user) })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: '유효하지 않은 토큰입니다.' })
      return
    }
    console.error('Me error:', error)
    res.status(500).json({ error: '오류가 발생했습니다.' })
  }
})

export default router
