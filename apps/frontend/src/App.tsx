import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import BirthInput from './pages/BirthInput'
import TodayFortune from './pages/TodayFortune'
import FortuneHistory from './pages/FortuneHistory'
import FortuneRecordDetail from './pages/FortuneRecordDetail'
import KakaoCallback from './pages/KakaoCallback'
import Tarot from './pages/Tarot'
import TennisTarot from './pages/TennisTarot'
import SajuProfile from './pages/SajuProfile'
import BattleLobby from './pages/BattleLobby'
import BattleJoin from './pages/BattleJoin'
import BattleResult from './pages/BattleResult'
import MyPage from './pages/MyPage'
import NameInput from './pages/NameInput'
import NameResult from './pages/NameResult'
import Shop from './pages/Shop'
import PaymentCallback from './pages/PaymentCallback'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import About from './pages/About'
import BottomNav from './components/BottomNav'

export default function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/fortune/input" element={<BirthInput />} />
          <Route path="/fortune/today" element={<TodayFortune />} />
          <Route path="/fortune/history" element={<ProtectedRoute><FortuneHistory /></ProtectedRoute>} />
          <Route path="/fortune/record/:id" element={<FortuneRecordDetail />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/tarot" element={<Tarot />} />
          <Route path="/tennis-tarot" element={<TennisTarot />} />
          {/* Saju profile */}
          <Route path="/saju" element={<SajuProfile />} />
          {/* Battle routes */}
          <Route path="/battle" element={<BattleLobby />} />
          <Route path="/battle/join/:shareCode" element={<BattleJoin />} />
          <Route path="/battle/result/:battleId" element={<BattleResult />} />
          {/* MyPage */}
          <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
          {/* Name Analysis (이름 풀이) */}
          <Route path="/name" element={<NameInput />} />
          <Route path="/name/result" element={<NameResult />} />
          <Route path="/name/result/:id" element={<NameResult />} />
          {/* Shop & Payment (결제) */}
          <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
          <Route path="/payment/callback" element={<ProtectedRoute><PaymentCallback /></ProtectedRoute>} />
          {/* Legal pages */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/about" element={<About />} />
        </Routes>
        {/* 하단 고정 네비게이션 (앱 느낌) */}
        <BottomNav />
      </BrowserRouter>
    </AuthProvider>
    </HelmetProvider>
  )
}
