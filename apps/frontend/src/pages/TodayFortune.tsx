import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculateTodayFortune, type FortuneResult } from '../utils/fortune'
import { useAuth } from '../contexts/AuthContext'
import { fortuneApi } from '../api/client'
import type { BirthInfo } from '../utils/saju'

type StoredBirthInfo = BirthInfo & {
  gender: 'male' | 'female'
  hourKnown: boolean
}

export default function TodayFortune() {
  const navigate = useNavigate()
  const { user, token, updateRice } = useAuth()
  const [fortune, setFortune] = useState<FortuneResult | null>(null)
  const [birthInfo, setBirthInfo] = useState<StoredBirthInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [riceReward, setRiceReward] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem('saju_birth_info')
    if (!stored) {
      navigate('/fortune/input')
      return
    }

    const loadFortune = async () => {
      try {
        const info = JSON.parse(stored) as StoredBirthInfo
        setBirthInfo(info)
        const result = calculateTodayFortune(info)
        setFortune(result)

        // 로그인 사용자(비게스트)만 기록 저장
        if (token && user && !user.isGuest) {
          // 먼저 오늘 기록이 있는지 확인
          const todayRecord = await fortuneApi.getTodayRecord(token)

          if (todayRecord.record) {
            // 이미 오늘 기록이 있으면 저장 안 함
            setSaved(true)
          } else {
            // 오늘 첫 방문이면 저장
            const res = await fortuneApi.saveRecord(token, info, result)
            setSaved(true)
            if (res.riceReward > 0) {
              setRiceReward(res.riceReward)
              updateRice(res.totalRice)
            }
          }
        }
      } catch (err) {
        console.error('운세 로드 실패:', err)
        navigate('/fortune/input')
      } finally {
        setLoading(false)
      }
    }

    loadFortune()
  }, [navigate, token, user, updateRice])

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loading-spinner">☯</div>
        <p>운세를 분석 중...</p>
      </div>
    )
  }

  if (!fortune || !birthInfo) return null

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      love: '💕',
      money: '💰',
      health: '💪',
      work: '💼',
    }
    return icons[category] || '✨'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      love: '연애운',
      money: '금전운',
      health: '건강운',
      work: '직장운',
    }
    return labels[category] || category
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'score-excellent'
    if (score >= 60) return 'score-good'
    if (score >= 40) return 'score-normal'
    return 'score-low'
  }

  const getGradeEmoji = (grade: string) => {
    const emojis: Record<string, string> = {
      대길: '🌟',
      길: '✨',
      중길: '☀️',
      소길: '🌤️',
      평: '☁️',
    }
    return emojis[grade] || '☀️'
  }

  return (
    <div className="today-fortune-page">
      <div className="fortune-container">
        {/* 헤더 */}
        <header className="fortune-header">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <h1>오늘의 운세</h1>
          <button className="share-btn">📤</button>
        </header>

        {/* 날짜 */}
        <div className="fortune-date">
          <span>{fortune.date}</span>
        </div>

        {/* 게스트 안내 배너 */}
        {user?.isGuest && (
          <div className="guest-notice">
            <span className="notice-icon">💡</span>
            <p>게스트는 운세 기록이 저장되지 않아요.<br />회원가입하면 기록을 저장할 수 있어요!</p>
            <button onClick={() => navigate('/login')} className="notice-btn">
              회원가입
            </button>
          </div>
        )}

        {/* 저장 완료 표시 */}
        {saved && (
          <div className="saved-notice">
            <span>✅ 오늘의 운세가 기록되었습니다</span>
          </div>
        )}

        {/* 쌀 리워드 표시 */}
        {riceReward > 0 && (
          <div className="reward-notice">
            <span className="reward-icon">🍚</span>
            <span>오늘의 운세 확인 보상으로 쌀 {riceReward}개를 받았어요!</span>
          </div>
        )}

        {/* 메인 점수 카드 */}
        <div className="main-score-card">
          <div className="saju-info">
            <span className="day-master-badge">
              일간 {fortune.dayMaster} ({fortune.dayMasterElement})
            </span>
            <span className="today-energy">
              오늘의 기운: {fortune.todayElement}
            </span>
          </div>

          <div className={`score-circle ${getScoreColor(fortune.overall.score)}`}>
            <span className="score-number">{fortune.overall.score}</span>
            <span className="score-label">점</span>
          </div>

          <div className="grade-badge">
            <span className="grade-emoji">{getGradeEmoji(fortune.overall.grade)}</span>
            <span className="grade-text">{fortune.overall.grade}</span>
          </div>

          <p className="fortune-summary">{fortune.overall.summary}</p>
        </div>

        {/* 상세 설명 */}
        <div className="fortune-detail-card">
          <h3>📜 오늘의 운세</h3>
          <p>{fortune.overall.detail}</p>
        </div>

        {/* 카테고리별 운세 */}
        <div className="category-section">
          <h3>세부 운세</h3>
          <div className="category-grid">
            {Object.entries(fortune.categories).map(([key, value]) => (
              <div key={key} className="category-card">
                <div className="category-header">
                  <span className="category-icon">{getCategoryIcon(key)}</span>
                  <span className="category-name">{getCategoryLabel(key)}</span>
                </div>
                <div className={`category-score ${getScoreColor(value.score)}`}>
                  {value.score}점
                </div>
                <p className="category-message">{value.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 행운 정보 */}
        <div className="lucky-section">
          <h3>🍀 오늘의 행운</h3>
          <div className="lucky-grid">
            <div className="lucky-item">
              <span className="lucky-icon">🎨</span>
              <span className="lucky-label">행운의 색</span>
              <span className="lucky-value">{fortune.lucky.color}</span>
            </div>
            <div className="lucky-item">
              <span className="lucky-icon">🔢</span>
              <span className="lucky-label">행운의 숫자</span>
              <span className="lucky-value">{fortune.lucky.number}</span>
            </div>
            <div className="lucky-item">
              <span className="lucky-icon">🧭</span>
              <span className="lucky-label">행운의 방향</span>
              <span className="lucky-value">{fortune.lucky.direction}</span>
            </div>
            <div className="lucky-item">
              <span className="lucky-icon">⏰</span>
              <span className="lucky-label">행운의 시간</span>
              <span className="lucky-value">{fortune.lucky.time}</span>
            </div>
          </div>
        </div>

        {/* 오늘의 조언 */}
        <div className="advice-card">
          <h3>💡 오늘의 조언</h3>
          <p>{fortune.advice}</p>
        </div>

        {/* 하단 버튼 */}
        <div className="fortune-actions">
          <button
            className="action-btn secondary"
            onClick={() => navigate('/fortune/input')}
          >
            정보 수정
          </button>
          <button
            className="action-btn primary"
            onClick={() => navigate('/')}
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  )
}
