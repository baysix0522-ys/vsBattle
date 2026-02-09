import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fortuneApi, statsApi } from '../api/client'

type FortuneMenu = {
  id: string
  icon: string
  title: string
  description: string
  isNew?: boolean
  isHot?: boolean
  isDisplay?: boolean
  isAd?: boolean
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
    id: 'name',
    icon: '✍️',
    title: '이름 풀이',
    description: '내 이름의 숨겨진 의미',
    isNew: true,
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
    id: 'tennis-tarot',
    icon: '🎾',
    title: '테니스 타로',
    description: '오늘의 테니스 운세',
    isNew: true,
  },
  {
    id: 'yearly',
    icon: '📅',
    title: '2026년 신년운세',
    description: '올해의 총운 확인',
    isHot: true,
  },
  {
    id: 'visitors',
    icon: '👥',
    title: '오늘의 참여자',
    description: '',
    isDisplay: true,
  },
  {
    id: 'ad',
    icon: '',
    title: '',
    description: '',
    isAd: true,
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { user, token, logout, isLoading } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [visitorCount, setVisitorCount] = useState<number>(0)

  // 방문자 수 조회 및 방문 기록
  useEffect(() => {
    const recordVisitAndFetch = async () => {
      // 세션당 한 번만 방문 기록 (새로고침 시 중복 방지)
      const visitedKey = 'saju_visited_today'
      const today = new Date().toDateString()
      const lastVisit = sessionStorage.getItem(visitedKey)

      if (lastVisit !== today) {
        await statsApi.recordVisit().catch(() => {})
        sessionStorage.setItem(visitedKey, today)
      }

      // 방문자 수 조회
      try {
        const result = await statsApi.getTodayVisitors()
        setVisitorCount(result.count)
      } catch {
        setVisitorCount(0)
      }
    }

    recordVisitAndFetch()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleMenuClick = async (menuId: string) => {
    switch (menuId) {
      case 'today':
        // 오늘 기록이 있으면 운세 페이지, 없으면 입력 페이지로
        if (token && user && !user.isGuest) {
          try {
            const todayRecord = await fortuneApi.getTodayRecord(token)
            if (todayRecord.record) {
              // 오늘 기록이 있으면 운세 페이지로
              navigate('/fortune/today')
            } else {
              // 오늘 기록이 없으면 입력 페이지로
              navigate('/fortune/input')
            }
          } catch {
            navigate('/fortune/input')
          }
        } else {
          // 게스트는 항상 입력 페이지로
          navigate('/fortune/input')
        }
        break
      case 'battle':
        navigate('/battle')
        break
      case 'tarot':
        navigate('/tarot')
        break
      case 'tennis-tarot':
        navigate('/tennis-tarot')
        break
      case 'name':
        navigate('/name')
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
                <button onClick={() => { setShowUserMenu(false); navigate('/mypage') }} className="mypage-btn">
                  마이페이지
                </button>
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
        <img src="/banners/banner02.png" alt="광고" className="ad-image" />
      </section>

      {/* 빠른 대결 배너 */}
      <section className="battle-banner">
        <div className="banner-content">
          <div className="banner-text">
            <span className="banner-badge">🔥 인기</span>
            <h3>친구와 운세 대결하기</h3>
            <p>링크를 공유하고 누가 더 운이 좋은지 겨뤄보세요!</p>
          </div>
          <button className="banner-btn" onClick={() => navigate('/battle')}>대결 시작</button>
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
          {fortuneMenus.map((menu) => {
            // 오늘의 참여자 (실시간 카운터 스타일)
            if (menu.isDisplay) {
              return (
                <div key={menu.id} className="menu-card display-card">
                  <div className="live-indicator">
                    <span className="live-dot" />
                    <span>LIVE</span>
                  </div>
                  <span className="visitor-count">{visitorCount.toLocaleString()}</span>
                  <span className="visitor-label">오늘의 참여자</span>
                </div>
              )
            }
            // 광고 배너
            if (menu.isAd) {
              return (
                <div key={menu.id} className="menu-card ad-card">
                  <img src="/banners/banner02.png" alt="광고" className="ad-thumbnail" />
                </div>
              )
            }
            // 일반 메뉴
            return (
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
            )
          })}
        </div>
      </section>

    </div>
  )
}
