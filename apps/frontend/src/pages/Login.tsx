import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, authApi } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import SEO from '../components/SEO'

type FormMode = 'login' | 'register'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const { login, register, guestLogin } = useAuth()

  const [mode, setMode] = useState<FormMode>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, nickname)
      }
      navigate(redirectTo)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('오류가 발생했습니다. 다시 시도해주세요.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKakaoLogin = async () => {
    setError(null)
    setIsLoading(true)

    try {
      if (redirectTo !== '/') {
        sessionStorage.setItem('login_redirect', redirectTo)
      }
      const { url } = await authApi.getKakaoLoginUrl()
      window.location.href = url
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('카카오 로그인 준비에 실패했습니다.')
      }
      setIsLoading(false)
    }
  }

  const handleNaverLogin = () => {
    alert('네이버 로그인은 준비 중입니다.')
  }

  const handleGuestLogin = async () => {
    setError(null)
    setIsLoading(true)

    try {
      await guestLogin()
      navigate(redirectTo)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('게스트 로그인에 실패했습니다.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      <SEO title="로그인" description="사주대결에 로그인하고 다양한 운세 서비스를 이용해보세요." path="/login" />
      <div className="login-container">
        {/* 로고 영역 */}
        <div className="login-hero">
          <div className="logo-icon">
            <span className="icon-yin">☯</span>
          </div>
          <h1 className="logo-text">사주대결</h1>
          <p className="tagline">나의 운명, 누구와 겨뤄볼까?</p>
        </div>

        {/* 설명 영역 */}
        <div className="login-features">
          <div className="feature-item">
            <span className="feature-icon">🔮</span>
            <span>AI 사주 분석</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚔️</span>
            <span>친구와 운세 대결</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💕</span>
            <span>궁합 확인</span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && <div className="error-message">{error}</div>}

        {/* 이메일 로그인 폼 */}
        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="login-input"
              required
              disabled={isLoading}
            />
          )}
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
            disabled={isLoading}
            minLength={4}
          />
          <button type="submit" className="login-btn primary" disabled={isLoading}>
            {isLoading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>

        <button
          className="mode-toggle"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setError(null)
          }}
          disabled={isLoading}
        >
          {mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
        </button>

        <div className="divider">
          <span>또는</span>
        </div>

        {/* 소셜 로그인 */}
        <div className="login-buttons">
          <button
            className="login-btn kakao"
            onClick={handleKakaoLogin}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" className="btn-icon">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.82 5.32 4.56 6.74l-1.17 4.36c-.1.37.26.67.6.5l5.02-2.92c.32.02.64.04.99.04 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
            </svg>
            카카오로 시작하기
          </button>

          <button
            className="login-btn naver"
            onClick={handleNaverLogin}
            disabled={isLoading}
          >
            <span className="btn-icon naver-icon">N</span>
            네이버로 시작하기
          </button>

          <button className="login-btn guest" onClick={handleGuestLogin} disabled={isLoading}>
            게스트로 둘러보기
          </button>
        </div>

        {/* 하단 안내 */}
        <p className="login-notice">
          로그인 시 <a href="#">이용약관</a> 및 <a href="#">개인정보처리방침</a>에 동의합니다.
        </p>
      </div>
    </div>
  )
}
