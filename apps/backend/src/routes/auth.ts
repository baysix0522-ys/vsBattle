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
      provider: 'local',
      providerId: null,
      profileImage: null,
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
      provider: 'local',
      providerId: null,
      profileImage: null,
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

// ============ 카카오 OAuth ============

const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || ''
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || ''
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI || 'http://localhost:5173/auth/kakao/callback'

// 카카오 로그인 URL 반환
router.get('/kakao', (_req, res) => {
  const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}&response_type=code`
  res.json({ url: kakaoAuthUrl })
})

// 카카오 콜백 처리
router.post('/kakao/callback', async (req, res) => {
  try {
    const { code } = req.body

    if (!code) {
      res.status(400).json({ error: '인가 코드가 필요합니다.' })
      return
    }

    if (!KAKAO_REST_API_KEY) {
      res.status(500).json({ error: '카카오 API 키가 설정되지 않았습니다.' })
      return
    }

    // 1. 인가 코드로 액세스 토큰 요청
    const tokenParams: Record<string, string> = {
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: KAKAO_REDIRECT_URI,
      code,
    }

    // Client Secret이 설정되어 있으면 추가
    if (KAKAO_CLIENT_SECRET) {
      tokenParams.client_secret = KAKAO_CLIENT_SECRET
    }

    const tokenResponse = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body: new URLSearchParams(tokenParams),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Kakao token error:', errorData)
      res.status(401).json({ error: '카카오 인증에 실패했습니다.' })
      return
    }

    const tokenData = await tokenResponse.json() as { access_token: string }

    // 2. 액세스 토큰으로 사용자 정보 요청
    const userResponse = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    })

    if (!userResponse.ok) {
      res.status(401).json({ error: '카카오 사용자 정보를 가져올 수 없습니다.' })
      return
    }

    const kakaoUser = await userResponse.json() as {
      id: number
      kakao_account?: {
        email?: string
        profile?: {
          nickname?: string
          profile_image_url?: string
        }
      }
    }

    const kakaoId = String(kakaoUser.id)
    const nickname = kakaoUser.kakao_account?.profile?.nickname || `카카오${kakaoUser.id}`
    const email = kakaoUser.kakao_account?.email || ''
    const profileImage = kakaoUser.kakao_account?.profile?.profile_image_url || ''

    // 3. 기존 사용자 조회 또는 신규 생성
    let user = await userStore.findByProvider('kakao', kakaoId)

    if (!user) {
      // 신규 사용자 생성
      user = await userStore.createSocial({
        provider: 'kakao',
        providerId: kakaoId,
        nickname,
        email,
        profileImage,
      })
    } else {
      // 기존 사용자 프로필 업데이트 (선택적)
      if (profileImage && profileImage !== user.profileImage) {
        await userStore.update(user.id, { profileImage })
        user.profileImage = profileImage
      }
    }

    // 4. JWT 토큰 발급
    const token = generateToken({ userId: user.id, isGuest: false })

    res.json({
      message: '카카오 로그인 성공!',
      token,
      user: toPublicUser(user),
    })
  } catch (error) {
    console.error('Kakao callback error:', error)
    res.status(500).json({ error: '카카오 로그인 중 오류가 발생했습니다.' })
  }
})

// ============ 일반 인증 ============

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
