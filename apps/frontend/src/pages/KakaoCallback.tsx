import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../api/client'

export default function KakaoCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const isProcessing = useRef(false)

  useEffect(() => {
    // 이미 처리 중이면 중복 실행 방지
    if (isProcessing.current) return
    isProcessing.current = true

    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError('카카오 로그인이 취소되었습니다.')
      setTimeout(() => navigate('/login'), 2000)
      return
    }

    if (!code) {
      setError('인가 코드가 없습니다.')
      setTimeout(() => navigate('/login'), 2000)
      return
    }

    // 백엔드에 인가 코드 전송
    authApi.kakaoCallback(code)
      .then(({ token }) => {
        // AuthContext에 직접 토큰과 유저 설정
        localStorage.setItem('saju_battle_token', token)
        // 페이지 새로고침하여 AuthContext가 토큰을 읽도록 함
        window.location.href = '/'
      })
      .catch((err) => {
        console.error('Kakao login error:', err)
        setError(err.message || '카카오 로그인에 실패했습니다.')
        setTimeout(() => navigate('/login'), 2000)
      })
  }, [searchParams, navigate])

  return (
    <div className="kakao-callback-page">
      <div className="callback-container">
        {error ? (
          <>
            <div className="callback-icon error">❌</div>
            <p className="callback-message">{error}</p>
            <p className="callback-submessage">로그인 페이지로 이동합니다...</p>
          </>
        ) : (
          <>
            <div className="callback-spinner">🔄</div>
            <p className="callback-message">카카오 로그인 처리 중...</p>
          </>
        )}
      </div>
    </div>
  )
}
