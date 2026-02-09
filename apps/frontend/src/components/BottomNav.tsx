import { useNavigate, useLocation } from 'react-router-dom'

type NavItem = {
  path: string
  icon: string
  label: string
  matchPaths?: string[] // 이 경로들도 active로 처리
}

const navItems: NavItem[] = [
  {
    path: '/',
    icon: '🏠',
    label: '홈'
  },
  {
    path: '/battle',
    icon: '⚔️',
    label: '대결',
    matchPaths: ['/battle', '/battle/report', '/battle/join', '/battle/result']
  },
  {
    path: '/fortune/history',
    icon: '📊',
    label: '기록',
    matchPaths: ['/fortune/history', '/fortune/record']
  },
  {
    path: '/mypage',
    icon: '👤',
    label: 'MY'
  },
]

// 네비게이션 바를 숨길 페이지들
const HIDDEN_PATHS = ['/login', '/auth/kakao/callback']

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  // 특정 페이지에서는 네비게이션 바 숨김
  if (HIDDEN_PATHS.some(p => location.pathname.startsWith(p))) {
    return null
  }

  const isActive = (item: NavItem) => {
    if (location.pathname === item.path) return true
    if (item.matchPaths) {
      return item.matchPaths.some(p => location.pathname.startsWith(p))
    }
    return false
  }

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${isActive(item) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
