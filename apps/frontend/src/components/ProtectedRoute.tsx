import { Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../contexts/AuthContext'

type Props = {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const { token, isLoading } = useAuth()

  // 인증 상태 로딩 중이면 로딩 화면 표시
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '16px',
      }}>
        <Spin size="large" />
        <p style={{ color: '#888' }}>인증 확인 중...</p>
      </div>
    )
  }

  // 로그인 안 됐으면 로그인 페이지로 리다이렉트
  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
