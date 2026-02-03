import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type FortuneMenu = {
  id: string
  icon: string
  title: string
  description: string
  isNew?: boolean
  isHot?: boolean
}

const fortuneMenus: FortuneMenu[] = [
  {
    id: 'today',
    icon: '🌅',
    title: '오늘의 운세',
    description: '오늘 하루 나의 운세는?',
    isHot: true,
  },
  {
    id: 'battle',
    icon: '⚔️',
    title: '사주 대결',
    description: '친구와 운세 배틀!',
    isNew: true,
  },
  {
    id: 'compatibility',
    icon: '💕',
    title: '궁합 보기',
    description: '우리의 궁합 점수는?',
  },
  {
    id: 'saju',
    icon: '📜',
    title: '사주 분석',
    description: '나의 타고난 사주팔자',
  },
  {
    id: 'tarot',
    icon: '🃏',
    title: '타로 카드',
    description: '카드가 전하는 메시지',
    isNew: true,
  },
  {
    id: 'yearly',
    icon: '📅',
    title: '2026년 신년운세',
    description: '올해의 총운 확인',
    isHot: true,
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { user, logout, isLoading } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleMenuClick = (menuId: string) => {
    switch (menuId) {
      case 'today':
        // 사주 정보가 있으면 바로 운세, 없으면 입력 페이지로
        const savedInfo = localStorage.getItem('saju_birth_info')
        navigate(savedInfo ? '/fortune/today' : '/fortune/input')
        break
      case 'tarot':
        navigate('/tarot')
        break
      default:
        alert('준비 중인 서비스입니다.')
    }
  }

  // 로딩 중이면 로딩 표시
  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner">☯</div>
        <p>로딩 중...</p>
      </div>
    )
  }

  // 로그인 안 되어 있으면 로그인 페이지로
  if (!user) {
    navigate('/login')
    return null
  }

  return (
    <div className="home-page">
      {/* 헤더 */}
      <header className="home-header">
        <div className="header-left">
          <h1 className="header-logo">☯ 사주대결</h1>
        </div>
        <div className="header-right">
          <div className="rice-balance">
            <span className="rice-icon">🍚</span>
            <span className="rice-amount">{user.rice}</span>
          </div>
          <div className="user-menu-wrapper">
            <button
              className="icon-btn profile"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span>{user.isGuest ? '👤' : '😊'}</span>
            </button>
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-info">
                  <span className="user-nickname">{user.nickname}</span>
                  <span className="user-email">{user.isGuest ? '게스트' : user.email}</span>
                </div>
                <hr />
                <button onClick={handleLogout} className="logout-btn">
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 광고 배너 */}
      <section className="ad-banner">
        <img src="/banners/banner.png" alt="광고" className="ad-image" />
      </section>

      {/* 빠른 대결 배너 */}
      <section className="battle-banner">
        <div className="banner-content">
          <div className="banner-text">
            <span className="banner-badge">🔥 인기</span>
            <h3>친구와 운세 대결하기</h3>
            <p>링크를 공유하고 누가 더 운이 좋은지 겨뤄보세요!</p>
          </div>
          <button className="banner-btn">대결 시작</button>
        </div>
        <div className="banner-decoration">
          <span className="deco-icon left">⚔️</span>
          <span className="deco-icon right">🏆</span>
        </div>
      </section>

      {/* 메뉴 그리드 */}
      <section className="menu-section">
        <h2 className="section-title">운세 서비스</h2>
        <div className="menu-grid">
          {fortuneMenus.map((menu) => (
            <button
              key={menu.id}
              className="menu-card"
              onClick={() => handleMenuClick(menu.id)}
            >
              {menu.isNew && <span className="menu-badge new">NEW</span>}
              {menu.isHot && <span className="menu-badge hot">HOT</span>}
              <span className="menu-icon">{menu.icon}</span>
              <span className="menu-title">{menu.title}</span>
              <span className="menu-desc">{menu.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 하단 네비게이션 */}
      <nav className="bottom-nav">
        <button className="nav-item active">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">홈</span>
        </button>
        <button className="nav-item" onClick={() => alert('준비 중인 서비스입니다.')}>
          <span className="nav-icon">⚔️</span>
          <span className="nav-label">대결</span>
        </button>
        <button className="nav-item" onClick={() => navigate('/fortune/history')}>
          <span className="nav-icon">📊</span>
          <span className="nav-label">기록</span>
        </button>
        <button className="nav-item" onClick={() => alert('준비 중인 서비스입니다.')}>
          <span className="nav-icon">👤</span>
          <span className="nav-label">MY</span>
        </button>
      </nav>
    </div>
  )
}
